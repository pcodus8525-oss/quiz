/**
 * 앱(src/app/globals.css)의 캔디 톤을 영상에서도 그대로 쓰기 위한 토큰.
 * 색을 바꿀 일이 생기면 앱과 이 파일을 함께 고쳐야 한다.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const colors = {
  pink: "#f472b6",
  purple: "#a855f7",
  blue: "#3b82f6",
  ink: "#2e1065",
  inkSoft: "#6d28d9",
  white: "#ffffff",
  mint: "#10b981",
  coral: "#f43f5e",
};

/** 홈 화면 배경과 같은 그라데이션 */
export const candyBackground =
  "linear-gradient(135deg, #fde7f3 0%, #f3e8ff 45%, #dbeafe 100%)";

/** 버튼·타이틀에 쓰는 진한 그라데이션 */
export const brandGradient = `linear-gradient(90deg, ${colors.pink} 0%, ${colors.purple} 50%, ${colors.blue} 100%)`;

/** 각 씬의 시작 프레임과 길이 (30fps 기준) */
export const scenes = {
  intro: { from: 0, duration: 90 }, //  0 -  3초
  hook: { from: 90, duration: 120 }, //  3 -  7초
  home: { from: 210, duration: 150 }, //  7 - 12초
  generate: { from: 360, duration: 120 }, // 12 - 16초
  play: { from: 480, duration: 180 }, // 16 - 22초
  result: { from: 660, duration: 120 }, // 22 - 26초
  rank: { from: 780, duration: 90 }, // 26 - 29초
  outro: { from: 870, duration: 120 }, // 29 - 33초
} as const;

export const TOTAL_FRAMES = scenes.outro.from + scenes.outro.duration;
