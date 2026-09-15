import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background, BrowserFrame, Caption, Highlight } from "./components";
import { brandGradient, colors } from "./theme";

const center: React.CSSProperties = {
  justifyContent: "center",
  alignItems: "center",
};

/** 씬 1 — 로고와 타이틀 */
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = spring({ frame, fps, config: { damping: 11, mass: 0.7 } });
  const title = spring({
    frame: frame - 12,
    fps,
    config: { damping: 13, mass: 0.8 },
  });
  const tagline = spring({
    frame: frame - 26,
    fps,
    config: { damping: 16 },
  });

  return (
    <Background>
      <AbsoluteFill style={center}>
        <div
          style={{
            fontSize: 150,
            transform: `scale(${logo}) rotate(${interpolate(
              logo,
              [0, 1],
              [-35, 0],
            )}deg)`,
          }}
        >
          🍭
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 132,
            fontWeight: 900,
            letterSpacing: -4,
            background: brandGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            opacity: title,
            transform: `scale(${interpolate(title, [0, 1], [0.86, 1])})`,
          }}
        >
          Quiz Play
        </div>

        <div
          style={{
            marginTop: 18,
            fontSize: 38,
            fontWeight: 600,
            color: colors.inkSoft,
            opacity: tagline,
            transform: `translateY(${interpolate(tagline, [0, 1], [24, 0])}px)`,
          }}
        >
          주제만 정하면 AI가 즉석에서 퀴즈를 만들어드려요
        </div>
      </AbsoluteFill>
    </Background>
  );
};

/** 씬 2 — 문제 제기 후 한 줄로 답하기 */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 앞 문장은 들어왔다가 빠지고, 뒷 문장이 들어온다
  const inFirst = spring({ frame, fps, config: { damping: 16 } });
  const outFirst = interpolate(frame, [48, 62], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const second = spring({
    frame: frame - 58,
    fps,
    config: { damping: 14, mass: 0.7 },
  });

  return (
    <Background>
      <AbsoluteFill style={center}>
        <div
          style={{
            position: "absolute",
            fontSize: 64,
            fontWeight: 700,
            color: colors.inkSoft,
            opacity: inFirst * outFirst,
            transform: `translateY(${interpolate(
              inFirst,
              [0, 1],
              [30, 0],
            )}px)`,
          }}
        >
          퀴즈 앱을 만들려면, 문제부터 채워야 하죠
        </div>

        <div
          style={{
            position: "absolute",
            textAlign: "center",
            opacity: second,
            transform: `scale(${interpolate(second, [0, 1], [0.82, 1])})`,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              letterSpacing: -3,
              background: brandGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            주제만 입력하면 끝
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 34,
              fontWeight: 600,
              color: colors.inkSoft,
            }}
          >
            문제는 AI가 그때그때 만들어냅니다
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};

/** 씬 3 — 홈 화면에서 주제·난이도·문항 수 고르기 */
export const Home: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, config: { damping: 18, mass: 0.9 } });

  return (
    <Background>
      <AbsoluteFill style={{ ...center, paddingTop: 40 }}>
        <div style={{ marginBottom: 26 }}>
          <Caption title="고르는 건 세 가지뿐" subtitle="주제 · 난이도 · 문항 수" />
        </div>

        <div
          style={{
            position: "relative",
            opacity: rise,
            transform: `translateY(${interpolate(rise, [0, 1], [70, 0])}px)`,
          }}
        >
          <BrowserFrame src="shots/01-home.png" width={1000} cropHeight={650} />
          {/*
            캡처 좌표(1280 기준)에 0.781배(=1000/1280)를 곱하고,
            창 상단바 높이 44px를 y에 더해서 맞춘 값이다.
          */}
          <Highlight
            x={588} y={256} width={92} height={36}
            delay={22}
          />
          <Highlight
            x={426} y={462} width={150} height={60}
            delay={52} color={colors.pink}
          />
          <Highlight
            x={268} y={606} width={148} height={56}
            delay={82} color={colors.blue}
          />
        </div>
      </AbsoluteFill>
    </Background>
  );
};

