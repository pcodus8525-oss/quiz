import { NextResponse } from "next/server";
import { getGame } from "@/lib/games";
import { getQuestionsByIds } from "@/lib/questions";
import type { PlayableQuestion } from "@/lib/quiz";

export const dynamic = "force-dynamic";

/** 진행 중인 게임의 문제 목록. 정답과 해설은 내려주지 않는다. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) {
    return NextResponse.json({ error: "게임을 찾을 수 없습니다." }, { status: 404 });
  }

  const questions = await getQuestionsByIds(game.question_ids.map(Number));
  const playable: PlayableQuestion[] = questions.map((q) => ({
    id: Number(q.id),
    type: q.type,
    prompt: q.prompt,
    choices: q.choices,
  }));

  return NextResponse.json({
    gameId: game.id,
    topicLabel: game.topic_label,
    difficulty: game.difficulty,
    status: game.status,
    questions: playable,
  });
}
