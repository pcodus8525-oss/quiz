"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  QUESTION_TIME_SEC,
  difficultyLabel,
  type Difficulty,
  type PlayableQuestion,
} from "@/lib/quiz";

type Reveal = {
  isCorrect: boolean;
  answerIndex: number;
  explanation: string;
  myChoiceIndex: number;
};

const REVEAL_MS = 1800;

export default function PlayClient({ gameId }: { gameId: string }) {
  const router = useRouter();

  const [questions, setQuestions] = useState<PlayableQuestion[] | null>(null);
  const [topicLabel, setTopicLabel] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SEC);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const deadlineRef = useRef<number>(0);
  const lockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setError(data.error ?? "게임을 불러오지 못했습니다.");
          return;
        }
        if (data.status === "done") {
          router.replace(`/result/${gameId}`);
          return;
        }

        deadlineRef.current = Date.now() + QUESTION_TIME_SEC * 1000;
        setQuestions(data.questions);
        setTopicLabel(data.topicLabel);
        setDifficulty(data.difficulty);
      } catch {
        if (!cancelled) setError("게임을 불러오지 못했습니다.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameId, router]);

  const finish = useCallback(async () => {
    setFinishing(true);
    try {
      const response = await fetch(`/api/games/${gameId}/submit`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "채점에 실패했습니다.");
        setFinishing(false);
        return;
      }
      router.replace(`/result/${gameId}`);
    } catch {
      setError("채점에 실패했습니다. 다시 시도해주세요.");
      setFinishing(false);
    }
  }, [gameId, router]);

  const answer = useCallback(
    async (choiceIndex: number) => {
      if (lockRef.current || !questions) return;
      lockRef.current = true;

      const question = questions[index];
      const remaining = Math.max(0, (deadlineRef.current - Date.now()) / 1000);

      try {
        const response = await fetch(`/api/games/${gameId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            choiceIndex,
            timeLeftSec: Math.round(remaining),
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "답안을 기록하지 못했습니다.");
          lockRef.current = false;
          return;
        }

        setReveal({ ...data, myChoiceIndex: choiceIndex });
      } catch {
        setError("답안을 기록하지 못했습니다. 네트워크를 확인해주세요.");
        lockRef.current = false;
      }
    },
    [gameId, index, questions],
  );

  // 문항이 바뀔 때마다 남은 시간을 다시 센다.
  // 마감 시각(deadlineRef)은 문항을 넘기는 쪽에서 미리 세팅해둔다.
  useEffect(() => {
    if (!questions || reveal) return;

    const timer = setInterval(() => {
      const remaining = (deadlineRef.current - Date.now()) / 1000;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(timer);
        void answer(-1);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [questions, index, reveal, answer]);

  // 정답을 보여준 뒤 잠시 있다가 다음 문항으로 넘어간다.
  useEffect(() => {
    if (!reveal || !questions) return;

    const timer = setTimeout(() => {
      if (index + 1 >= questions.length) {
        setReveal(null);
        void finish();
        return;
      }

      deadlineRef.current = Date.now() + QUESTION_TIME_SEC * 1000;
      lockRef.current = false;
      setTimeLeft(QUESTION_TIME_SEC);
      setReveal(null);
      setIndex((current) => current + 1);
    }, REVEAL_MS);

    return () => clearTimeout(timer);
  }, [reveal, index, questions, finish]);

  if (error) {
    return (
      <Centered>
        <div className="candy-card w-full max-w-md p-6 text-center">
          <div className="text-4xl">😵</div>
          <p className="mt-3 font-bold">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="candy-btn candy-btn-primary mt-5 h-12 w-full"
          >
            처음으로
          </button>
        </div>
      </Centered>
    );
  }

  if (!questions || finishing) {
    return (
      <Centered>
        <div className="text-center">
          <div className="animate-candy-spin mx-auto h-10 w-10 rounded-full border-4 border-[rgba(139,92,246,0.25)] border-t-[#8b5cf6]" />
          <p className="mt-4 font-bold text-[var(--candy-ink-soft)]">
            {finishing ? "채점 중이에요..." : "불러오는 중..."}
          </p>
        </div>
      </Centered>
    );
  }

  const question = questions[index];
  const progress = ((index + (reveal ? 1 : 0)) / questions.length) * 100;
  const timeRatio = timeLeft / QUESTION_TIME_SEC;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:py-10">
      <div className="flex items-center justify-between text-sm font-black">
        <span className="truncate pr-2 text-[var(--candy-ink-soft)]">
          {topicLabel} · {difficultyLabel(difficulty)}
        </span>
        <span>
          {index + 1} / {questions.length}
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff5fa2] to-[#8b5cf6] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{
              width: `${timeRatio * 100}%`,
              background:
                timeRatio > 0.3
                  ? "linear-gradient(90deg,#38bdf8,#8b5cf6)"
                  : "linear-gradient(90deg,#fb7185,#f43f5e)",
            }}
          />
        </div>
        <span
          className={`w-10 text-right text-sm font-black tabular-nums ${
            timeRatio <= 0.3 ? "text-[var(--candy-wrong)]" : "text-[var(--candy-ink-soft)]"
          }`}
        >
          {Math.ceil(timeLeft)}초
        </span>
      </div>

      <section className="candy-card mt-1 p-6">
        <span className="candy-chip bg-[rgba(139,92,246,0.12)] text-[11px] text-[#6d28d9]">
          {question.type === "ox" ? "O / X" : "4지선다"}
        </span>
        <h1 className="mt-3 text-xl leading-relaxed font-black sm:text-2xl">
          {question.prompt}
        </h1>
      </section>

      <div
        className={question.type === "ox" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}
      >
        {question.choices.map((choice, choiceIndex) => {
          const isAnswer = reveal?.answerIndex === choiceIndex;
          const isMine = reveal?.myChoiceIndex === choiceIndex;

          let stateClass = "";
          if (reveal) {
            if (isAnswer) stateClass = "candy-choice-correct";
            else if (isMine) stateClass = "candy-choice-wrong";
            else stateClass = "opacity-50";
          }

          return (
            <button
              key={choiceIndex}
              type="button"
              disabled={Boolean(reveal)}
              onClick={() => answer(choiceIndex)}
              className={`candy-choice ${stateClass} ${
                question.type === "ox" ? "py-8 text-center text-3xl" : ""
              }`}
            >
              {question.type === "ox" ? (
                choice
              ) : (
                <span className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(139,92,246,0.14)] text-xs font-black text-[#6d28d9]">
                    {choiceIndex + 1}
                  </span>
                  <span>{choice}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {reveal && (
        <div
          className={`candy-card border-l-8 p-5 ${
            reveal.isCorrect
              ? "border-l-[var(--candy-correct)]"
              : "border-l-[var(--candy-wrong)]"
          }`}
        >
          <p className="text-lg font-black">
            {reveal.isCorrect
              ? "🎉 정답!"
              : reveal.myChoiceIndex === -1
                ? "⏰ 시간 초과"
                : "😢 오답"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed font-semibold text-[var(--candy-ink-soft)]">
            {reveal.explanation}
          </p>
        </div>
      )}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-dvh items-center justify-center px-4">{children}</main>;
}
