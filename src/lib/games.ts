import { getQuestionsByIds } from "./questions";
import { getStore, type GameRow, type QuestionRow } from "./store";
import {
  POINTS_PER_CORRECT,
  QUESTION_TIME_SEC,
  TIME_BONUS_PER_SEC,
  difficultyMultiplier,
  type AnswerInput,
  type Difficulty,
  type GameResult,
  type ReviewItem,
} from "./quiz";

export type { GameRow } from "./store";

/** 문제 로딩·네트워크 지연을 감안해 서버 경과 시간에서 빼주는 여유분(초). */
const ELAPSED_GRACE_SEC = 5;

export class GameStateError extends Error {}

export async function createGame(params: {
  topicSlug: string;
  topicLabel: string;
  difficulty: Difficulty;
  questionIds: number[];
}): Promise<string> {
  const game = await getStore().createGame(params);
  return game.id;
}

export async function getGame(id: string): Promise<GameRow | null> {
  return getStore().getGame(id);
}

/**
 * 문항 하나의 답을 서버에 기록하고 정답 여부를 돌려준다.
 * 정답은 이 시점에만 공개되므로 미리 훔쳐볼 수 없다.
 */
export async function answerQuestion(
  game: GameRow,
  input: AnswerInput,
): Promise<{ isCorrect: boolean; answerIndex: number; explanation: string }> {
  if (game.status === "done") {
    throw new GameStateError("이미 끝난 게임입니다.");
  }
  if (!game.question_ids.map(Number).includes(Number(input.questionId))) {
    throw new GameStateError("이 게임에 속한 문제가 아닙니다.");
  }

  const [question] = await getQuestionsByIds([Number(input.questionId)]);
  if (!question) {
    throw new GameStateError("문제를 찾을 수 없습니다.");
  }

  const stored = game.answers ?? [];
  const already = stored.find((a) => Number(a.questionId) === Number(input.questionId));

  if (!already) {
    await getStore().saveGameAnswers(game.id, [
      ...stored,
      {
        questionId: Number(input.questionId),
        choiceIndex: Number.isInteger(input.choiceIndex) ? input.choiceIndex : -1,
        timeLeftSec: clamp(input.timeLeftSec, 0, QUESTION_TIME_SEC),
      },
    ]);
  }

  const choiceIndex = already ? already.choiceIndex : input.choiceIndex;
  return {
    isCorrect: choiceIndex === question.answer_index,
    answerIndex: question.answer_index,
    explanation: question.explanation,
  };
}

/**
 * 서버에 기록된 답안만으로 채점한다.
 * 이미 제출된 게임이면 저장된 결과를 그대로 돌려준다.
 */
export async function submitGame(game: GameRow): Promise<GameResult> {
  if (game.status === "done") {
    return buildResult(game);
  }

  const questions = await getQuestionsByIds(game.question_ids.map(Number));
  const answerByQuestion = new Map(
    (game.answers ?? []).map((a) => [Number(a.questionId), a]),
  );

  let correctCount = 0;
  let clientUsedSec = 0;

  const answers: AnswerInput[] = questions.map((question) => {
    const stored = answerByQuestion.get(Number(question.id));
    const timeLeftSec = clamp(stored?.timeLeftSec ?? 0, 0, QUESTION_TIME_SEC);
    const choiceIndex = stored?.choiceIndex ?? -1;

    clientUsedSec += QUESTION_TIME_SEC - timeLeftSec;
    if (choiceIndex === question.answer_index) correctCount++;

    return { questionId: Number(question.id), choiceIndex, timeLeftSec };
  });

  // 브라우저가 보고한 소요 시간이 서버가 잰 실제 경과 시간보다 짧으면
  // 서버 기준을 따른다. (시간 보너스를 부풀리는 조작 방지)
  const totalSec = QUESTION_TIME_SEC * questions.length;
  const serverElapsedSec =
    (Date.now() - new Date(game.created_at).getTime()) / 1000 - ELAPSED_GRACE_SEC;
  const usedSec = clamp(Math.max(clientUsedSec, serverElapsedSec), 0, totalSec);
  const remainingSec = totalSec - usedSec;

  const score = Math.round(
    correctCount * POINTS_PER_CORRECT * difficultyMultiplier(game.difficulty) +
      remainingSec * TIME_BONUS_PER_SEC,
  );
  const durationMs = Math.round(usedSec * 1000);

  await getStore().finishGame(game.id, { answers, score, correctCount, durationMs });

  return buildResult(
    {
      ...game,
      status: "done",
      answers,
      score,
      correct_count: correctCount,
      duration_ms: durationMs,
    },
    questions,
  );
}

export async function buildResult(
  game: GameRow,
  preloaded?: QuestionRow[],
): Promise<GameResult> {
  const questions = preloaded ?? (await getQuestionsByIds(game.question_ids.map(Number)));
  const answerByQuestion = new Map(
    (game.answers ?? []).map((a) => [Number(a.questionId), a]),
  );

  const review: ReviewItem[] = questions.map((q) => {
    const myChoiceIndex = answerByQuestion.get(Number(q.id))?.choiceIndex ?? -1;
    return {
      questionId: Number(q.id),
      type: q.type,
      prompt: q.prompt,
      choices: q.choices,
      answerIndex: q.answer_index,
      explanation: q.explanation,
      myChoiceIndex,
      isCorrect: myChoiceIndex === q.answer_index,
    };
  });

  return {
    gameId: game.id,
    topicLabel: game.topic_label,
    difficulty: game.difficulty,
    questionCount: game.question_count,
    score: game.score ?? 0,
    correctCount: game.correct_count ?? 0,
    durationMs: game.duration_ms ?? 0,
    registeredNickname: await getStore().getScoreNickname(game.id),
    review,
  };
}

export async function registerScore(
  game: GameRow,
  nickname: string,
): Promise<{ registered: boolean; nickname: string }> {
  return getStore().registerScore({
    gameId: game.id,
    nickname,
    topicLabel: game.topic_label,
    difficulty: game.difficulty,
    questionCount: game.question_count,
    score: game.score ?? 0,
    correctCount: game.correct_count ?? 0,
    durationMs: game.duration_ms ?? 0,
  });
}

export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  topic_label: string;
  score: number;
  correct_count: number;
  question_count: number;
  duration_ms: number;
  created_at: string;
};

export async function getLeaderboard(params: {
  difficulty: Difficulty;
  questionCount: number;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const rows = await getStore().listScores({
    difficulty: params.difficulty,
    questionCount: params.questionCount,
    limit: params.limit ?? 50,
  });
  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

export async function reportQuestion(
  questionId: number,
  reason: string,
): Promise<{ hidden: boolean; reportCount: number }> {
  return getStore().reportQuestion(questionId, reason);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
