import { memoryStore } from "./memory";
import { neonStore } from "./neon";
import type { Store } from "./types";

/**
 * DATABASE_URL 이 있으면 Neon, 없으면 인메모리 저장소를 쓴다.
 * 데모는 키 하나 없이 바로 돌고, 나중에 환경 변수만 채우면 그대로 Neon으로 넘어간다.
 */
export function getStore(): Store {
  return process.env.DATABASE_URL ? neonStore : memoryStore;
}

export type { GameRow, QuestionRow, QuestionDraft, ScoreRow, Store } from "./types";
