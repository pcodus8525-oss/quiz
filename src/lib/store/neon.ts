import { getSql } from "@/lib/db";
import { REPORT_HIDE_THRESHOLD, type AnswerInput } from "@/lib/quiz";
import type { GameRow, QuestionRow, ScoreRow, Store } from "./types";

/** Neon(Postgres) 구현. DATABASE_URL 이 설정되어 있을 때 쓰인다. */
export const neonStore: Store = {
  async findQuestions({ topicSlug, difficulty, limit }) {
    const sql = getSql();
    const rows = await sql`
      SELECT id, type, prompt, choices, answer_index, explanation
      FROM questions
      WHERE topic_slug = ${topicSlug}
        AND difficulty = ${difficulty}
        AND is_hidden = FALSE
      ORDER BY random()
      LIMIT ${limit}
    `;
    return rows as QuestionRow[];
  },

  async listRecentPrompts({ topicSlug, difficulty, limit }) {
    const sql = getSql();
    const rows = await sql`
      SELECT prompt
      FROM questions
      WHERE topic_slug = ${topicSlug} AND difficulty = ${difficulty}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return (rows as { prompt: string }[]).map((r) => r.prompt);
  },

  async insertQuestions({ topicSlug, topicLabel, difficulty, questions }) {
    if (questions.length === 0) return [];

    const sql = getSql();
    const values: unknown[] = [];
    const placeholders = questions.map((q, i) => {
      const base = i * 8;
      values.push(
        topicSlug,
        topicLabel,
        difficulty,
        q.type,
        q.prompt,
        JSON.stringify(q.choices),
        q.answerIndex,
        q.explanation,
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}::jsonb, $${base + 7}, $${base + 8})`;
    });

    const rows = await sql.query(
      `INSERT INTO questions
         (topic_slug, topic_label, difficulty, type, prompt, choices, answer_index, explanation)
       VALUES ${placeholders.join(", ")}
       ON CONFLICT (topic_slug, difficulty, md5(prompt)) DO NOTHING
       RETURNING id, type, prompt, choices, answer_index, explanation`,
      values,
    );

    return rows as unknown as QuestionRow[];
  },

  async getQuestionsByIds(ids) {
    if (ids.length === 0) return [];
    const sql = getSql();
    const rows = await sql`
      SELECT id, type, prompt, choices, answer_index, explanation
      FROM questions
      WHERE id = ANY(${ids}::bigint[])
    `;
    const byId = new Map((rows as QuestionRow[]).map((r) => [Number(r.id), r]));
    return ids.map((id) => byId.get(Number(id))).filter((r): r is QuestionRow => Boolean(r));
  },

  async reportQuestion(questionId, reason) {
    const sql = getSql();
    await sql`INSERT INTO reports (question_id, reason) VALUES (${questionId}, ${reason})`;
    const rows = await sql`
      UPDATE questions
      SET report_count = report_count + 1,
          is_hidden = (report_count + 1) >= ${REPORT_HIDE_THRESHOLD}
      WHERE id = ${questionId}
      RETURNING report_count, is_hidden
    `;
    const row = (rows as { report_count: number; is_hidden: boolean }[])[0];
    return { reportCount: row?.report_count ?? 0, hidden: row?.is_hidden ?? false };
  },

  async createGame({ topicSlug, topicLabel, difficulty, questionIds }) {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO games (id, topic_slug, topic_label, difficulty, question_count, question_ids)
      VALUES (
        ${crypto.randomUUID()},
        ${topicSlug},
        ${topicLabel},
        ${difficulty},
        ${questionIds.length},
        ${JSON.stringify(questionIds)}::jsonb
      )
      RETURNING *
    `;
    return (rows as GameRow[])[0];
  },

  async getGame(id) {
    const sql = getSql();
    const rows = await sql`SELECT * FROM games WHERE id = ${id}`;
    return (rows as GameRow[])[0] ?? null;
  },

  async saveGameAnswers(id: string, answers: AnswerInput[]) {
    const sql = getSql();
    await sql`
      UPDATE games
      SET answers = ${JSON.stringify(answers)}::jsonb
      WHERE id = ${id} AND status = 'playing'
    `;
  },

  async finishGame(id, result) {
    const sql = getSql();
    await sql`
      UPDATE games
      SET status = 'done',
          answers = ${JSON.stringify(result.answers)}::jsonb,
          score = ${result.score},
          correct_count = ${result.correctCount},
          duration_ms = ${result.durationMs},
          submitted_at = now()
      WHERE id = ${id} AND status = 'playing'
    `;
  },

  async registerScore(params) {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO scores
        (game_id, nickname, topic_label, difficulty, question_count, score, correct_count, duration_ms)
      VALUES (
        ${params.gameId},
        ${params.nickname},
        ${params.topicLabel},
        ${params.difficulty},
        ${params.questionCount},
        ${params.score},
        ${params.correctCount},
        ${params.durationMs}
      )
      ON CONFLICT (game_id) DO NOTHING
      RETURNING nickname
    `;
    const inserted = (rows as { nickname: string }[])[0];
    if (inserted) return { registered: true, nickname: inserted.nickname };

    return {
      registered: false,
      nickname: (await neonStore.getScoreNickname(params.gameId)) ?? params.nickname,
    };
  },

  async getScoreNickname(gameId) {
    const sql = getSql();
    const rows = await sql`SELECT nickname FROM scores WHERE game_id = ${gameId}`;
    return (rows as { nickname: string }[])[0]?.nickname ?? null;
  },

  async listScores({ difficulty, questionCount, limit }) {
    const sql = getSql();
    const rows = await sql`
      SELECT nickname, topic_label, score, correct_count, question_count, duration_ms, created_at
      FROM scores
      WHERE difficulty = ${difficulty} AND question_count = ${questionCount}
      ORDER BY score DESC, duration_ms ASC, created_at ASC
      LIMIT ${limit}
    `;
    return rows as ScoreRow[];
  },
};
