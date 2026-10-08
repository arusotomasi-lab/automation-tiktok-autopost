import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { prog } from '../animation/ease';
import { BODY, C, MONO, glow, hexA } from '../theme';
import { LYRICS, SCENES, STAGES, s } from '../timeline';

/** Pipeline progress rail at the top: the viewer always sees where the video is in the flow. */
export const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const show = prog(f, s(4) - 6, 14) * (1 - prog(f, s(40) - 6, 12));
  if (show <= 0) return null;
  const n = STAGES.length;
  const x0 = 110, x1 = 970, y = 196;
  const idx = STAGES.findIndex((st) => st.scenes.some((k) => f >= s(SCENES[k][0]) && f < s(SCENES[k][1])));
  // smooth head position along the rail
  const head = (() => {
    let best = 0;
    STAGES.forEach((st, i) => st.scenes.forEach((k) => {
      const a = s(SCENES[k][0]);
      if (f >= a - 8) best = Math.max(best, i + Math.min(1, (f - a + 8) / 16) - 1);
    }));
    return Math.max(0, best);
  })();
  const hx = x0 + ((x1 - x0) * head) / (n - 1);
  return (
    <AbsoluteFill style={{ opacity: show }}>
      <div style={{ position: 'absolute', left: x0, top: y - 1, width: x1 - x0, height: 2, background: hexA(C.white, 0.14) }} />
      <div style={{ position: 'absolute', left: x0, top: y - 2, width: hx - x0, height: 4, background: `linear-gradient(90deg, ${hexA(C.amber, 0.2)}, ${C.amber})`, boxShadow: glow(C.amber, 10) }} />
      {STAGES.map((st, i) => {
        const x = x0 + ((x1 - x0) * i) / (n - 1);
        const done = i < idx;
        const on = i === idx;
        return (
          <div key={st.label} style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: on ? 22 : 14, height: on ? 22 : 14, borderRadius: '50%',
              background: on ? C.amber : done ? hexA(C.amber, 0.75) : '#1a1c24',
              border: `2px solid ${on || done ? C.amber : hexA(C.white, 0.25)}`,
              boxShadow: on ? glow(C.amber, 14, 0.8) : undefined,
            }} />
            <div style={{
              position: 'absolute', top: 26, fontFamily: MONO, fontWeight: 600, fontSize: 17, letterSpacing: 2,
              color: on ? C.amber : done ? hexA(C.white, 0.6) : hexA(C.white, 0.3), whiteSpace: 'nowrap',
            }}>{st.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Karaoke-style lyric line: words light up in time with the sung line. */
export const Lyrics: React.FC = () => {
  const f = useCurrentFrame();
  const line = LYRICS.find(([a, b]) => f >= s(a) - 4 && f <= s(b) + 6);
  if (!line) return null;
  const [a, b, text] = line;
  const fa = s(a), fb = s(b);
  const o = prog(f, fa - 4, 8) * (1 - prog(f, fb, 8));
  const words = text.split(' ');
  const per = (fb - fa) / words.length;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1380, height: 230, background: 'linear-gradient(180deg, rgba(4,5,8,0) 0%, rgba(4,5,8,0.82) 35%, rgba(4,5,8,0.82) 65%, rgba(4,5,8,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 70, right: 70, top: 1452, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 14px' }}>
        {words.map((w, i) => {
          const lit = prog(f, fa + i * per - 2, 5);
          return (
            <span key={i} style={{
              fontFamily: BODY, fontWeight: 600, fontSize: 40, fontStyle: 'italic', lineHeight: 1.3,
              color: lit > 0.5 ? C.white : hexA(C.white, 0.42),
              textShadow: lit > 0.5 ? `0 0 18px ${hexA(C.amber, 0.55)}, 0 3px 12px rgba(0,0,0,0.9)` : '0 3px 12px rgba(0,0,0,0.9)',
            }}>{w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Subtle film finish: light grain line sweep + letterbox-free vignette pulse on beats. */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  const beat = Math.exp(-((f % 15) / 6));
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% 45%, ${hexA(C.amber, 0.035 * beat)} 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 4px)' }} />
    </AbsoluteFill>
  );
};
