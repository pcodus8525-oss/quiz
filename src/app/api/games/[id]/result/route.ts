import { NextResponse } from "next/server";
import { buildResult, getGame } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) {
    return NextResponse.json({ error: "게임을 찾을 수 없습니다." }, { status: 404 });
  }
  if (game.status !== "done") {
    return NextResponse.json({ error: "아직 제출되지 않은 게임입니다." }, { status: 409 });
  }

  return NextResponse.json(await buildResult(game));
}
