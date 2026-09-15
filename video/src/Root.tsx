import React from "react";
import { Composition } from "remotion";
import { QuizPlayIntro } from "./Video";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="QuizPlayIntro"
    component={QuizPlayIntro}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
