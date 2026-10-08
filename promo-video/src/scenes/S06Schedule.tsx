import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Chip, Headline, Kicker, Panel, VideoCard } from '../components/UI';
import { IconClock } from '../components/Icons';
import { easeInOut, keys, pop, prog } from '../animation/ease';
import { C, DISPLAY, MONO, glow, hexA } from '../theme';

// Live slots (posting_slots): 06:00, 07:00, 08:00 WIB.
export const SLOTS = [
  { time: '06:00', acc: 'ACCOUNT 01', seed: 17 },
  { time: '07:00', acc: 'ACCOUNT 02', seed: 23 },
  { time: '08:00', acc: 'ACCOUNT 03', seed: 41 },
];
const ROW = 250, TOP = -330;

export const S06Schedule: React.FC = () => {
  const t = useT('schedule');
  const cam = { y: keys(t, [[-6, -60], [126, 60]]), z: keys(t, [[-6, -100], [126, 20]]), ry: keys(t, [[-6, 16], [126, 8]]), rx: 6 };
  const head = keys(t, [[6, 0], [96, 1]], easeInOut); // pulse position along the rail (0..1)
  const railLen = ROW * 2 + 80;
  return (
    <AbsoluteFill>
      <Stage3D cam={cam}>
        {/* rail */}
        <Obj x={-300} y={TOP + railLen / 2 - 40} z={0}>
          <div style={{ position: 'relative', width: 8, height: railLen + 120 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: hexA(C.white, 0.12) }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: `${head * 100}%`, borderRadius: 4, background: `linear-gradient(180deg, ${hexA(C.amber, 0.2)}, ${C.amber})`, boxShadow: glow(C.amber, 14, 0.8) }} />
            <div style={{ position: 'absolute', left: '50%', top: `${head * 100}%`, width: 30, height: 30, borderRadius: '50%', transform: 'translate(-50%,-50%)', background: '#fff3dc', boxShadow: glow(C.amber, 24, 1) }} />
          </div>
        </Obj>
        {SLOTS.map((sl, i) => {
          const y = TOP + i * ROW + 60;
          const reach = (i * ROW + 60 + 60) / (railLen + 120);
          const on = head >= reach ? 1 : 0;
          const p = pop(t, 4 + i * 6, 120, 15);
          const lit = on ? pop(t, Math.round(6 + reach * 90), 200, 13) : 0;
          return (
            <React.Fragment key={sl.time}>
              <Obj x={-300} y={y} z={2} scale={0.8 + 0.4 * lit}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: `4px solid ${on ? C.amber : hexA(C.white, 0.3)}`, background: on ? hexA(C.amber, 0.4) : C.bg, boxShadow: on ? glow(C.amber, 18, 0.9) : undefined }} />
              </Obj>
              <Obj x={110} y={y} z={-40 * (1 - p)} opacity={Math.min(1, p)}>
                <Panel w={640} pad={22} strength={0.4 + lit} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <VideoCard seed={sl.seed} w={92} active={lit} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                      <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: on ? C.white : C.dim, fontVariantNumeric: 'tabular-nums', textShadow: on ? glow(C.amber, 14, 0.4) : undefined }}>{sl.time}</span>
                      <span style={{ fontFamily: MONO, fontSize: 26, color: C.amber, letterSpacing: 3 }}>WIB</span>
                    </div>
                    <div style={{ display: 'flex' }}><Chip size={20} solid={!!on}>{sl.acc}</Chip></div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: on ? C.ok : C.faint }}>{on ? 'QUEUED ✓' : 'WAITING'}</div>
                </Panel>
              </Obj>
            </React.Fragment>
          );
        })}
      </Stage3D>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: prog(t, -4, 12) }}>
          <IconClock size={64} />
          <Kicker text="EVERY DAY • ASIA/JAKARTA" start={-2} />
        </div>
        <Headline text="SMART SCHEDULING" start={0} size={90} />
      </div>
    </AbsoluteFill>
  );
};
