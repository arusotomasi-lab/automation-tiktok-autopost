import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Chip, Headline, Panel, VideoCard } from '../components/UI';
import { IconSpark } from '../components/Icons';
import { easeIn, keys, pop, prog, rand } from '../animation/ease';
import { BODY, C, MONO, glow, hexA } from '../theme';
import { HERO_SEED } from './S03Selection';

// Real examples in the style the production prompt produces (owner content rules: no selling, #fyp first).
const OUT = [
  ['HOOK', 'Recoil PB masih liar? 🎯'],
  ['CAPTION', 'Atur spray pelan-pelan, main jadi lebih terkontrol.'],
  ['HASHTAGS', '#fyp #pointblank #pbindonesia #gamingindonesia'],
];
const VARIANTS = [
  ['ACCOUNT 01', 'Recoil PB masih liar?'],
  ['ACCOUNT 02', 'Rotasi acak bikin susah?'],
  ['ACCOUNT 03', 'Cover jelek bikin stres?'],
];

const type = (text: string, t: number, start: number, cps = 1.6) => {
  const chars = Array.from(text);
  const n = Math.max(0, Math.min(chars.length, Math.floor((t - start) * cps)));
  return chars.slice(0, n).join('');
};

export const S05Caption: React.FC = () => {
  const t = useT('caption');
  const cam = { z: keys(t, [[-6, -160], [156, 20]]), rx: keys(t, [[-6, 8], [156, 0]]), y: 0 };
  const absorb = prog(t, -4, 22, easeIn);
  const coreY = -330;
  return (
    <AbsoluteFill>
      <Stage3D cam={cam}>
        {/* AI core: counter-rotating rings */}
        <Obj x={0} y={coreY} z={0} scale={1 + 0.06 * Math.sin(t / 5) * prog(t, 10, 20)}>
          <div style={{ position: 'relative', width: 340, height: 340 }}>
            <svg width={340} height={340} style={{ position: 'absolute', inset: 0 }}>
              {[150, 122, 94].map((r, i) => (
                <circle key={r} cx={170} cy={170} r={r} fill="none" stroke={i === 1 ? C.gold : C.amber} strokeWidth={i === 0 ? 2 : 3}
                  strokeDasharray={i === 0 ? '4 10' : i === 1 ? '60 24 8 24' : '120 40'} opacity={0.85}
                  transform={`rotate(${(i % 2 ? -1 : 1) * t * (2 + i)} 170 170)`} style={{ filter: `drop-shadow(0 0 6px ${C.amber})` }} />
              ))}
            </svg>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(C.amber, 0.55)} 0%, ${hexA(C.orange, 0.15)} 60%, rgba(0,0,0,0) 72%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconSpark size={84} color="#fff3dc" />
            </div>
          </div>
        </Obj>
        {/* clip is absorbed into the engine */}
        {absorb < 1 && (
          <Obj x={-380 * (1 - absorb)} y={coreY + 420 * (1 - absorb)} z={0} scale={1 - 0.9 * absorb} opacity={1 - absorb * 0.8} rz={-20 * (1 - absorb)}>
            <VideoCard seed={HERO_SEED} w={200} active={1} />
          </Obj>
        )}
        {/* data stream from core down into the output panel */}
        {Array.from({ length: 26 }).map((_, i) => {
          const life = ((t - 14) * 0.035 + rand(i, 3)) % 1;
          if (t < 14) return null;
          const x = (rand(i, 4) - 0.5) * 360 * life;
          return <Obj key={i} x={x} y={coreY + 150 + life * 260} z={0} opacity={Math.sin(life * Math.PI) * 0.9}>
            <div style={{ width: 8, height: 8 + 18 * life, borderRadius: 4, background: '#ffe2b0', boxShadow: glow(C.amber, 10) }} />
          </Obj>;
        })}
      </Stage3D>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0 }}>
        <Headline text="AI CAPTION ENGINE" start={-2} size={88} />
      </div>
      <div style={{ position: 'absolute', top: 830, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: prog(t, 18, 12), transform: `translateY(${(1 - prog(t, 18, 12)) * 30}px)` }}>
        <Panel w={900} pad={30} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {OUT.map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: C.amber, opacity: prog(t, 22 + i * 18, 8) }}>{k}</div>
              <div style={{ fontFamily: BODY, fontWeight: i === 0 ? 700 : 500, fontSize: i === 0 ? 40 : 32, color: i === 2 ? C.gold : C.white, minHeight: i === 0 ? 48 : 40 }}>
                {type(v, t, 24 + i * 18)}
                {t > 24 + i * 18 && t < 24 + i * 18 + Array.from(v).length / 1.6 + 6 && <span style={{ color: C.amber }}>▍</span>}
              </div>
            </div>
          ))}
        </Panel>
      </div>
      <div style={{ position: 'absolute', top: 1220, left: 30, right: 30, display: 'flex', justifyContent: 'center', gap: 18 }}>
        {VARIANTS.map(([acc, hook], i) => {
          const p = pop(t, 92 + i * 8, 150, 15);
          return (
            <div key={acc} style={{ opacity: Math.min(1, p), transform: `translateY(${(1 - p) * 60}px) scale(${0.9 + 0.1 * p})` }}>
              <Panel w={322} pad={18} radius={22} strength={0.9} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex' }}><Chip size={18}>{acc}</Chip></div>
                <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 26, color: C.white, lineHeight: 1.2 }}>{hook}</div>
              </Panel>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
