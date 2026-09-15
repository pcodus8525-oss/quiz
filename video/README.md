# Quiz Play 소개 영상 (Remotion)

앱 소개용 33초짜리 영상을 만드는 Remotion 프로젝트입니다.
Next.js 앱과 의존성을 섞지 않으려고 폴더를 따로 두고 `npm install`도 따로 합니다.

## 실행

```bash
cd video
npm install

npm run studio   # 브라우저에서 미리보기하며 타이밍 조정
npm run render   # out/quiz-play-intro.mp4 로 렌더
```

렌더가 끝나면 최종본을 `docs/quiz-play-intro.mp4` 로 복사해서 커밋합니다
(`video/out/` 자체는 `.gitignore` 대상입니다).

## 구성

| 파일 | 역할 |
| --- | --- |
| `src/theme.ts` | 앱과 맞춘 색·그라데이션, 씬별 시작 프레임과 길이 |
| `src/components.tsx` | 배경, 브라우저 창 프레임, 강조 링, 자막 |
| `src/scenes.tsx` | 씬 8개 |
| `src/Video.tsx` | 씬을 `Sequence`로 이어 붙이고 한글 폰트를 로드 |
| `src/Root.tsx` | 컴포지션 등록 (1920×1080 · 30fps · 990프레임) |
| `public/shots/` | `docs/screenshots/` 에서 복사해 온 화면 캡처 |

## 씬 구성

| # | 구간 | 내용 |
| --- | --- | --- |
| 1 | 0–3s | 로고 + 타이틀 |
| 2 | 3–7s | "주제만 입력하면 끝" |
| 3 | 7–12s | 홈 — 주제·난이도·문항 수 |
| 4 | 12–16s | AI 문제 생성 |
| 5 | 16–22s | 플레이 → 정답 공개 |
| 6 | 22–26s | 결과 + 점수 카운트업 |
| 7 | 26–29s | 랭킹 보드 |
| 8 | 29–33s | 아웃트로 |

## 고칠 때 주의할 점

- **스크린샷을 다시 찍으면** `public/shots/` 에도 복사해야 하고,
  `scenes.tsx` 의 `Highlight` 좌표와 `cropHeight`·`offsetY` 를 다시 맞춰야 합니다.
  좌표는 1280px 폭 캡처 기준이라 `BrowserFrame` 의 `width` 비율을 곱하고,
  창 상단바 높이 44px 를 `y` 에 더한 값입니다.
- **`cropHeight` 는** `width / 1280 * 900 - offsetY` 를 넘으면 아래가 흰 여백으로 남습니다.
- **한글 폰트**는 `@remotion/google-fonts/NotoSansKR` 로 로드합니다.
  시스템 폰트에 기대면 렌더 환경에 따라 글자가 깨집니다.
