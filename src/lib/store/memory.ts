import { REPORT_HIDE_THRESHOLD, type AnswerInput, type Difficulty } from "@/lib/quiz";
import type { GameRow, QuestionRow, ScoreRow, Store } from "./types";

type StoredQuestion = QuestionRow & {
  topic_slug: string;
  topic_label: string;
  difficulty: Difficulty;
  report_count: number;
  is_hidden: boolean;
  created_at: number;
};

type StoredScore = ScoreRow & {
  game_id: string;
  difficulty: Difficulty;
};

type MemoryState = {
  questions: StoredQuestion[];
  games: Map<string, GameRow>;
  scores: StoredScore[];
  nextQuestionId: number;
};

// 개발 중 hot reload 로 모듈이 다시 평가되어도 데이터가 날아가지 않게 전역에 붙여둔다.
const globalState = globalThis as unknown as { __quizMemoryStore?: MemoryState };

function state(): MemoryState {
  if (!globalState.__quizMemoryStore) {
    globalState.__quizMemoryStore = {
      questions: [],
      games: new Map(),
      scores: [],
      nextQuestionId: 1,
    };
  }
  return globalState.__quizMemoryStore;
}

function toRow(question: StoredQuestion): QuestionRow {
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    choices: question.choices,
    answer_index: question.answer_index,
    explanation: question.explanation,
  };
}

/** DB 없이 프로세스 메모리에만 저장하는 데모용 구현. 서버를 끄면 사라진다. */
export const memoryStore: Store = {
  async findQuestions({ topicSlug, difficulty, limit }) {
    const matches = state().questions.filter(
      (q) => q.topic_slug === topicSlug && q.difficulty === difficulty && !q.is_hidden,
    );
    return shuffle(matches).slice(0, limit).map(toRow);
  },

  async listRecentPrompts({ topicSlug, difficulty, limit }) {
    return state()
      .questions.filter((q) => q.topic_slug === topicSlug && q.difficulty === difficulty)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, limit)
      .map((q) => q.prompt);
  },

  async insertQuestions({ topicSlug, topicLabel, difficulty, questions }) {
    const store = state();
    const inserted: StoredQuestion[] = [];

    for (const draft of questions) {
      const duplicate = store.questions.some(
        (q) =>
          q.topic_slug === topicSlug &&
          q.difficulty === difficulty &&
          q.prompt === draft.prompt,
      );
      if (duplicate) continue;

      const row: StoredQuestion = {
        id: store.nextQuestionId++,
        topic_slug: topicSlug,
        topic_label: topicLabel,
        difficulty,
        type: draft.type,
        prompt: draft.prompt,
        choices: draft.choices,
        answer_index: draft.answerIndex,
        explanation: draft.explanation,
        report_count: 0,
        is_hidden: false,
        created_at: Date.now(),
      };
      store.questions.push(row);
      inserted.push(row);
    }

    return inserted.map(toRow);
  },

  async getQuestionsByIds(ids) {
    const byId = new Map(state().questions.map((q) => [q.id, q]));
    return ids
      .map((id) => byId.get(Number(id)))
      .filter((q): q is StoredQuestion => Boolean(q))
      .map(toRow);
  },

  async reportQuestion(questionId) {
    const question = state().questions.find((q) => q.id === Number(questionId));
    if (!question) return { reportCount: 0, hidden: false };

    question.report_count += 1;
    question.is_hidden = question.report_count >= REPORT_HIDE_THRESHOLD;
    return { reportCount: question.report_count, hidden: question.is_hidden };
  },

  async createGame({ topicSlug, topicLabel, difficulty, questionIds }) {
    const game: GameRow = {
      id: crypto.randomUUID(),
      topic_slug: topicSlug,
      topic_label: topicLabel,
      difficulty,
      question_count: questionIds.length,
      question_ids: questionIds,
      status: "playing",
      answers: null,
      score: null,
      correct_count: null,
      duration_ms: null,
      created_at: new Date().toISOString(),
    };
    state().games.set(game.id, game);
    return game;
  },

  async getGame(id) {
    return state().games.get(id) ?? null;
  },

  async saveGameAnswers(id: string, answers: AnswerInput[]) {
    const game = state().games.get(id);
    if (game && game.status === "playing") game.answers = answers;
  },

  async finishGame(id, result) {
    const game = state().games.get(id);
    if (!game || game.status === "done") return;

    game.status = "done";
    game.answers = result.answers;
    game.score = result.score;
    game.correct_count = result.correctCount;
    game.duration_ms = result.durationMs;
  },

  async registerScore(params) {
    const store = state();
    const existing = store.scores.find((s) => s.game_id === params.gameId);
    if (existing) return { registered: false, nickname: existing.nickname };

    store.scores.push({
      game_id: params.gameId,
      nickname: params.nickname,
      topic_label: params.topicLabel,
      difficulty: params.difficulty,
      question_count: params.questionCount,
      score: params.score,
      correct_count: params.correctCount,
      duration_ms: params.durationMs,
      created_at: new Date().toISOString(),
    });
    return { registered: true, nickname: params.nickname };
  },

  async getScoreNickname(gameId) {
    return state().scores.find((s) => s.game_id === gameId)?.nickname ?? null;
  },

  async listScores({ difficulty, questionCount, limit }) {
    return state()
      .scores.filter(
        (s) => s.difficulty === difficulty && s.question_count === questionCount,
      )
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.duration_ms - b.duration_ms ||
          a.created_at.localeCompare(b.created_at),
      )
      .slice(0, limit);
  },
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
