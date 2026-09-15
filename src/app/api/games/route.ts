import { NextResponse } from "next/server";
import { createGame } from "@/lib/games";
import { QuizGenerationError, acquireQuestions } from "@/lib/questions";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import {
  isDifficulty,
  isQuestionCount,
  toTopicSlug,
  type PlayableQuestion,
} from "@/lib/quiz";

export const maxDuration = 120;

export async function POST(request: Request) {
  const rate = checkRateLimit(`games:${clientIp(request)}`, 20, 10 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `요청이 너무 잦습니다. ${rate.retryAfterSec}초 후에 다시 시도해주세요.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { topic, difficulty, questionCount } = (body ?? {}) as {
    topic?: unknown;
    difficulty?: unknown;
    questionCount?: unknown;
  };

  const topicLabel = typeof topic === "string" ? topic.trim() : "";
  if (topicLabel.length < 2 || topicLabel.length > 40) {
    return NextResponse.json(
      { error: "주제는 2자 이상 40자 이하로 입력해주세요." },
      { status: 400 },
    );
  }
  if (!isDifficulty(difficulty)) {
    return NextResponse.json({ error: "난이도가 올바르지 않습니다." }, { status: 400 });
  }
  if (!isQuestionCount(questionCount)) {
    return NextResponse.json({ error: "문항 수가 올바르지 않습니다." }, { status: 400 });
  }

  const topicSlug = toTopicSlug(topicLabel);

  try {
    const questions = await acquireQuestions({
      topicSlug,
      topicLabel,
      difficulty,
      count: questionCount,
    });

    const gameId = await createGame({
      topicSlug,
      topicLabel,
      difficulty,
      questionIds: questions.map((q) => Number(q.id)),
    });

    const playable: PlayableQuestion[] = questions.map((q) => ({
      id: Number(q.id),
      type: q.type,
      prompt: q.prompt,
      choices: q.choices,
    }));

    return NextResponse.json({ gameId, topicLabel, difficulty, questions: playable });
  } catch (error) {
    console.error("[POST /api/games]", error);
    const message =
      error instanceof QuizGenerationError
        ? error.message
        : "문제를 만드는 데 실패했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
