import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Chip, Headline, VideoCard } from '../components/UI';
import { IconShuffle } from '../components/Icons';
import { easeInOut, easeOut, keys, prog } from '../animation/ease';

export const HERO_SEED = 17;
export const HERO_LABEL = 'CLIP_017.mp4';
const N = 10;
const HERO_INDEX = 6;

export const S03Selection: React.FC = () => {
  const t = useT('selection');
  // carousel spins fast, then decelerates and parks the chosen clip in front of the camera
  const spin = keys(t, [[-6, 0], [46, 360 * 1.5 - (HERO_INDEX * 360) / N]], easeOut);
  const pull = prog(t, 50, 28, easeInOut);
  const cam = { z: keys(t, [[-6, -240], [96, 80]]), rx: keys(t, [[-6, 12], [96, 4]]), y: 40 };
  // scanning highlight: hops quickly, slows down, lands on the hero
  const hopT = Math.min(1, Math.max(0, (t + 6) / 52));
  const hop = Math.floor(easeOut(hopT) * 23) % N;
  const highlighted = t >= 46 ? HERO_INDEX : (HERO_INDEX + hop) % N;
  return (
    <AbsoluteFill>
      <Stage3D cam={cam}>
        {Array.from({ length: N }).map((_, i) => {
          const a = ((i * 360) / N + spin) * (Math.PI / 180);
          const R = 560;
          let x = Math.sin(a) * R, z = Math.cos(a) * R - R, ry = (a * 180) / Math.PI;
          const hero = i === HERO_INDEX;
          let scale = 1, y = 20;
          if (hero) {
            x = x * (1 - pull);
            z = z + (300 - z) * pull;
            ry = ry * (1 - pull);
            scale = 1 + 0.15 * pull;
            y = 20 - 40 * pull;
          }
          const on = i === highlighted ? 1 : 0;
          const fade = hero ? 1 : 1 - 0.75 * pull;
          return (
            <Obj key={i} x={x} y={y} z={z} ry={ry} scale={scale} opacity={fade}>
              <VideoCard seed={hero ? HERO_SEED : i + 50} w={250} active={hero ? Math.max(on, pull) : on} dim={on || hero ? 0 : 0.35}
                label={hero ? HERO_LABEL : undefined} />
            </Obj>
          );
        })}
      </Stage3D>
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ opacity: prog(t, -2, 12) }}><IconShuffle size={72} /></div>
        <Headline text="RANDOM SELECTION" start={0} size={92} />
      </div>
      <div style={{ position: 'absolute', top: 1340, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: prog(t, 56, 12) }}>
        <Chip size={26} solid>1 VIDEO PICKED AUTOMATICALLY</Chip>
      </div>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 50% 52%, rgba(255,176,58,${0.12 * pull}) 0%, rgba(0,0,0,0) 40%)` }} />
    </AbsoluteFill>
  );
};
