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

## GIF 만들기

README 상단에 넣는 `docs/quiz-play-intro.gif` 는 mp4를 ffmpeg로 변환한 것입니다.
Remotion의 `--codec=gif` 로 바로 뽑으면 팔레트 최적화가 없어 36MB가 나오므로,
반드시 아래 2패스 방식을 씁니다 (6.5MB).

```bash
FF=node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe

# 1) 영상 전체를 분석해 128색 팔레트를 만든다
"$FF" -y -i ../docs/quiz-play-intro.mp4 \
  -vf "scale=800:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff" \
  out/pal.png

# 2) 그 팔레트로 인코딩한다. 8fps로 떨어뜨려 용량을 잡는다
"$FF" -y -i ../docs/quiz-play-intro.mp4 -i out/pal.png \
  -lavfi "scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -r 8 -loop 0 ../docs/quiz-play-intro.gif
```

- `diff_mode=rectangle` 이 정지한 영역을 다시 쓰게 해서 용량을 크게 줄입니다.
- `bayer_scale` 을 올릴수록 디더링이 약해지고 파일이 작아집니다.
- **폭 640px 로 줄이면 4.5MB까지 떨어지지만** 앱 화면 안의 글씨가 뭉개져서 800px로 두었습니다.
- Remotion 번들 ffmpeg에는 `fps`·`select` 필터가 빠져 있어, 프레임레이트는 `-r` 로 지정해야 합니다.
