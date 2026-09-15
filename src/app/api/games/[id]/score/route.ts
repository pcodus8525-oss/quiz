import { NextResponse } from "next/server";
import { getGame, registerScore } from "@/lib/games";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) {
    return NextResponse.json({ error: "게임을 찾을 수 없습니다." }, { status: 404 });
  }
  if (game.status !== "done") {
    return NextResponse.json(
      { error: "게임을 먼저 끝내야 랭킹에 등록할 수 있습니다." },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const nickname = String((body as { nickname?: unknown })?.nickname ?? "").trim();
  if (nickname.length < 2 || nickname.length > 12) {
    return NextResponse.json(
      { error: "닉네임은 2자 이상 12자 이하로 입력해주세요." },
      { status: 400 },
    );
  }

  try {
    const outcome = await registerScore(game, nickname);
    if (!outcome.registered) {
      return NextResponse.json(
        {
          error: "이미 " + outcome.nickname + " 으로 등록된 기록입니다.",
          nickname: outcome.nickname,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ nickname: outcome.nickname });
  } catch (error) {
    console.error("[POST /api/games/:id/score]", error);
    return NextResponse.json({ error: "랭킹 등록에 실패했습니다." }, { status: 500 });
  }
}
