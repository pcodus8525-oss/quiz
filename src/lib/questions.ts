import { generateQuestions } from "./ai";
import { getStore, type QuestionRow } from "./store";
import type { Difficulty } from "./quiz";

/** 부족분을 생성할 때 다음 판을 위해 조금 더 넉넉히 만들어 캐시에 쌓아둔다. */
const GENERATION_BUFFER = 3;

export class QuizGenerationError extends Error {}

/**
 * 한 판에 쓸 문제를 확보한다.
 * 캐시에서 먼저 채우고, 모자란 만큼만 OpenAI로 생성해 저장한 뒤 합친다.
 */
export async function acquireQuestions(params: {
  topicSlug: string;
  topicLabel: string;
  difficulty: Difficulty;
  count: number;
}): Promise<QuestionRow[]> {
  const { topicSlug, topicLabel, difficulty, count } = params;
  const store = getStore();

  const cached = await store.findQuestions({ topicSlug, difficulty, limit: count });
  if (cached.length >= count) {
    return shuffle(cached).slice(0, count);
  }

  const avoidPrompts = await store.listRecentPrompts({
    topicSlug,
    difficulty,
    limit: 40,
  });

  const generated = await generateQuestions({
    topicLabel,
    difficulty,
    count: count - cached.length + GENERATION_BUFFER,
    avoidPrompts,
  });

  const inserted = await store.insertQuestions({
    topicSlug,
    topicLabel,
    difficulty,
    questions: generated,
  });

  const pool = [...cached, ...inserted];
  if (pool.length < count) {
    throw new QuizGenerationError(
      `문제를 ${count}개 준비하지 못했습니다 (확보: ${pool.length}개). 주제를 조금 더 구체적으로 바꿔서 다시 시도해주세요.`,
    );
  }

  return shuffle(pool).slice(0, count);
}

export async function getQuestionsByIds(ids: number[]): Promise<QuestionRow[]> {
  if (ids.length === 0) return [];
  return getStore().getQuestionsByIds(ids);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
