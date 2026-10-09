import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Chip, Headline, Panel, VideoCard } from '../components/UI';
import { IconArchive, IconDatabase } from '../components/Icons';
import { GlowPath, Pulse } from '../workflow/Flow';
import { bezier, easeInOut, keys, pop, prog } from '../animation/ease';
import { C, DISPLAY, MONO, hexA } from '../theme';
import { HERO_LABEL, HERO_SEED } from './S03Selection';
import { STOCK } from './S02Warehouse';

const QX = -250, AX = 250, BY = -140;

const Bin: React.FC<{ title: string; sub: string; icon: React.ReactNode; count: number; accent: string; cards: number; seed: number }> = ({ title, sub, icon, count, accent, cards, seed }) => (
  <Panel w={400} h={520} pad={24} accent={accent} strength={1} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    {icon}
    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, letterSpacing: 2, color: C.white, textAlign: 'center', lineHeight: 1.05 }}>{title}</div>
    <div style={{ fontFamily: MONO, fontSize: 20, color: C.faint, letterSpacing: 2 }}>{sub}</div>
    <div style={{ position: 'relative', width: 300, height: 220, marginTop: 8 }}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} style={{ position: 'absolute', left: 60 + i * 26, top: 10 + i * 8, transform: `rotate(${(i - 2) * 4}deg)` }}>
          <VideoCard seed={seed + i} w={96} dim={0.4} active={0.1} />
        </div>
      ))}
    </div>
    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: accent, fontVariantNumeric: 'tabular-nums' }}>{count}</div>
  </Panel>
);

export const S09Archive: React.FC = () => {
  const t = useT('archive');
  const cam = { ry: keys(t, [[-6, 10], [96, -6]]), z: keys(t, [[-6, -160], [96, -40]]), rx: 6, y: 30 };
  const fly = prog(t, 8, 34, easeInOut);
  const arrived = t >= 42;
  const p0: [number, number] = [QX, BY], p1: [number, number] = [QX + 60, BY - 520], p2: [number, number] = [AX - 60, BY - 520], p3: [number, number] = [AX, BY];
  const [cx, cy] = bezier(p0, p1, p2, p3, fly);
  return (
    <AbsoluteFill>
      <Stage3D cam={cam}>
        <Obj x={QX} y={BY + 120} z={-20} ry={12}>
          <Bin title="QUEUE" sub="videos/" icon={<IconDatabase size={64} />} count={fly > 0.05 ? STOCK - 1 : STOCK} accent={C.amber} cards={5} seed={60} />
        </Obj>
        <Obj x={AX} y={BY + 120} z={-20} ry={-12}>
          <Bin title="POSTED ARCHIVE" sub="posted/" icon={<IconArchive size={64} color={C.ok} />} count={arrived ? 1 : 0} accent={C.ok} cards={arrived ? 1 : 0} seed={HERO_SEED} />
        </Obj>
        <Obj x={0} y={0} z={30}>
          <div style={{ position: 'relative' }}>
            <GlowPath box={[-600, -800, 1200, 900]} pts={[p0, p1, p2, p3]} draw={prog(t, 0, 20)} dashed packets={0} color={hexA(C.gold, 0.9)} width={3} />
          </div>
        </Obj>
        {!arrived && (
          <Obj x={cx} y={cy} z={60 + Math.sin(fly * Math.PI) * 120} rz={(fly - 0.5) * 20} scale={1 + 0.2 * Math.sin(fly * Math.PI)}>
            <VideoCard seed={HERO_SEED} w={150} active={1} label={HERO_LABEL} />
          </Obj>
        )}
      </Stage3D>
      {arrived && <Pulse x={540 + AX} y={960 + BY - 60} at={42} color={C.ok} size={340} />}
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0 }}>
        <Headline text="AUTOMATIC ARCHIVING" start={-2} size={84} />
      </div>
      <div style={{ position: 'absolute', top: 1190, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: prog(t, 40, 12), transform: `translateY(${(1 - prog(t, 40, 12)) * 24}px)` }}>
        <Panel w={860} pad={22} accent={C.ok} style={{ display: 'flex', alignItems: 'center', gap: 18, fontFamily: MONO, fontSize: 24 }}>
          <IconDatabase size={40} color={C.ok} />
          <span style={{ color: C.dim }}>{HERO_LABEL}</span>
          <span style={{ color: C.faint }}>→</span>
          <span style={{ color: C.white }}>status:</span>
          <span style={{ color: C.ok, fontWeight: 600, transform: `scale(${Math.min(1.15, pop(t, 46))})`, display: 'inline-block' }}>POSTED ✓</span>
        </Panel>
        <Chip size={20} color={C.gold}>ARCHIVED, NOT DELETED</Chip>
      </div>
    </AbsoluteFill>
  );
};
