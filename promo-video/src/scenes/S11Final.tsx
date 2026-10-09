import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Headline } from '../components/UI';
import {
  IconArchive, IconClock, IconCloud, IconDatabase, IconLayers, IconPlay, IconSend, IconShield, IconShuffle, IconSpark,
} from '../components/Icons';
import { GlowPath, curve } from '../workflow/Flow';
import { easeInOut, keys, prog } from '../animation/ease';
import { BODY, C, MONO, glow, hexA } from '../theme';
import vo from '../audio/vo_timing.json';

// Headline beats follow the voice-over: 'Upload sekali.' -> UPLOAD ONCE, 'Otomatiskan semuanya.' -> final hit.
const T_TAG = Math.round((vo.cues.tag_start - 40) * 30);
const T_HIT = Math.round((vo.cues.final_hit - 40) * 30);

// The whole system as one connected map (snake layout, top to bottom).
const NODES: { label: string; icon: (c: string) => React.ReactNode; x: number; y: number }[] = [
  { label: 'STORAGE', icon: (c) => <IconCloud size={50} color={c} />, x: -300, y: -760 },
  { label: 'QUEUE', icon: (c) => <IconDatabase size={50} color={c} />, x: 0, y: -760 },
  { label: 'RANDOM PICK', icon: (c) => <IconShuffle size={50} color={c} />, x: 300, y: -760 },
  { label: 'ANTI DUPLICATE', icon: (c) => <IconShield size={50} color={c} />, x: 300, y: -380 },
  { label: 'AI CAPTION', icon: (c) => <IconSpark size={50} color={c} />, x: 0, y: -380 },
  { label: 'SCHEDULER', icon: (c) => <IconClock size={50} color={c} />, x: -300, y: -380 },
  { label: 'BUFFER', icon: (c) => <IconLayers size={50} color={c} />, x: -300, y: 0 },
  { label: '3 ACCOUNTS', icon: (c) => <IconPlay size={50} color={c} />, x: 0, y: 0 },
  { label: 'ARCHIVE', icon: (c) => <IconArchive size={50} color={c} />, x: 300, y: 0 },
  { label: 'TELEGRAM', icon: (c) => <IconSend size={50} color={c} />, x: 300, y: 380 },
];

export const S11Final: React.FC = () => {
  const t = useT('final');
  // pull back to reveal the whole system, then a slow orbit while the narrator closes
  const cam = { z: keys(t, [[-6, 420], [64, -520], [T_TAG, -640]], easeInOut), rx: keys(t, [[-6, 34], [64, 26], [T_TAG, 22]]), ry: keys(t, [[-6, -14], [64, 6], [T_TAG, 12]]), y: keys(t, [[-6, -420], [64, -200], [T_TAG, -180]]) };
  const fadeAt = T_TAG - 14;
  const net = 1 - 0.82 * prog(t, fadeAt, 18);
  const flash = Math.max(0, 1 - Math.abs(t - T_HIT) / 8) * (t >= T_HIT - 2 ? 1 : 0);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, opacity: net, filter: t > fadeAt ? `blur(${prog(t, fadeAt, 18) * 6}px)` : undefined }}>
        <Stage3D cam={cam} originY="40%">
          <Obj x={0} y={0} z={0}>
            <div style={{ position: 'relative' }}>
              {NODES.slice(0, -1).map((n, i) => {
                const m = NODES[i + 1];
                const horiz = n.y === m.y;
                return <GlowPath key={i} box={[-700, -1000, 1400, 1600]} pts={curve([n.x, n.y], [m.x, m.y], horiz ? 'h' : 'v')}
                  draw={prog(t, -4 + i * 4, 12)} packets={2} speed={0.04} width={5} />;
              })}
            </div>
          </Obj>
          {NODES.map((n, i) => {
            const p = prog(t, -6 + i * 4, 12);
            return (
              <Obj key={n.label} x={n.x} y={n.y} z={10} scale={0.7 + 0.3 * p} opacity={p}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 120, height: 120, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(18,16,14,0.95)', border: `2px solid ${C.amber}`, boxShadow: glow(C.amber, 18, 0.55) }}>
                    {n.icon(C.amber)}
                  </div>
                  <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 2, color: C.white, whiteSpace: 'nowrap' }}>{n.label}</div>
                </div>
              </Obj>
            );
          })}
        </Stage3D>
      </div>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 30% at 50% 50%, ${hexA(C.orange, 0.22 * prog(t, T_TAG, 20) + 0.25 * flash)} 0%, rgba(0,0,0,0) 70%)` }} />
      <div style={{ position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <Headline text="UPLOAD ONCE." start={T_TAG - 3} size={120} />
        <Headline text="AUTOMATE EVERYTHING." start={T_HIT - 4} stagger={2} size={74} color={C.amber} glowColor={C.orange} />
        <div style={{ height: 30 }} />
        <div style={{ opacity: prog(t, T_HIT + 20, 14), transform: `translateY(${(1 - prog(t, T_HIT + 20, 14)) * 20}px)`, fontFamily: BODY, fontWeight: 500, fontSize: 32, color: C.dim, letterSpacing: 0.5 }}>
          3 Accounts • AI Caption • Anti Duplicate • Auto Scheduling
        </div>
        <div style={{ height: 50 }} />
        <div style={{ opacity: prog(t, T_HIT + 34, 14), display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60 * prog(t, T_HIT + 34, 14), height: 2, background: C.gold }} />
          <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 8, color: C.gold }}>TIKTOK AUTOMATION SYSTEM</div>
          <div style={{ width: 60 * prog(t, T_HIT + 34, 14), height: 2, background: C.gold }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
