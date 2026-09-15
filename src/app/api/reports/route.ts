import { NextResponse } from "next/server";
import { reportQuestion } from "@/lib/games";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rate = checkRateLimit("reports:" + clientIp(request), 20, 10 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "신고가 너무 잦습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const questionId = Number((body as { questionId?: unknown })?.questionId);
  const reason = String((body as { reason?: unknown })?.reason ?? "").slice(0, 200);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return NextResponse.json({ error: "문제 번호가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const outcome = await reportQuestion(questionId, reason);
    return NextResponse.json(outcome);
  } catch (error) {
    console.error("[POST /api/reports]", error);
    return NextResponse.json({ error: "신고를 접수하지 못했습니다." }, { status: 500 });
  }
}
