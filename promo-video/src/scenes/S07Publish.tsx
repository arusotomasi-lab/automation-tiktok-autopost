import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Stage3D, Obj } from '../camera/Stage3D';
import { useT } from '../components/SceneShell';
import { Chip, Headline, NodeBox, VideoCard } from '../components/UI';
import { IconLayers, IconPulse } from '../components/Icons';
import { GlowPath, curve } from '../workflow/Flow';
import { easeInOut, keys, prog } from '../animation/ease';
import { C, MONO, hexA } from '../theme';
import { SLOTS } from './S06Schedule';

// Shared layout with S08 so the three phones stay in place between scenes.
export const PHONE_X = [-335, 0, 335];
export const PHONE_Y = 250;
export const PHONE_W = 236;

export const Phones: React.FC<{ t: number; progress: (i: number) => number; posted: (i: number) => number }> = ({ progress, posted }) => (
  <>
    {SLOTS.map((sl, i) => {
      const p = progress(i);
      const ok = posted(i);
      return (
        <Obj key={sl.acc} x={PHONE_X[i]} y={PHONE_Y} z={i === 1 ? 30 : -30} ry={(1 - i) * 12}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Chip size={20} solid={ok > 0.5} color={ok > 0.5 ? C.ok : C.amber}>{sl.acc}</Chip>
            <VideoCard seed={sl.seed} w={PHONE_W} active={Math.max(p > 0 ? 0.5 : 0.15, ok)} accent={ok > 0.5 ? C.ok : C.amber} dim={p > 0 ? 0 : 0.45}>
              {p > 0 && ok < 0.5 && (
                <div style={{ position: 'absolute', left: 18, right: 18, top: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 2, color: C.white }}>PUBLISHING…</div>
                  <div style={{ height: 8, borderRadius: 4, background: hexA(C.white, 0.2) }}>
                    <div style={{ width: `${p * 100}%`, height: '100%', borderRadius: 4, background: C.amber }} />
                  </div>
                </div>
              )}
              {ok > 0.02 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: hexA('#03140b', 0.55 * ok) }}>
                  <div style={{ width: 96, height: 96, borderRadius: '50%', transform: `scale(${ok})`, background: C.ok, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${hexA(C.ok, 0.8)}` }}>
                    <svg width={56} height={56} viewBox="0 0 48 48"><path d="M10 25l9 9 19-20" stroke="#04140b" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${ok} 1`} /></svg>
                  </div>
                  <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: C.ok, opacity: ok }}>POSTED ✓</div>
                </div>
              )}
            </VideoCard>
          </div>
        </Obj>
      );
    })}
  </>
);

export const S07Publish: React.FC = () => {
  const t = useT('publish');
  const cam = { z: keys(t, [[-6, -220], [186, 0]], easeInOut), ry: keys(t, [[-6, -10], [186, 0]]), rx: keys(t, [[-6, 10], [186, 4]]), y: 20 };
  const ENG_Y = -470, BUF_Y = -210;
  return (
    <AbsoluteFill>
      <Stage3D cam={cam}>
        <Obj x={0} y={0} z={0}>
          <div style={{ position: 'relative' }}>
            <GlowPath box={[-60, ENG_Y, 120, BUF_Y - ENG_Y]} pts={curve([0, ENG_Y + 60], [0, BUF_Y - 60])} draw={prog(t, 10, 26)} packets={2} speed={0.03} />
            {PHONE_X.map((x, i) => (
              <GlowPath key={i} box={[-560, BUF_Y, 1120, PHONE_Y - BUF_Y]} pts={curve([0, BUF_Y + 60], [x, PHONE_Y - 250], 'v', 0.55)}
                draw={prog(t, 40 + i * 8, 30)} packets={3} speed={0.028} />
            ))}
          </div>
        </Obj>
        <Obj x={0} y={ENG_Y} z={0} opacity={prog(t, -4, 14)}>
          <NodeBox icon={<IconPulse size={56} />} label="AUTOMATION ENGINE" sub="n8n • every minute" w={560} />
        </Obj>
        <Obj x={0} y={BUF_Y} z={0} opacity={prog(t, 22, 14)} scale={0.9 + 0.1 * prog(t, 22, 14)}>
          <NodeBox icon={<IconLayers size={56} />} label="BUFFER" sub="publishing API" w={420} />
        </Obj>
        <Phones t={t} progress={(i) => prog(t, 76 + i * 10, 70)} posted={() => 0} />
      </Stage3D>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0 }}>
        <Headline text="AUTO PUBLISHING" start={-2} size={92} />
      </div>
    </AbsoluteFill>
  );
};
