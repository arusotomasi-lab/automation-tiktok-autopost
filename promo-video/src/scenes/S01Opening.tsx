import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Chip, Headline, VideoCard } from '../components/UI';
import { GlowPath, curve } from '../workflow/Flow';
import { IconPulse } from '../components/Icons';
import { easeInOut, keys, pop, prog } from '../animation/ease';
import { C, MONO, glow, hexA } from '../theme';

export const ACCOUNTS = ['ACCOUNT 01', 'ACCOUNT 02', 'ACCOUNT 03'];

export const S01Opening: React.FC = () => {
  const t = useT('opening', false);
  const cam = { z: keys(t, [[0, -700], [126, -40]], easeInOut), ry: keys(t, [[0, -10], [126, 5]]), rx: keys(t, [[0, 6], [126, -2]]), y: 40 };
  const cards = [
    { x: -330, z: -160, ry: 20 },
    { x: 0, z: 40, ry: 0 },
    { x: 330, z: -160, ry: -20 },
  ];
  const coreP = prog(t, 56, 22);
  return (
    <AbsoluteFill>
      <Stage3D cam={cam}>
        {cards.map((c, i) => {
          const p = pop(t, 6 + i * 7, 90, 16);
          const fl = Math.sin((t + i * 20) / 22) * 10;
          return (
            <Obj key={i} x={c.x} y={-40 + fl} z={c.z - (1 - p) * 1400} ry={c.ry} opacity={Math.min(1, p * 1.4)}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
                <Chip size={22} solid={t > 40 + i * 6}>{ACCOUNTS[i]}</Chip>
                <VideoCard seed={3 + i * 11} w={270} active={0.35 + 0.65 * prog(t, 40 + i * 6, 12)} label={`AUTO • ${['06:00', '07:00', '08:00'][i]}`} />
              </div>
            </Obj>
          );
        })}
        {/* the three accounts plug into one system core */}
        <Obj x={0} y={400} z={40}>
          <div style={{ position: 'relative', width: 900, height: 10 }}>
            {[-330, 0, 330].map((x, i) => (
              <GlowPath key={i} box={[0, -200, 900, 240]} pts={curve([450 + x, -190], [450, 20], 'v', 0.6)}
                draw={prog(t, 50 + i * 4, 22)} packets={2} speed={0.03} />
            ))}
          </div>
        </Obj>
        <Obj x={0} y={420} z={40} scale={0.6 + 0.4 * coreP} opacity={coreP}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 34px', borderRadius: 999, background: 'rgba(18,14,9,0.92)', border: `2px solid ${C.amber}`, boxShadow: glow(C.amber, 26, 0.6) }}>
            <IconPulse size={46} />
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 5, color: C.white }}>ONE SYSTEM</div>
          </div>
        </Obj>
      </Stage3D>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0 }}>
        <Headline text="3 TIKTOK ACCOUNTS." start={16} size={86} />
        <div style={{ height: 14 }} />
        <Headline text="FULLY AUTOMATED." start={46} size={86} color={C.amber} glowColor={C.orange} />
      </div>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, ${hexA(C.amber, 0.22 * (1 - prog(t, 0, 30)))} 0%, rgba(0,0,0,0) 50%)` }} />
    </AbsoluteFill>
  );
};
