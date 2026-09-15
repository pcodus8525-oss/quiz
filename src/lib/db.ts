import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null = null;

/**
 * Neon(Postgres) 쿼리 함수를 지연 생성한다.
 * 모듈 로드 시점이 아니라 첫 쿼리 시점에 환경 변수를 읽어야
 * DATABASE_URL 이 없는 빌드 단계에서 터지지 않는다.
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL 환경 변수가 없습니다. Vercel에 연결한 Neon 데이터베이스의 연결 문자열을 .env.local 에 넣어주세요.",
    );
  }

  cached = neon(url);
  return cached;
}
