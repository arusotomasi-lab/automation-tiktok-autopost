import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Chip, Headline, Kicker, Panel, VideoCard } from '../components/UI';
import { IconCheck, IconLock, IconShield, IconX } from '../components/Icons';
import { easeInOut, keys, pop, prog } from '../animation/ease';
import { C, DISPLAY, MONO, glow, hexA } from '../theme';
import { HERO_LABEL, HERO_SEED } from './S03Selection';

const CHECKS = [
  ['VIDEO ID', 'VERIFIED'],
  ['FILE HASH', 'UNIQUE'],
  ['POSTING HISTORY', 'NEVER POSTED'],
  ['LOCK', 'LOCKED'],
];

export const S04Duplicate: React.FC = () => {
  const t = useT('duplicate');
  const cam = { z: keys(t, [[-6, -120], [126, 40]]), ry: keys(t, [[-6, -6], [126, 6]]), y: 0 };
  const enter = prog(t, -4, 26, easeInOut);
  const scanY = t > 22 && t < 70 ? Math.sin(((t - 22) / 48) * Math.PI * 2 - Math.PI / 2) : -1;
  const unique = pop(t, 74, 160, 13);
  // duplicate copy tries to enter from the right and is rejected
  const dupIn = prog(t, 34, 18, easeInOut);
  const blocked = t >= 52;
  const bounce = blocked ? prog(t, 52, 20) : 0;
  const shake = blocked && t < 62 ? Math.sin(t * 2.4) * 10 * (1 - (t - 52) / 10) : 0;
  return (
    <AbsoluteFill>
      <Stage3D cam={cam}>
        {/* duplicate copy (background) */}
        <Obj x={420 - 150 * dupIn + 120 * bounce + shake} y={-120} z={-320} ry={-18} opacity={Math.min(dupIn * 1.5, 1) * (1 - prog(t, 80, 20))}>
          <div style={{ position: 'relative' }}>
            <VideoCard seed={HERO_SEED} w={200} accent={C.bad} active={blocked ? 1 : 0.3} dim={0.35} label="COPY" />
            {blocked && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hexA(C.bad, 0.18), borderRadius: 18 }}>
                <IconX size={110} color={C.bad} stroke={3.4} />
              </div>
            )}
          </div>
        </Obj>
        {/* scanner gate */}
        <Obj x={0} y={-130} z={0}>
          <div style={{ position: 'relative', width: 360, height: 560 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 36, border: `3px solid ${hexA(C.amber, 0.85)}`, boxShadow: `${glow(C.amber, 22, 0.5)}, inset ${glow(C.amber, 22, 0.35)}` }} />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ position: 'absolute', width: 46, height: 46, borderColor: C.gold, borderStyle: 'solid', borderWidth: 0,
                ...(i === 0 ? { left: -14, top: -14, borderLeftWidth: 5, borderTopWidth: 5 } : i === 1 ? { right: -14, top: -14, borderRightWidth: 5, borderTopWidth: 5 } : i === 2 ? { left: -14, bottom: -14, borderLeftWidth: 5, borderBottomWidth: 5 } : { right: -14, bottom: -14, borderRightWidth: 5, borderBottomWidth: 5 }) }} />
            ))}
          </div>
        </Obj>
        {/* the selected clip glides into the gate */}
        <Obj x={-520 * (1 - enter)} y={-130} z={10} ry={-25 * (1 - enter)}>
          <div style={{ position: 'relative' }}>
            <VideoCard seed={HERO_SEED} w={240} active={0.5 + 0.5 * unique} accent={unique > 0.5 ? C.ok : C.amber} label={HERO_LABEL} />
            {scanY > -1 && (
              <div style={{ position: 'absolute', left: -30, right: -30, top: `${50 + scanY * 48}%`, height: 6, background: `linear-gradient(90deg, rgba(0,0,0,0), ${C.amber}, #fff4dc, ${C.amber}, rgba(0,0,0,0))`, boxShadow: glow(C.amber, 20, 0.9) }} />
            )}
            {unique > 0.02 && (
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) scale(${unique})` }}>
                <Chip size={30} solid color={C.ok}>UNIQUE ✓</Chip>
              </div>
            )}
          </div>
        </Obj>
        {blocked && (
          <Obj x={330 + 120 * bounce} y={-470} z={-320} opacity={1 - prog(t, 84, 16)} scale={pop(t, 52, 200, 12)}>
            <Chip size={24} solid color={C.bad}>DUPLICATE BLOCKED</Chip>
          </Obj>
        )}
      </Stage3D>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Kicker text="DUPLICATE PROTECTION" start={-4} />
        <div style={{ height: 110, display: 'flex', alignItems: 'center', gap: 22, opacity: prog(t, 76, 12) }}>
          <IconShield size={80} color={C.ok} />
          <Headline text="NO DOUBLE POSTING" start={78} size={78} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Panel w={820} pad={24} style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: prog(t, 18, 12) }}>
          {CHECKS.map(([k, v], i) => {
            const p = prog(t, 28 + i * 10, 10);
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: 0.25 + 0.75 * p }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hexA(C.ok, 0.12 * p), border: `1.5px solid ${hexA(p > 0.5 ? C.ok : C.white, 0.5)}` }}>
                  {i === 3 ? <IconLock size={30} color={p > 0.5 ? C.ok : C.faint} /> : p > 0.5 ? <IconCheck size={32} color={C.ok} /> : null}
                </div>
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 32, letterSpacing: 1.5, color: C.white, flex: 1 }}>{k}</div>
                <div style={{ fontFamily: MONO, fontSize: 24, color: p > 0.5 ? C.ok : C.faint, letterSpacing: 1 }}>{p > 0.5 ? v : '…'}</div>
              </div>
            );
          })}
        </Panel>
      </div>
    </AbsoluteFill>
  );
};
