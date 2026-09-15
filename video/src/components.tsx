import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { candyBackground, colors } from "./theme";

/** 모든 씬이 깔고 가는 캔디 그라데이션 배경 */
export const Background: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <AbsoluteFill style={{ background: candyBackground }}>
    <Blobs />
    {children}
  </AbsoluteFill>
);

/** 배경에 은은하게 떠다니는 원. 정지 화면처럼 보이지 않게 하는 용도 */
const Blobs: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (seed: number, amount: number) =>
    Math.sin((frame + seed * 40) / 55) * amount;

  const blobs = [
    { x: 140, y: 180, size: 420, color: "rgba(244,114,182,0.30)", seed: 0 },
    { x: 1480, y: 120, size: 360, color: "rgba(59,130,246,0.26)", seed: 1 },
    { x: 1560, y: 760, size: 460, color: "rgba(168,85,247,0.24)", seed: 2 },
    { x: 200, y: 820, size: 320, color: "rgba(16,185,129,0.18)", seed: 3 },
  ];

  return (
    <AbsoluteFill>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x + drift(b.seed, 26),
            top: b.y + drift(b.seed + 2, 20),
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: b.color,
            filter: "blur(70px)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/**
 * 스크린샷을 감싸는 브라우저 창 프레임.
 * 캡처가 1280x900이라 그대로 두면 영상 안에서 붕 떠 보인다.
 */
export const BrowserFrame: React.FC<{
  src: string;
  width?: number;
  /** 세로로 긴 캡처를 위에서부터 잘라 보여줄 때 쓴다 */
  cropHeight?: number;
  offsetY?: number;
}> = ({ src, width = 1180, cropHeight, offsetY = 0 }) => {
  const shotWidth = width;
  const shotHeight = cropHeight ?? (width / 1280) * 900;

  return (
    <div
      style={{
        width: shotWidth,
        borderRadius: 22,
        overflow: "hidden",
        background: colors.white,
        boxShadow:
          "0 40px 90px rgba(76, 29, 149, 0.28), 0 6px 18px rgba(76, 29, 149, 0.16)",
      }}
    >
      {/* 창 상단바 */}
      <div
        style={{
          height: 44,
          background: "#f6f3fb",
          display: "flex",
          alignItems: "center",
          gap: 9,
          paddingLeft: 20,
          borderBottom: "1px solid rgba(109, 40, 217, 0.10)",
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div
            key={c}
            style={{
              width: 13,
              height: 13,
              borderRadius: "50%",
              background: c,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: 18,
            padding: "5px 18px",
            borderRadius: 999,
            background: "#ffffff",
            color: "#8b7bb8",
            fontSize: 15,
            fontWeight: 600,
            border: "1px solid rgba(109, 40, 217, 0.10)",
          }}
        >
          quiz-play.app
        </div>
      </div>

      <div style={{ height: shotHeight, overflow: "hidden" }}>
        <Img
          src={staticFile(src)}
          style={{
            width: shotWidth,
            display: "block",
            transform: `translateY(${-offsetY}px)`,
          }}
        />
      </div>
    </div>
  );
};

/** 스크린샷 위에 씌우는 강조 링 */
export const Highlight: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  delay?: number;
  color?: string;
}> = ({ x, y, width, height, delay = 0, color = colors.purple }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, mass: 0.6 },
  });
  const pulse = 1 + Math.sin((frame - delay) / 7) * 0.02;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        border: `5px solid ${color}`,
        borderRadius: 18,
        opacity: appear,
        transform: `scale(${interpolate(appear, [0, 1], [1.25, 1]) * pulse})`,
        boxShadow: `0 0 0 10px ${color}22, 0 0 34px ${color}66`,
      }}
    />
  );
};

/** 화면 위쪽에 얹는 씬 설명 문구 */
export const Caption: React.FC<{
  title: string;
  subtitle?: string;
  delay?: number;
}> = ({ title, subtitle, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, mass: 0.7 },
  });

  return (
    <div
      style={{
        textAlign: "center",
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [26, 0])}px)`,
      }}
    >
      <div
        style={{
          fontSize: 62,
          fontWeight: 800,
          color: colors.ink,
          letterSpacing: -1.5,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            marginTop: 12,
            fontSize: 30,
            fontWeight: 600,
            color: colors.inkSoft,
            opacity: 0.85,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};