/** 씬 4 — AI가 문제를 만드는 동안 */
export const Generate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 실제로 앱이 만들어낸 문제들. 유형 뱃지가 문제와 어긋나지 않게 같이 적어둔다.
  const cards = [
    { type: "O / X", text: "샤이니(SHINee)는 2008년에 데뷔했다." },
    { type: "4지선다", text: "트와이스 멤버를 선발한 서바이벌 프로그램은?" },
    { type: "4지선다", text: "세븐틴(SEVENTEEN)의 멤버 수는 몇 명인가요?" },
    { type: "O / X", text: "방탄소년단 RM의 본명은 김남준이다." },
  ];

  const dots = Math.floor(frame / 9) % 4;

  return (
    <Background>
      <AbsoluteFill style={center}>
        <Caption
          title="AI가 문제를 만드는 중"
          subtitle="이미 만든 문제는 캐시에서 재사용하고, 모자란 만큼만 새로 만듭니다"
        />

        <div
          style={{
            marginTop: 20,
            fontSize: 40,
            fontWeight: 700,
            color: colors.purple,
            height: 50,
          }}
        >
          {".".repeat(dots + 1)}
        </div>

        <div style={{ marginTop: 10, width: 980 }}>
          {cards.map((card, i) => {
            const appear = spring({
              frame: frame - 26 - i * 16,
              fps,
              config: { damping: 15, mass: 0.7 },
            });

            return (
              <div
                key={i}
                style={{
                  marginBottom: 16,
                  padding: "22px 30px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0 14px 34px rgba(76,29,149,0.14)",
                  fontSize: 30,
                  fontWeight: 700,
                  color: colors.ink,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: appear,
                  transform: `translateX(${interpolate(
                    appear,
                    [0, 1],
                    [-70, 0],
                  )}px)`,
                }}
              >
                <span
                  style={{
                    padding: "5px 14px",
                    borderRadius: 999,
                    background: "#f3e8ff",
                    color: colors.purple,
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  {card.type}
                </span>
                {card.text}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Background>
  );
};

/** 씬 5 — 실제 플레이. 문제를 보여주다 정답 공개로 넘어간다 */
export const Play: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, config: { damping: 18, mass: 0.9 } });
  const SWAP = 96; // 이 프레임부터 정답 공개 화면으로 바꾼다
  const revealed = frame >= SWAP;

  const swap = spring({
    frame: frame - SWAP,
    fps,
    config: { damping: 15, mass: 0.6 },
  });

  return (
    <Background>
      <AbsoluteFill style={{ ...center, paddingTop: 30 }}>
        <div style={{ marginBottom: 24 }}>
          <Caption
            title={revealed ? "정답은 고른 뒤에 공개" : "문항당 20초"}
            subtitle={
              revealed
                ? "해설까지 같이 붙습니다"
                : "빨리 맞힐수록 보너스 점수가 붙습니다"
            }
            delay={revealed ? SWAP : 0}
          />
        </div>

        <div
          style={{
            opacity: rise,
            transform: `translateY(${interpolate(rise, [0, 1], [70, 0])}px)`,
          }}
        >
          <div
            style={{
              transform: revealed
                ? `scale(${interpolate(swap, [0, 1], [0.97, 1])})`
                : "scale(1)",
            }}
          >
            <BrowserFrame
              src={revealed ? "shots/03-feedback.png" : "shots/02-play.png"}
              width={1020}
              cropHeight={580}
            />
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};

/** 씬 6 — 결과. 점수가 0에서 430까지 올라간다 */
export const Result: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, config: { damping: 18, mass: 0.9 } });
  const count = Math.round(
    interpolate(frame, [14, 62], [0, 430], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <Background>
      <AbsoluteFill style={{ ...center, flexDirection: "row", gap: 70 }}>
        <div
          style={{
            opacity: rise,
            transform: `translateX(${interpolate(rise, [0, 1], [-60, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: colors.ink,
              letterSpacing: -1.5,
            }}
          >
            끝나면 오답 리뷰
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 28,
              fontWeight: 600,
              color: colors.inkSoft,
              lineHeight: 1.5,
            }}
          >
            내가 고른 답 · 정답 · 해설을
            <br />
            나란히 보여줍니다
          </div>

          <div
            style={{
              marginTop: 40,
              padding: "34px 54px",
              borderRadius: 26,
              background: "rgba(255,255,255,0.94)",
              boxShadow: "0 22px 48px rgba(76,29,149,0.18)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 108,
                fontWeight: 900,
                color: colors.purple,
                letterSpacing: -3,
                lineHeight: 1,
              }}
            >
              {count}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: colors.inkSoft,
              }}
            >
              점
            </div>
          </div>
        </div>

        <div
          style={{
            opacity: rise,
            transform: `translateY(${interpolate(rise, [0, 1], [70, 0])}px)`,
          }}
        >
          {/* 폭 820이면 캡처 높이가 576px이라, offsetY를 뺀 만큼까지만 잘라야 아래가 비지 않는다 */}
          <BrowserFrame
            src="shots/04-result.png"
            width={820}
            cropHeight={540}
            offsetY={20}
          />
        </div>
      </AbsoluteFill>
    </Background>
  );
};

/** 씬 7 — 랭킹 보드 */
export const Rank: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, config: { damping: 18, mass: 0.9 } });

  return (
    <Background>
      <AbsoluteFill style={{ ...center, paddingTop: 30 }}>
        <div style={{ marginBottom: 24 }}>
          <Caption
            title="같은 조건끼리만 겨룹니다"
            subtitle="난이도와 문항 수가 같은 기록끼리 순위를 매깁니다"
          />
        </div>

        <div
          style={{
            opacity: rise,
            transform: `translateY(${interpolate(rise, [0, 1], [80, 0])}px)`,
          }}
        >
          {/* 난이도·문항 수 필터부터 보이도록 위를 조금만 덜어낸다 */}
          <BrowserFrame
            src="shots/05-leaderboard.png"
            width={980}
            cropHeight={530}
            offsetY={115}
          />
        </div>
      </AbsoluteFill>
    </Background>
  );
};

/** 씬 8 — 로고와 저장소 주소 */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const title = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const repo = spring({ frame: frame - 30, fps, config: { damping: 16 } });

  return (
    <Background>
      <AbsoluteFill style={center}>
        <div style={{ fontSize: 120, transform: `scale(${logo})` }}>🍭</div>

        <div
          style={{
            marginTop: 10,
            fontSize: 116,
            fontWeight: 900,
            letterSpacing: -4,
            background: brandGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            opacity: title,
          }}
        >
          Quiz Play
        </div>

        <div
          style={{
            marginTop: 34,
            padding: "20px 44px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 16px 38px rgba(76,29,149,0.16)",
            fontSize: 32,
            fontWeight: 700,
            color: colors.inkSoft,
            opacity: repo,
            transform: `translateY(${interpolate(repo, [0, 1], [26, 0])}px)`,
          }}
        >
          github.com/pcodus8525-oss/quiz
        </div>

        <div
          style={{
            marginTop: 26,
            fontSize: 26,
            fontWeight: 600,
            color: colors.inkSoft,
            opacity: repo * 0.75,
          }}
        >
          Next.js · AI SDK · Neon Postgres
        </div>
      </AbsoluteFill>
    </Background>
  );
};
