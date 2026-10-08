import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Chip, Headline } from '../components/UI';
import { keys, pop, rand } from '../animation/ease';
import { C, hexA } from '../theme';
import { PHONE_X, PHONE_Y, Phones } from './S07Publish';

export const S08Success: React.FC = () => {
  const t = useT('success');
  const cam = { z: keys(t, [[-6, 0], [96, 30]]), rx: keys(t, [[-6, 4], [96, 2]]), y: 20 };
  const at = (i: number) => 2 + i * 8;
  return (
    <AbsoluteFill>
      <Stage3D cam={cam}>
        <Phones t={t} progress={() => 1} posted={(i) => Math.min(1, pop(t, at(i), 170, 13))} />
        {/* spark burst from each phone when it flips to POSTED */}
        {PHONE_X.map((x, i) => Array.from({ length: 14 }).map((_, k) => {
          const life = (t - at(i)) / 26;
          if (life < 0 || life > 1) return null;
          const a = rand(k + i * 20, 5) * Math.PI * 2;
          const d = 80 + rand(k + i * 20, 6) * 240;
          return (
            <Obj key={`${i}-${k}`} x={x + Math.cos(a) * d * life} y={PHONE_Y + Math.sin(a) * d * life - 60 * life} z={60} opacity={1 - life}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: k % 3 ? C.ok : C.gold, boxShadow: `0 0 12px ${hexA(C.ok, 0.9)}` }} />
            </Obj>
          );
        }))}
      </Stage3D>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <Headline text="3 POSTS." start={22} size={104} />
        <Headline text="ZERO MANUAL UPLOADS." start={34} size={74} color={C.amber} glowColor={C.orange} />
      </div>
      <div style={{ position: 'absolute', top: 545, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(1, pop(t, 44)) }}>
        <Chip size={24} color={C.ok}>TODAY • 3/3 POSTED ✓</Chip>
      </div>
    </AbsoluteFill>
  );
};
