"use client";

import Link from "next/link";
import { useState } from "react";
import {
  difficultyLabel,
  formatDuration,
  type GameResult,
  type ReviewItem,
} from "@/lib/quiz";

export default function ResultClient({ result }: { result: GameResult }) {
  const [nickname, setNickname] = useState("");
  const [registered, setRegistered] = useState<string | null>(result.registeredNickname);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const wrongItems = result.review.filter((item) => !item.isCorrect);
  const visibleItems = showAll ? result.review : wrongItems;
  const accuracy = Math.round((result.correctCount / result.questionCount) * 100);

  async function register() {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || registering) return;

    setRegistering(true);
    setError(null);

    try {
      const response = await fetch(`/api/games/${result.gameId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "랭킹 등록에 실패했습니다.");
        if (data.nickname) setRegistered(data.nickname);
        return;
      }

      setRegistered(data.nickname);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:py-12">
      <section className="candy-card p-6 text-center sm:p-8">
        <div className="animate-candy-float text-5xl">
          {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "🎉" : "🍬"}
        </div>
        <p className="mt-3 text-sm font-black text-[var(--candy-ink-soft)]">
          {result.topicLabel} · {difficultyLabel(result.difficulty)} ·{" "}
          {result.questionCount}문제
        </p>
        <p className="mt-1 bg-gradient-to-r from-[#ff5fa2] via-[#8b5cf6] to-[#38bdf8] bg-clip-text text-6xl font-black text-transparent">
          {result.score.toLocaleString()}
        </p>
        <p className="text-sm font-black text-[var(--candy-ink-soft)]">점</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="정답" value={`${result.correctCount}/${result.questionCount}`} />
          <Stat label="정답률" value={`${accuracy}%`} />
          <Stat label="소요 시간" value={formatDuration(result.durationMs)} />
        </div>
      </section>

      <section className="candy-card p-5 sm:p-6">
        <h2 className="text-lg font-black">🏆 랭킹 등록</h2>
        {registered ? (
          <p className="mt-2 text-sm font-bold text-[var(--candy-ink-soft)]">
            <span className="text-[#6d28d9]">{registered}</span> 님으로 등록되었어요!
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs font-semibold text-[var(--candy-ink-soft)]">
              닉네임만 입력하면 바로 등록됩니다 (2~12자)
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") register();
                }}
                maxLength={12}
                placeholder="닉네임"
                className="min-w-0 flex-1 rounded-2xl border-2 border-[rgba(139,92,246,0.25)] bg-white px-4 py-3 font-bold outline-none placeholder:font-medium placeholder:text-[#a99cc4] focus:border-[#8b5cf6]"
              />
              <button
                type="button"
                onClick={register}
                disabled={nickname.trim().length < 2 || registering}
                className="candy-btn candy-btn-primary shrink-0 px-6"
              >
                {registering ? "등록 중" : "등록"}
              </button>
            </div>
          </>
        )}
        {error && (
          <p className="mt-2 text-xs font-bold text-[var(--candy-wrong)]">{error}</p>
        )}
      </section>

      <section className="candy-card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">
            {showAll ? "전체 문제 다시 보기" : `오답 리뷰 (${wrongItems.length}문제)`}
          </h2>
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="candy-chip border-[rgba(139,92,246,0.25)] text-xs"
          >
            {showAll ? "오답만" : "전체 보기"}
          </button>
        </div>

        {visibleItems.length === 0 ? (
          <p className="mt-4 text-center text-sm font-bold text-[var(--candy-ink-soft)]">
            🎊 전부 맞혔어요! 다시 볼 오답이 없습니다.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {visibleItems.map((item, order) => (
              <ReviewCard key={item.questionId} item={item} order={order + 1} />
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-2 pb-4">
        <Link href="/" className="candy-btn candy-btn-primary h-13 w-full py-3.5 text-base">
          한 판 더 하기
        </Link>
        <Link
          href="/leaderboard"
          className="candy-btn candy-btn-ghost h-12 w-full py-3 text-base"
        >
          🏆 랭킹 보드 보기
        </Link>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[rgba(139,92,246,0.08)] px-2 py-3">
      <div className="text-xs font-bold text-[var(--candy-ink-soft)]">{label}</div>
      <div className="mt-0.5 text-base font-black">{value}</div>
    </div>
  );
}

function ReviewCard({ item, order }: { item: ReviewItem; order: number }) {
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);

  async function report() {
    if (reported || reporting) return;
    setReporting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: item.questionId, reason: "" }),
      });
      if (response.ok) setReported(true);
    } finally {
      setReporting(false);
    }
  }

  return (
    <li
      className={`rounded-2xl border-2 p-4 ${
        item.isCorrect
          ? "border-[rgba(16,185,129,0.35)] bg-[#f0fdf9]"
          : "border-[rgba(244,63,94,0.3)] bg-[#fff7f8]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-black">
          <span className="mr-1.5 text-[var(--candy-ink-soft)]">Q{order}.</span>
          {item.prompt}
        </p>
        <button
          type="button"
          onClick={report}
          disabled={reported || reporting}
          className="shrink-0 rounded-full border border-[rgba(139,92,246,0.25)] bg-white px-2.5 py-1 text-[11px] font-bold text-[var(--candy-ink-soft)] disabled:opacity-60"
          title="문제 내용이 틀렸다면 신고해주세요"
        >
          {reported ? "신고됨" : "🚩 신고"}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {item.choices.map((choice, index) => {
          const isAnswer = index === item.answerIndex;
          const isMine = index === item.myChoiceIndex;
          return (
            <div
              key={index}
              className={`rounded-xl px-3 py-2 text-sm font-bold ${
                isAnswer
                  ? "bg-[rgba(16,185,129,0.16)] text-[#047857]"
                  : isMine
                    ? "bg-[rgba(244,63,94,0.14)] text-[#9f1239]"
                    : "bg-white/70 text-[var(--candy-ink-soft)]"
              }`}
            >
              {choice}
              {isAnswer && <span className="ml-2 text-xs">✓ 정답</span>}
              {isMine && !isAnswer && <span className="ml-2 text-xs">내 선택</span>}
            </div>
          );
        })}
        {item.myChoiceIndex === -1 && (
          <p className="text-xs font-bold text-[var(--candy-wrong)]">
            ⏰ 시간 안에 답하지 못했어요
          </p>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed font-semibold text-[var(--candy-ink-soft)]">
        {item.explanation}
      </p>
    </li>
  );
}
