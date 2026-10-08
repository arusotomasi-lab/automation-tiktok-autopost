import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { easeIn, easeOut, prog } from '../animation/ease';
import { SCENES, SceneKey, TRANSITION, s } from '../timeline';

/**
 * Places a scene on the timeline with a camera push-through transition:
 * it emerges from depth (small + blurred) and exits by flying past the viewer.
 */
export const SceneSlot: React.FC<{ k: SceneKey; children: React.ReactNode; enter?: boolean; exit?: boolean }> = ({
  k, children, enter = true, exit = true,
}) => {
  const [a, b] = SCENES[k];
  const from = Math.max(0, s(a) - (enter ? TRANSITION / 2 : 0));
  const to = s(b) + (exit ? TRANSITION / 2 : 0);
  return (
    <Sequence from={from} durationInFrames={to - from} name={k}>
      <Shell enter={enter} exit={exit} dur={to - from}>{children}</Shell>
    </Sequence>
  );
};

const Shell: React.FC<{ children: React.ReactNode; enter: boolean; exit: boolean; dur: number }> = ({ children, enter, exit, dur }) => {
  const f = useCurrentFrame();
  const pin = enter ? prog(f, 0, TRANSITION, easeOut) : 1;
  const pout = exit ? prog(f, dur - TRANSITION, TRANSITION, easeIn) : 0;
  const scale = (0.86 + 0.14 * pin) * (1 + 0.35 * pout);
  const blur = (1 - pin) * 16 + pout * 18;
  const opacity = Math.min(pin, 1 - pout);
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

/** Frames since the official start of scene k (negative during the incoming transition). */
export function useT(k: SceneKey, enter = true) {
  const f = useCurrentFrame();
  const from = Math.max(0, s(SCENES[k][0]) - (enter ? TRANSITION / 2 : 0));
  return f + from - s(SCENES[k][0]);
}
