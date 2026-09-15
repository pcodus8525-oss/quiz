import { openai } from "@ai-sdk/openai";
import { NoObjectGeneratedError, generateObject } from "ai";
import { z } from "zod";
import { difficultyLabel, type Difficulty, type QuestionType } from "./quiz";

// 구조화 출력(JSON 스키마)을 안정적으로 지켜주는 모델을 기본값으로 둔다.
// gpt-5-mini 는 같은 프롬프트에서 JSON 대신 잡음을 뱉는 일이 잦아 쓰지 않는다.
// gpt-5.6-luna 는 신규 주제 5건 검증에서 형식 오류 0으로 안정적이었다.
const DEFAULT_MODEL = "gpt-5.6-luna";

/**
 * 추론 모델이 가끔 JSON 대신 잡음을 뱉어 파싱이 깨진다.
 * 그때는 같은 요청을 다시 던져서 모자란 문항만 채운다.
 */
const MAX_ATTEMPTS = 3;

const generatedQuestionSchema = z.object({
  type: z
    .enum(["mc4", "ox"])
    .describe("mc4 = 보기 4개짜리 객관식, ox = O/X 문제"),
  prompt: z.string().describe("문제 본문. 한국어 한 문장으로."),
  choices: z
    .array(z.string())
    .describe("mc4면 보기 4개, ox면 정확히 ['O', 'X']"),
  answerIndex: z.number().int().describe("choices 배열에서 정답의 인덱스 (0부터)"),
  explanation: z.string().describe("정답인 이유를 1~2문장으로 설명"),
});

const responseSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

export type GeneratedQuestion = {
  type: QuestionType;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  easy: "해당 주제를 잘 모르는 사람도 상식선에서 맞힐 수 있는 수준",
  normal: "주제에 관심이 있는 사람이라면 맞힐 수 있는 수준",
  hard: "해당 주제를 깊이 파본 사람만 맞힐 수 있는 수준",
};

/**
 * OpenAI로 퀴즈 문제를 생성한다.
 * 스키마를 벗어나거나 형식이 어긋난 문제는 버리고 정상인 것만 돌려준다.
 */
export async function generateQuestions(params: {
  topicLabel: string;
  difficulty: Difficulty;
  count: number;
  avoidPrompts?: string[];
}): Promise<GeneratedQuestion[]> {
  const { topicLabel, difficulty, count, avoidPrompts = [] } = params;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY 환경 변수가 없습니다. .env.local 에 OpenAI API 키를 넣어주세요.",
    );
  }

  const collected: GeneratedQuestion[] = [];
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && collected.length < count; attempt++) {
    const seen = [...avoidPrompts, ...collected.map((q) => q.prompt)];
    try {
      const batch = await requestQuestions({
        topicLabel,
        difficulty,
        count: count - collected.length,
        avoidPrompts: seen,
      });
      collected.push(...batch.filter((q) => !collected.some((c) => c.prompt === q.prompt)));
    } catch (error) {
      lastError = error;
      // 파싱 실패는 재시도로 회복되는 경우가 많아 다음 시도로 넘어간다.
      if (!NoObjectGeneratedError.isInstance(error)) throw error;
      console.warn(`[ai] 문제 생성 ${attempt}번째 시도 실패 (응답 파싱 불가)`);
    }
  }

  if (collected.length === 0) {
    throw lastError instanceof Error
      ? lastError
      : new Error("문제를 생성하지 못했습니다.");
  }

  return collected;
}

async function requestQuestions(params: {
  topicLabel: string;
  difficulty: Difficulty;
  count: number;
  avoidPrompts: string[];
}): Promise<GeneratedQuestion[]> {
  const { topicLabel, difficulty, count, avoidPrompts } = params;

  const avoidBlock =
    avoidPrompts.length > 0
      ? `\n\n아래 문제들은 이미 출제된 것이니 내용이 겹치지 않게 피해주세요:\n${avoidPrompts
          .slice(0, 40)
          .map((p) => `- ${p}`)
          .join("\n")}`
      : "";

  const modelId = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const { object } = await generateObject({
    model: openai(modelId),
    schema: responseSchema,
    // 추론 모델을 쓸 경우, 추론을 길게 돌릴수록 구조화 출력이 어긋나므로 낮게 고정한다.
    ...(isReasoningModel(modelId)
      ? { providerOptions: { openai: { reasoningEffort: "low" as const } } }
      : {}),
    system: [
      "당신은 한국어 퀴즈 게임의 출제자입니다.",
      "사실에 근거한 문제만 내고, 정답이 명확하게 하나로 떨어지는 문제만 출제합니다.",
      "논쟁의 여지가 있거나 시점에 따라 답이 바뀌는 문제(예: 현재 순위, 최신 기록)는 내지 않습니다.",
      "보기에 '정답 없음', '위 모두 해당' 같은 항목을 넣지 않습니다.",
      "정답의 위치는 보기 사이에 골고루 섞습니다.",
    ].join(" "),
    prompt: [
      `주제: ${topicLabel}`,
      `난이도: ${difficultyLabel(difficulty)} (${DIFFICULTY_GUIDE[difficulty]})`,
      `개수: ${count}문제`,
      "",
      "규칙:",
      "- 전체의 약 70%는 4지선다(mc4), 30%는 O/X(ox) 문제로 구성합니다.",
      "- mc4는 choices에 보기 4개를 넣습니다. 오답 보기도 그럴듯해야 합니다.",
      "- ox는 choices를 반드시 [\"O\", \"X\"] 로 하고, 문제 본문은 참/거짓을 판단할 서술문으로 씁니다.",
      "- explanation에는 정답 근거를 1~2문장으로 씁니다.",
      "- 모든 텍스트는 한국어로 씁니다.",
      "- 서로 다른 세부 소재를 다뤄 문제끼리 겹치지 않게 합니다.",
      avoidBlock,
    ].join("\n"),
  });

  return object.questions.filter(isValidQuestion).map((q) => ({
    type: q.type,
    prompt: q.prompt.trim(),
    choices: q.type === "ox" ? ["O", "X"] : q.choices.map((c) => c.trim()),
    answerIndex: q.answerIndex,
    explanation: q.explanation.trim(),
  }));
}

function isValidQuestion(q: z.infer<typeof generatedQuestionSchema>): boolean {
  if (!q.prompt.trim()) return false;

  const expectedChoices = q.type === "ox" ? 2 : 4;
  if (q.choices.length !== expectedChoices) return false;
  if (q.choices.some((c) => !c.trim())) return false;

  // 보기가 중복되면 정답이 둘이 되어버린다.
  const unique = new Set(q.choices.map((c) => c.trim()));
  if (unique.size !== q.choices.length) return false;

  return Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex < expectedChoices;
}

/** gpt-5 / o 시리즈처럼 추론 토큰을 쓰는 모델인지. */
function isReasoningModel(modelId: string): boolean {
  return /^(gpt-5|o\d)/.test(modelId);
}
