import React from 'react';
import { useCurrentFrame } from 'remotion';
import { BODY, C, DISPLAY, MONO, glow, hexA } from '../theme';
import { prog, rand } from '../animation/ease';

/** Glass panel with amber edge light. */
export const Panel: React.FC<{
  w: number; h?: number; pad?: number; radius?: number; accent?: string; strength?: number;
  children?: React.ReactNode; style?: React.CSSProperties;
}> = ({ w, h, pad = 28, radius = 28, accent = C.amber, strength = 1, children, style }) => (
  <div
    style={{
      width: w, height: h, padding: pad, boxSizing: 'border-box', borderRadius: radius,
      background: `linear-gradient(160deg, rgba(30,32,44,0.92) 0%, rgba(12,13,19,0.94) 60%, rgba(18,14,10,0.94) 100%)`,
      border: `1.5px solid ${hexA(accent, 0.35 * strength + 0.1)}`,
      boxShadow: `0 30px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 ${40 * strength}px ${hexA(accent, 0.18 * strength)}`,
      color: C.white, fontFamily: BODY, position: 'relative', overflow: 'hidden', ...style,
    }}
  >
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, ${hexA('#ffffff', 0.06)} 0%, rgba(255,255,255,0) 35%)`, pointerEvents: 'none' }} />
    {children}
  </div>
);

export const Chip: React.FC<{ children: React.ReactNode; color?: string; size?: number; solid?: boolean }> = ({
  children, color = C.amber, size = 26, solid,
}) => (
  <div
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 10, padding: `${size * 0.35}px ${size * 0.75}px`,
      borderRadius: 999, fontFamily: MONO, fontWeight: 600, fontSize: size, letterSpacing: 2,
      color: solid ? '#140b02' : color, background: solid ? color : hexA(color, 0.1),
      border: `1.5px solid ${hexA(color, 0.6)}`, boxShadow: solid ? glow(color, 14, 0.6) : `0 0 18px ${hexA(color, 0.25)}`,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

/** Procedural "gameplay clip" thumbnail (generic FPS look, no real footage). */
export const Thumb: React.FC<{ seed: number; w: number; h: number; t?: number }> = ({ seed, w, h, t = 0 }) => {
  const hue = 18 + rand(seed, 4) * 30;
  const horizon = 0.45 + rand(seed, 5) * 0.15;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: `linear-gradient(180deg, hsl(${hue + 190},25%,${14 + rand(seed, 6) * 8}%) 0%, hsl(${hue},40%,${10 + rand(seed, 7) * 8}%) ${horizon * 100}%, hsl(${hue},30%,6%) 100%)` }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const bw = (0.12 + rand(seed * 7 + i, 8) * 0.25) * w;
        const bh = (0.15 + rand(seed * 7 + i, 9) * 0.35) * h;
        const x = rand(seed * 7 + i, 10) * w - bw / 3 + Math.sin(t / 30 + i) * 4;
        return <div key={i} style={{ position: 'absolute', left: x, top: horizon * h - bh, width: bw, height: bh, background: `hsla(${hue + 10},20%,${8 + i * 2}%,0.95)`, borderTop: `2px solid hsla(${hue + 20},60%,45%,0.35)` }} />;
      })}
      <div style={{ position: 'absolute', left: '50%', top: '46%', width: w * 0.16, height: w * 0.16, transform: 'translate(-50%,-50%)', border: `2px solid ${hexA(C.amber, 0.85)}`, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', left: '50%', top: '46%', width: w * 0.3, height: 2, transform: 'translate(-50%,-50%)', background: hexA(C.amber, 0.7) }} />
      <div style={{ position: 'absolute', left: '50%', top: '46%', width: 2, height: w * 0.3, transform: 'translate(-50%,-50%)', background: hexA(C.amber, 0.7) }} />
      <div style={{ position: 'absolute', left: w * 0.07, bottom: h * 0.06, width: w * 0.36, height: h * 0.018, background: hexA(C.ok, 0.8), borderRadius: 3 }} />
      <div style={{ position: 'absolute', right: w * 0.07, bottom: h * 0.06, fontFamily: MONO, fontSize: w * 0.075, color: hexA(C.white, 0.85) }}>30/120</div>
    </div>
  );
};

/** Vertical 9:16 video card. */
export const VideoCard: React.FC<{
  seed: number; w?: number; label?: string; accent?: string; active?: number; dim?: number; children?: React.ReactNode;
}> = ({ seed, w = 220, label, accent = C.amber, active = 0, dim = 0, children }) => {
  const f = useCurrentFrame();
  const h = w * 16 / 9;
  return (
    <div
      style={{
        width: w, height: h, borderRadius: w * 0.09, position: 'relative', overflow: 'hidden',
        border: `${Math.max(2, w * 0.012)}px solid ${hexA(accent, 0.25 + active * 0.75)}`,
        boxShadow: `0 ${w * 0.12}px ${w * 0.35}px rgba(0,0,0,0.7), 0 0 ${w * 0.25 * active}px ${hexA(accent, 0.7 * active)}`,
        background: '#0b0c10',
      }}
    >
      <Thumb seed={seed} w={w} h={h} t={f} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)', width: w * 0.26, height: w * 0.26, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: `2px solid ${hexA(C.white, 0.7)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 0, height: 0, borderTop: `${w * 0.05}px solid transparent`, borderBottom: `${w * 0.05}px solid transparent`, borderLeft: `${w * 0.08}px solid ${C.white}`, marginLeft: w * 0.02 }} />
      </div>
      {label && (
        <div style={{ position: 'absolute', left: w * 0.07, bottom: h * 0.1, fontFamily: MONO, fontSize: Math.max(11, w * 0.065), color: C.white, letterSpacing: 1, opacity: 0.9 }}>
          {label}
        </div>
      )}
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(4,5,8,${dim})` }} />}
      {children}
    </div>
  );
};

/** Workflow node: icon tile + label. */
export const NodeBox: React.FC<{
  icon: React.ReactNode; label: string; sub?: string; w?: number; active?: number; accent?: string;
}> = ({ icon, label, sub, w = 340, active = 1, accent = C.amber }) => (
  <Panel w={w} pad={22} radius={26} accent={accent} strength={0.4 + active * 0.8}
    style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
    <div style={{ width: 84, height: 84, borderRadius: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hexA(accent, 0.1 + 0.08 * active), border: `1.5px solid ${hexA(accent, 0.5)}` }}>
      {icon}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 32, letterSpacing: 1.5, color: C.white, whiteSpace: 'nowrap' }}>{label}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim, letterSpacing: 1, whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  </Panel>
);

/** Headline whose words rise out of a blur, staggered. */
export const Headline: React.FC<{
  text: string; start: number; size?: number; color?: string; stagger?: number; weight?: number;
  font?: string; letter?: number; align?: 'center' | 'left'; glowColor?: string; out?: number;
}> = ({ text, start, size = 96, color = C.white, stagger = 4, weight = 700, font = DISPLAY, letter = 2, align = 'center', glowColor, out }) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  const o = out !== undefined ? 1 - prog(f, out, 10) : 1;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: `0 ${size * 0.28}px`, opacity: o }}>
      {words.map((w, i) => {
        const p = prog(f, start + i * stagger, 16);
        return (
          <span key={i} style={{
            display: 'inline-block', fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.04,
            letterSpacing: letter, color, opacity: p, transform: `translateY(${(1 - p) * size * 0.5}px) scale(${0.94 + p * 0.06})`,
            filter: `blur(${(1 - p) * 14}px)`, textShadow: glowColor ? glow(glowColor, 22, 0.55) : '0 6px 30px rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap',
          }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Small uppercase kicker with a light bar. */
export const Kicker: React.FC<{ text: string; start: number; color?: string }> = ({ text, start, color = C.amber }) => {
  const f = useCurrentFrame();
  const p = prog(f, start, 14);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: p, transform: `translateY(${(1 - p) * 16}px)`, justifyContent: 'center' }}>
      <div style={{ width: 56 * p, height: 3, background: color, boxShadow: glow(color, 8) }} />
      <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 28, letterSpacing: 7, color }}>{text}</div>
      <div style={{ width: 56 * p, height: 3, background: color, boxShadow: glow(color, 8) }} />
    </div>
  );
};
