"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CATEGORIES,
  DIFFICULTIES,
  QUESTION_COUNTS,
  QUESTION_TIME_SEC,
  type Difficulty,
} from "@/lib/quiz";

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = topic.trim().length >= 2 && !loading;

  async function startGame() {
    if (!canStart) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), difficulty, questionCount }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "문제를 만들지 못했습니다.");
        setLoading(false);
        return;
      }

      router.push(`/play/${data.gameId}`);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="text-center">
        <div className="animate-candy-float text-5xl">🍭</div>
        <h1 className="mt-2 bg-gradient-to-r from-[#ff5fa2] via-[#8b5cf6] to-[#38bdf8] bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
          Quiz Play
        </h1>
        <p className="mt-2 text-sm font-semibold text-[var(--candy-ink-soft)] sm:text-base">
          주제만 정하면 AI가 즉석에서 퀴즈를 만들어드려요
        </p>
      </header>

      <section className="candy-card p-5 sm:p-6">
        <h2 className="text-lg font-black">1. 어떤 주제로 풀까요?</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setTopic(category.label)}
              className={`candy-chip ${topic === category.label ? "candy-chip-active" : ""}`}
            >
              <span className="mr-1">{category.emoji}</span>
              {category.label}
            </button>
          ))}
        </div>

        <input
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") startGame();
          }}
          maxLength={40}
          placeholder="직접 입력: 예) 조선시대 왕들, 마블 영화"
          className="mt-4 w-full rounded-2xl border-2 border-[rgba(139,92,246,0.25)] bg-white px-4 py-3 text-base font-bold outline-none placeholder:font-medium placeholder:text-[#a99cc4] focus:border-[#8b5cf6]"
        />
      </section>

      <section className="candy-card p-5 sm:p-6">
        <h2 className="text-lg font-black">2. 난이도</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDifficulty(item.value)}
              className={`rounded-2xl border-2 px-2 py-3 text-center transition ${
                difficulty === item.value
                  ? "border-transparent bg-gradient-to-br from-[#ff5fa2] to-[#8b5cf6] text-white shadow-lg"
                  : "border-[rgba(139,92,246,0.2)] bg-white"
              }`}
            >
              <div className="text-base font-black">{item.label}</div>
              <div
                className={`mt-0.5 text-[11px] font-semibold ${
                  difficulty === item.value ? "text-white/80" : "text-[var(--candy-ink-soft)]"
                }`}
              >
                x{item.multiplier.toFixed(1)} 점수
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="candy-card p-5 sm:p-6">
        <h2 className="text-lg font-black">3. 문항 수</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setQuestionCount(count)}
              className={`rounded-2xl border-2 px-2 py-3 text-center text-base font-black transition ${
                questionCount === count
                  ? "border-transparent bg-gradient-to-br from-[#8b5cf6] to-[#38bdf8] text-white shadow-lg"
                  : "border-[rgba(139,92,246,0.2)] bg-white"
              }`}
            >
              {count}문제
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-[var(--candy-ink-soft)]">
          문항당 제한 시간은 {QUESTION_TIME_SEC}초예요. 빨리 맞힐수록 보너스 점수를 받습니다.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border-2 border-[var(--candy-wrong)] bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#9f1239]">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={startGame}
        disabled={!canStart}
        className="candy-btn candy-btn-primary h-14 w-full text-lg"
      >
        {loading ? (
          <>
            <span className="animate-candy-spin inline-block h-5 w-5 rounded-full border-[3px] border-white/40 border-t-white" />
            문제 만드는 중...
          </>
        ) : (
          "게임 시작하기"
        )}
      </button>

      {loading && (
        <p className="-mt-3 text-center text-xs font-semibold text-[var(--candy-ink-soft)]">
          처음 보는 주제는 AI가 문제를 만드느라 15초쯤 걸릴 수 있어요
        </p>
      )}

      <Link
        href="/leaderboard"
        className="candy-btn candy-btn-ghost h-12 w-full text-base"
      >
        🏆 랭킹 보드 보기
      </Link>

      <footer className="pb-4 text-center text-xs font-semibold text-[var(--candy-ink-soft)]">
        문제는 AI가 생성합니다. 틀린 내용이 보이면 결과 화면에서 신고해주세요.
      </footer>
    </main>
  );
}
