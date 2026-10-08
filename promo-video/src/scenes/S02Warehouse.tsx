import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Chip, Headline, Kicker, Panel, VideoCard } from '../components/UI';
import { IconCloud } from '../components/Icons';
import { Pulse } from '../workflow/Flow';
import { easeInOut, easeOut, keys, prog, rand } from '../animation/ease';
import { C, DISPLAY, MONO, glow } from '../theme';

export const STOCK = 39;
const COLS = 7, ROWS = 5;

export const S02Warehouse: React.FC = () => {
  const t = useT('warehouse');
  const cam = { x: keys(t, [[-6, -160], [126, 150]]), z: keys(t, [[-6, -520], [126, -60]]), ry: keys(t, [[-6, 14], [126, -12]]), rx: 10, y: -30 };
  const drop = prog(t, 14, 26, easeOut);
  const landed = t > 40;
  const count = Math.round(interpolate(t, [28, 80], [0, STOCK], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut }));
  return (
    <AbsoluteFill>
      <Stage3D cam={cam} originY="50%">
        {Array.from({ length: COLS * ROWS }).map((_, i) => {
          const c = i % COLS, r = Math.floor(i / COLS);
          const x = (c - (COLS - 1) / 2) * 170;
          const y = (r - (ROWS - 1) / 2) * 260 + 30;
          const z = -Math.abs(c - 3) * 70 - 80;
          const appear = prog(t, -6 + rand(i, 2) * 30, 14);
          const isSlot = i === 17; // the newly uploaded clip lands here
          if (isSlot) return null;
          return (
            <Obj key={i} x={x} y={y} z={z - (1 - appear) * 300} ry={(3 - c) * 6} opacity={appear * 0.95}>
              <VideoCard seed={i + 30} w={128} active={rand(i, 9) > 0.8 ? 0.4 : 0.08} dim={0.25} />
            </Obj>
          );
        })}
        {/* the clip that was uploaded once drops into the warehouse */}
        <Obj x={(17 % COLS - 3) * 170} y={(Math.floor(17 / COLS) - 2) * 260 + 30 - (1 - drop) * 900} z={-80 + (1 - drop) * 300}
          scale={1 + (1 - drop) * 0.5} opacity={Math.min(1, drop * 3)}>
          <VideoCard seed={17} w={128} active={landed ? 1 : 0.6} />
        </Obj>
      </Stage3D>
      {landed && <Pulse x={540} y={960} at={41} size={260} />}
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <Kicker text="STEP 1 • UPLOAD ONCE" start={0} />
        <Headline text="VIDEO WAREHOUSE" start={4} size={96} />
      </div>
      <div style={{ position: 'absolute', top: 1150, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: prog(t, 24, 14), transform: `translateY(${(1 - prog(t, 24, 14)) * 30}px)` }}>
        <Panel w={760} pad={30} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: C.amber }}>CONTENT QUEUE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 96, color: C.white, textShadow: glow(C.amber, 16, 0.4), fontVariantNumeric: 'tabular-nums' }}>{count}</span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 38, color: C.dim }}>VIDEOS READY</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.85 }}>
            <IconCloud size={70} color={C.gold} />
            <div style={{ fontFamily: MONO, fontSize: 18, color: C.faint, letterSpacing: 2 }}>CLOUD STORAGE</div>
          </div>
        </Panel>
      </div>
      <div style={{ position: 'absolute', top: 1360, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: prog(t, 60, 12) }}>
        <Chip size={22} color={C.gold}>CLOUDFLARE R2 • VIDEOS/</Chip>
      </div>
    </AbsoluteFill>
  );
};
