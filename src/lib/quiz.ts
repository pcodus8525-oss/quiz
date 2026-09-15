/** 클라이언트와 서버가 함께 쓰는 퀴즈 도메인 상수 및 타입. */

export const QUESTION_TIME_SEC = 20;
export const QUESTION_COUNTS = [5, 10, 20] as const;
export const POINTS_PER_CORRECT = 100;
export const TIME_BONUS_PER_SEC = 5;
/** 신고가 이 건수를 넘으면 문제를 캐시에서 자동으로 숨긴다. */
export const REPORT_HIDE_THRESHOLD = 3;

export type Difficulty = "easy" | "normal" | "hard";
export type QuestionType = "mc4" | "ox";

export const DIFFICULTIES: {
  value: Difficulty;
  label: string;
  multiplier: number;
  hint: string;
}[] = [
  { value: "easy", label: "쉬움", multiplier: 1.0, hint: "가볍게 즐기기" },
  { value: "normal", label: "보통", multiplier: 1.3, hint: "적당한 도전" },
  { value: "hard", label: "어려움", multiplier: 1.6, hint: "고수용" },
];

export const CATEGORIES: { slug: string; label: string; emoji: string }[] = [
  { slug: "역사", label: "역사", emoji: "🏛️" },
  { slug: "과학", label: "과학", emoji: "🔬" },
  { slug: "스포츠", label: "스포츠", emoji: "⚽" },
  { slug: "영화 드라마", label: "영화·드라마", emoji: "🎬" },
  { slug: "k-pop", label: "K-POP", emoji: "🎤" },
  { slug: "일반 상식", label: "일반 상식", emoji: "💡" },
];

export function difficultyMultiplier(difficulty: Difficulty): number {
  return DIFFICULTIES.find((d) => d.value === difficulty)?.multiplier ?? 1;
}

export function difficultyLabel(difficulty: Difficulty): string {
  return DIFFICULTIES.find((d) => d.value === difficulty)?.label ?? difficulty;
}

export function isDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "normal" || value === "hard";
}

export function isQuestionCount(value: unknown): value is 5 | 10 | 20 {
  return QUESTION_COUNTS.includes(value as 5 | 10 | 20);
}

/**
 * 주제 문자열을 캐시 키로 쓸 슬러그로 정규화한다.
 * 한글은 그대로 두고, 대소문자·공백·문장부호 차이만 흡수한다.
 */
export function toTopicSlug(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 클라이언트로 내려가는 문제 (정답·해설 제외). */
export type PlayableQuestion = {
  id: number;
  type: QuestionType;
  prompt: string;
  choices: string[];
};

export type AnswerInput = {
  questionId: number;
  /** 고른 보기 인덱스. 시간 초과·미응답은 -1. */
  choiceIndex: number;
  /** 남은 시간(초). 서버에서 0~QUESTION_TIME_SEC 로 보정한다. */
  timeLeftSec: number;
};

export type ReviewItem = {
  questionId: number;
  type: QuestionType;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  myChoiceIndex: number;
  isCorrect: boolean;
};

export type GameResult = {
  gameId: string;
  topicLabel: string;
  difficulty: Difficulty;
  questionCount: number;
  score: number;
  correctCount: number;
  durationMs: number;
  registeredNickname: string | null;
  review: ReviewItem[];
};

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}
