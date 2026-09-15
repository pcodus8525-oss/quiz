import { NextResponse } from "next/server";
import { getGame, submitGame } from "@/lib/games";

/** 채점은 서버에 기록된 답안만으로 이뤄지므로 요청 본문이 필요 없다. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) {
    return NextResponse.json({ error: "게임을 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    return NextResponse.json(await submitGame(game));
  } catch (error) {
    console.error("[POST /api/games/:id/submit]", error);
    return NextResponse.json({ error: "채점에 실패했습니다." }, { status: 500 });
  }
}
