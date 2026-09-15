"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DIFFICULTIES,
  QUESTION_COUNTS,
  formatDuration,
  type Difficulty,
} from "@/lib/quiz";

type Entry = {
  rank: number;
  nickname: string;
  topic_label: string;
  score: number;
  correct_count: number;
  question_count: number;
  duration_ms: number;
  created_at: string;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [loaded, setLoaded] = useState<{
    key: string;
    entries?: Entry[];
    error?: string;
  } | null>(null);

  // 필터가 바뀌면 응답의 key가 달라지므로 자연스럽게 로딩 상태가 된다.
  const filterKey = `${difficulty}-${questionCount}`;
  const entries = loaded?.key === filterKey ? loaded.entries : undefined;
  const error = loaded?.key === filterKey ? loaded.error : undefined;
  const loading = loaded?.key !== filterKey;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/leaderboard?difficulty=${difficulty}&questionCount=${questionCount}`,
        );
        const data = await response.json();
        if (cancelled) return;

        setLoaded(
          response.ok
            ? { key: filterKey, entries: data.entries }
            : { key: filterKey, error: data.error ?? "랭킹을 불러오지 못했습니다." },
        );
      } catch {
        if (!cancelled) {
          setLoaded({ key: filterKey, error: "랭킹을 불러오지 못했습니다." });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [difficulty, questionCount, filterKey]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:py-12">
      <header className="text-center">
        <div className="text-4xl">🏆</div>
        <h1 className="mt-1 text-3xl font-black">랭킹 보드</h1>
        <p className="mt-1 text-xs font-semibold text-[var(--candy-ink-soft)]">
          난이도와 문항 수가 같은 기록끼리만 겨룹니다
        </p>
      </header>

      <section className="candy-card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDifficulty(item.value)}
              className={`candy-chip ${difficulty === item.value ? "candy-chip-active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setQuestionCount(count)}
              className={`candy-chip ${questionCount === count ? "candy-chip-active" : ""}`}
            >
              {count}문제
            </button>
          ))}
        </div>
      </section>

      <section className="candy-card overflow-hidden p-4 sm:p-5">
        {error && (
          <p className="py-8 text-center text-sm font-bold text-[var(--candy-wrong)]">
            {error}
          </p>
        )}

        {!error && loading && (
          <div className="flex justify-center py-10">
            <div className="animate-candy-spin h-8 w-8 rounded-full border-4 border-[rgba(139,92,246,0.25)] border-t-[#8b5cf6]" />
          </div>
        )}

        {!error && !loading && entries && entries.length === 0 && (
          <p className="py-10 text-center text-sm font-bold text-[var(--candy-ink-soft)]">
            아직 기록이 없어요. 첫 번째 주인공이 되어보세요!
          </p>
        )}

        {!error && !loading && entries && entries.length > 0 && (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li
                key={`${entry.rank}-${entry.nickname}-${entry.created_at}`}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${
                  entry.rank <= 3
                    ? "bg-gradient-to-r from-[rgba(255,95,162,0.12)] to-[rgba(56,189,248,0.12)]"
                    : "bg-white/70"
                }`}
              >
                <span className="w-8 shrink-0 text-center text-lg font-black">
                  {MEDALS[entry.rank - 1] ?? entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{entry.nickname}</p>
                  <p className="truncate text-xs font-semibold text-[var(--candy-ink-soft)]">
                    {entry.topic_label} · {entry.correct_count}/{entry.question_count}개 ·{" "}
                    {formatDuration(entry.duration_ms)}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-black text-[#6d28d9]">
                  {entry.score.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/" className="candy-btn candy-btn-primary w-full py-3.5 text-base">
        퀴즈 풀러 가기
      </Link>
    </main>
  );
}
