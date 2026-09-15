// Neon 스키마 적용 스크립트: npm run db:migrate
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL 이 없습니다. .env.local 에 Neon 연결 문자열을 넣고 다시 실행해주세요.",
  );
  process.exit(1);
}

const sql = neon(url);
const schema = await readFile(new URL("../src/lib/schema.sql", import.meta.url), "utf8");

// neon HTTP 드라이버는 한 번에 한 문장만 실행하므로 세미콜론 기준으로 나눠 실행한다.
const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);

for (const statement of statements) {
  const label = statement.replace(/\s+/g, " ").slice(0, 70);
  process.stdout.write(`→ ${label}...\n`);
  await sql.query(statement);
}

console.log(`\n완료: ${statements.length}개 문장을 적용했습니다.`);
