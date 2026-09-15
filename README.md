# Quiz Play

원하는 주제를 입력하면 OpenAI가 즉석에서 퀴즈를 만들어주는 싱글 플레이 웹 퀴즈 게임입니다.
요구사항은 [PRD.md](./PRD.md)에 정리되어 있습니다.

## 빠른 시작 (데모)

```bash
npm install
# .env.local 에 OpenAI 키만 넣으면 됩니다
echo "OPENAI_API_KEY=sk-..." > .env.local
npm run dev
```

`http://localhost:3000` 으로 접속하면 바로 플레이할 수 있습니다.

## 환경 변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `OPENAI_API_KEY` | ✅ | 문제 생성에 사용 |
| `OPENAI_MODEL` | | 사용할 모델. 기본값 `gpt-5.6-luna` |
| `DATABASE_URL` | | Neon 연결 문자열. **없으면 메모리에 저장**하고, 넣으면 자동으로 Neon을 씁니다 |

## 저장소 전환

데모는 별도 설정 없이 프로세스 메모리에 저장합니다 (서버를 끄면 기록이 사라짐).
기록을 영구 보관하려면:

```bash
# .env.local 에 Neon 연결 문자열을 추가한 뒤
npm run db:migrate   # 테이블 생성
npm run dev
```

`src/lib/store/` 아래에 `memory.ts`와 `neon.ts` 두 구현이 있고,
`DATABASE_URL` 유무에 따라 `getStore()`가 알아서 골라 씁니다.

## 게임 규칙

- 시작 전에 **주제 · 난이도 · 문항 수(5/10/20)** 를 고릅니다
- 문항당 제한 시간 **20초**, 시간 초과는 오답 처리
- 점수 = `정답 × 100점 × 난이도 배수(1.0 / 1.3 / 1.6)` + `남은 시간(초) × 5`
- 채점은 전부 서버에서 이뤄지고, 정답은 답을 고른 뒤에만 공개됩니다
- 결과 화면에서 오답 리뷰를 보고, 잘못된 문제는 신고할 수 있습니다 (3회 누적 시 자동 숨김)

## 구조

```
src/
  app/
    page.tsx                  홈 (주제·난이도·문항 수 선택)
    play/[gameId]/            게임 진행
    result/[gameId]/          결과 + 오답 리뷰 + 랭킹 등록
    leaderboard/              랭킹 보드
    api/
      games/                  게임 생성 / 조회 / 답안 / 채점 / 랭킹 등록
      leaderboard/            랭킹 조회
      reports/                문제 신고
  lib/
    quiz.ts                   공용 상수·타입 (점수 공식, 난이도, 카테고리)
    ai.ts                     OpenAI 문제 생성
    questions.ts              캐시 우선 + 부족분만 생성
    games.ts                  게임 진행·채점·랭킹
    store/                    저장소 (memory / neon)
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Neon 스키마 적용 (`DATABASE_URL` 필요) |
