import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";
import {
  Generate,
  Home,
  Hook,
  Intro,
  Outro,
  Play,
  Rank,
  Result,
} from "./scenes";
import { scenes } from "./theme";

// 한글이 시스템 폰트에 의존해 깨지지 않도록 렌더 전에 폰트를 확보한다.
const { fontFamily } = loadFont();

export const QuizPlayIntro: React.FC = () => (
  <AbsoluteFill style={{ fontFamily, background: "#ffffff" }}>
    <Sequence from={scenes.intro.from} durationInFrames={scenes.intro.duration}>
      <Intro />
    </Sequence>

    <Sequence from={scenes.hook.from} durationInFrames={scenes.hook.duration}>
      <Hook />
    </Sequence>

    <Sequence from={scenes.home.from} durationInFrames={scenes.home.duration}>
      <Home />
    </Sequence>

    <Sequence
      from={scenes.generate.from}
      durationInFrames={scenes.generate.duration}
    >
      <Generate />
    </Sequence>

    <Sequence from={scenes.play.from} durationInFrames={scenes.play.duration}>
      <Play />
    </Sequence>

    <Sequence
      from={scenes.result.from}
      durationInFrames={scenes.result.duration}
    >
      <Result />
    </Sequence>

    <Sequence from={scenes.rank.from} durationInFrames={scenes.rank.duration}>
      <Rank />
    </Sequence>

    <Sequence from={scenes.outro.from} durationInFrames={scenes.outro.duration}>
      <Outro />
    </Sequence>
  </AbsoluteFill>
);
