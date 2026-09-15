import type { AnswerInput, Difficulty, QuestionType } from "@/lib/quiz";

export type QuestionRow = {
  id: number;
  type: QuestionType;
  prompt: string;
  choices: string[];
  answer_index: number;
  explanation: string;
};

export type QuestionDraft = {
  type: QuestionType;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type GameRow = {
  id: string;
  topic_slug: string;
  topic_label: string;
  difficulty: Difficulty;
  question_count: number;
  question_ids: number[];
  status: "playing" | "done";
  answers: AnswerInput[] | null;
  score: number | null;
  correct_count: number | null;
  duration_ms: number | null;
  created_at: string;
};

export type ScoreRow = {
  nickname: string;
  topic_label: string;
  score: number;
  correct_count: number;
  question_count: number;
  duration_ms: number;
  created_at: string;
};

/**
 * 저장소 인터페이스.
 * DATABASE_URL 이 있으면 Neon, 없으면 인메모리 구현이 쓰인다.
 */
export interface Store {
  findQuestions(params: {
    topicSlug: string;
    difficulty: Difficulty;
    limit: number;
  }): Promise<QuestionRow[]>;

  listRecentPrompts(params: {
    topicSlug: string;
    difficulty: Difficulty;
    limit: number;
  }): Promise<string[]>;

  insertQuestions(params: {
    topicSlug: string;
    topicLabel: string;
    difficulty: Difficulty;
    questions: QuestionDraft[];
  }): Promise<QuestionRow[]>;

  getQuestionsByIds(ids: number[]): Promise<QuestionRow[]>;

  reportQuestion(
    questionId: number,
    reason: string,
  ): Promise<{ reportCount: number; hidden: boolean }>;

  createGame(params: {
    topicSlug: string;
    topicLabel: string;
    difficulty: Difficulty;
    questionIds: number[];
  }): Promise<GameRow>;

  getGame(id: string): Promise<GameRow | null>;

  saveGameAnswers(id: string, answers: AnswerInput[]): Promise<void>;

  finishGame(
    id: string,
    result: {
      answers: AnswerInput[];
      score: number;
      correctCount: number;
      durationMs: number;
    },
  ): Promise<void>;

  registerScore(params: {
    gameId: string;
    nickname: string;
    topicLabel: string;
    difficulty: Difficulty;
    questionCount: number;
    score: number;
    correctCount: number;
    durationMs: number;
  }): Promise<{ registered: boolean; nickname: string }>;

  getScoreNickname(gameId: string): Promise<string | null>;

  listScores(params: {
    difficulty: Difficulty;
    questionCount: number;
    limit: number;
  }): Promise<ScoreRow[]>;
}
