import { NextResponse } from "next/server";
import { GameStateError, answerQuestion, getGame } from "@/lib/games";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) {
    return NextResponse.json({ error: "게임을 찾을 수 없습니다." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const payload = (body ?? {}) as {
    questionId?: unknown;
    choiceIndex?: unknown;
    timeLeftSec?: unknown;
  };

  try {
    const outcome = await answerQuestion(game, {
      questionId: Number(payload.questionId),
      choiceIndex: Number(payload.choiceIndex ?? -1),
      timeLeftSec: Number(payload.timeLeftSec ?? 0),
    });
    return NextResponse.json(outcome);
  } catch (error) {
    if (error instanceof GameStateError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[POST /api/games/:id/answer]", error);
    return NextResponse.json({ error: "답안을 기록하지 못했습니다." }, { status: 500 });
  }
}
