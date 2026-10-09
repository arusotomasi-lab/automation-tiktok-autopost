import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { useT } from '../components/SceneShell';
import { Chip, Headline, Panel } from '../components/UI';
import { IconDatabase, IconPulse, IconSend, IconWarn } from '../components/Icons';
import { GlowPath, Pulse } from '../workflow/Flow';
import { easeInOut, pop, prog } from '../animation/ease';
import { BODY, C, DISPLAY, MONO, glow, hexA } from '../theme';
import { STOCK } from './S02Warehouse';

const THRESHOLD = 9;
const CHAIN = [
  { label: 'VIDEO STOCK', icon: (c: string) => <IconDatabase size={46} color={c} /> },
  { label: 'THRESHOLD DETECTED', icon: (c: string) => <IconWarn size={46} color={c} /> },
  { label: 'AUTOMATION', icon: (c: string) => <IconPulse size={46} color={c} /> },
  { label: 'TELEGRAM ALERT', icon: (c: string) => <IconSend size={46} color={c} /> },
];
const CX = [150, 410, 670, 930];
const CY = 870;

export const S10Stock: React.FC = () => {
  const t = useT('stock');
  const count = Math.round(interpolate(t, [0, 46], [STOCK, THRESHOLD], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut }));
  const low = count <= THRESHOLD;
  const frac = count / STOCK;
  const sig = prog(t, 52, 26, easeInOut); // signal travelling the chain
  const phone = prog(t, 74, 18);
  const barColor = low ? C.bad : frac < 0.5 ? C.orange : C.amber;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0 }}>
        <Headline text="STOCK MONITORING" start={-2} size={86} />
      </div>
      {/* counter */}
      <div style={{ position: 'absolute', top: 430, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Panel w={860} pad={28} accent={low ? C.bad : C.amber} strength={low ? 1.4 : 0.8} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: C.dim }}>VIDEOS LEFT IN QUEUE</div>
            {low && <div style={{ transform: `scale(${Math.min(1.1, pop(t, 46, 220, 12))})` }}><Chip size={22} solid color={C.bad}>LOW STOCK DETECTED</Chip></div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 150, lineHeight: 1, color: low ? C.bad : C.white, textShadow: glow(low ? C.bad : C.amber, 20, 0.45), fontVariantNumeric: 'tabular-nums' }}>{count}</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 40, color: C.dim }}>{low ? 'VIDEOS LEFT' : 'VIDEOS'}</span>
          </div>
          <div style={{ position: 'relative', height: 16, borderRadius: 8, background: hexA(C.white, 0.1) }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${frac * 100}%`, borderRadius: 8, background: barColor, boxShadow: glow(barColor, 10, 0.7) }} />
            <div style={{ position: 'absolute', left: `${(THRESHOLD / STOCK) * 100}%`, top: -8, bottom: -8, width: 3, background: C.bad }} />
          </div>
        </Panel>
      </div>
      {/* alert signal chain */}
      <div style={{ position: 'absolute', inset: 0, opacity: prog(t, 40, 12) }}>
        <GlowPath box={[0, CY - 40, 1080, 80]} pts={[[CX[0], CY], [CX[1], CY], [CX[2], CY], [CX[3], CY]]} draw={sig} color={C.bad} packets={0} width={4} />
        {CHAIN.map((c, i) => {
          const on = sig >= i / 3 - 0.001;
          const col = on ? (i === 3 ? '#4fb3ff' : C.bad) : C.faint;
          return (
            <div key={c.label} style={{ position: 'absolute', left: CX[i], top: CY, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 92, height: 92, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,15,22,0.95)', border: `2px solid ${hexA(col, 0.8)}`, boxShadow: on ? glow(col, 16, 0.6) : undefined }}>
                {c.icon(col)}
              </div>
              <div style={{ position: 'absolute', top: 104, fontFamily: MONO, fontWeight: 600, fontSize: 18, letterSpacing: 2, color: on ? C.white : C.faint, whiteSpace: 'nowrap' }}>{c.label}</div>
            </div>
          );
        })}
      </div>
      {sig >= 1 && <Pulse x={CX[3]} y={CY} at={78} color="#4fb3ff" size={220} />}
      {/* phone with the Telegram notification */}
      <div style={{ position: 'absolute', left: '50%', top: 1010, transform: `translate(-50%, ${(1 - phone) * 160}px)`, opacity: phone }}>
        <div style={{ width: 760, borderRadius: 40, padding: 20, background: 'linear-gradient(180deg, #15171f 0%, #0b0c11 100%)', border: `2px solid ${hexA(C.white, 0.14)}`, boxShadow: '0 40px 90px rgba(0,0,0,0.75)' }}>
          <div style={{ borderRadius: 28, padding: '22px 26px', background: 'rgba(32,36,48,0.96)', border: `1.5px solid ${hexA('#4fb3ff', 0.45)}`, boxShadow: `0 0 34px ${hexA('#4fb3ff', 0.25)}`, display: 'flex', gap: 20 }}>
            <div style={{ width: 70, height: 70, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg, #5ec3ff, #2a8fe0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconSend size={40} color="#ffffff" stroke={2.8} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: BODY, color: C.white }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 21, color: C.dim }}>
                <span style={{ fontWeight: 600 }}>Telegram • Bot Automation</span><span>now</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 31 }}>⚠️ STOK VIDEO MENIPIS</div>
              <div style={{ fontSize: 26, lineHeight: 1.35 }}>Sisa video siap posting: <b>9</b><br />Perkiraan stok: ±3 hari<br />Silakan tambahkan video baru.</div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
