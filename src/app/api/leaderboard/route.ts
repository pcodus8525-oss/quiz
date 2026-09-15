import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/games";
import { isDifficulty, isQuestionCount } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const difficulty = url.searchParams.get("difficulty") ?? "normal";
  const questionCount = Number(url.searchParams.get("questionCount") ?? 10);

  if (!isDifficulty(difficulty) || !isQuestionCount(questionCount)) {
    return NextResponse.json({ error: "조회 조건이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const entries = await getLeaderboard({ difficulty, questionCount });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[GET /api/leaderboard]", error);
    return NextResponse.json({ error: "랭킹을 불러오지 못했습니다." }, { status: 500 });
  }
}
