import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { rand } from '../animation/ease';
import { C, hexA } from '../theme';

/** Persistent environment: deep gradient, perspective grid floor, drifting dust and a vignette. */
export const Background: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const f = useCurrentFrame();
  const gridShift = (f * 2.2) % 120;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 55% at 50% 42%, ${hexA(C.orange, 0.13 * intensity)} 0%, rgba(0,0,0,0) 60%),
            radial-gradient(ellipse 70% 40% at 50% 100%, ${hexA(C.amber, 0.10)} 0%, rgba(0,0,0,0) 70%),
            linear-gradient(180deg, #06070c 0%, #040508 55%, #07070a 100%)`,
        }}
      />
      {/* floor grid */}
      <AbsoluteFill style={{ perspective: 900, perspectiveOrigin: '50% 30%' }}>
        <div
          style={{
            position: 'absolute', left: -1400, right: -1400, top: 1180, height: 2600,
            transform: 'rotateX(78deg)', transformOrigin: '50% 0%',
            backgroundImage: `linear-gradient(${hexA(C.amber, 0.22)} 2px, transparent 2px), linear-gradient(90deg, ${hexA(C.amber, 0.22)} 2px, transparent 2px)`,
            backgroundSize: '120px 120px',
            backgroundPosition: `0px ${gridShift}px`,
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,0.9) 60%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,0.9) 60%, rgba(0,0,0,0) 100%)',
            opacity: 0.55,
          }}
        />
        {/* ceiling grid, fainter */}
        <div
          style={{
            position: 'absolute', left: -1400, right: -1400, top: -1900, height: 2200,
            transform: 'rotateX(-78deg)', transformOrigin: '50% 100%',
            backgroundImage: `linear-gradient(${hexA(C.gold, 0.12)} 1px, transparent 1px), linear-gradient(90deg, ${hexA(C.gold, 0.12)} 1px, transparent 1px)`,
            backgroundSize: '160px 160px',
            backgroundPosition: `0px ${-gridShift}px`,
            WebkitMaskImage: 'linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0) 100%)',
            opacity: 0.35,
          }}
        />
      </AbsoluteFill>
      {/* dust particles */}
      {Array.from({ length: 70 }).map((_, i) => {
        const depth = 0.3 + rand(i, 3) * 0.7;
        const x = rand(i, 1) * 1080 + Math.sin((f + i * 40) / 90) * 18 * depth;
        const y = ((rand(i, 2) * 2100 - f * (0.6 + depth * 1.4)) % 2100 + 2100) % 2100 - 90;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin((f + i * 23) / (24 + i % 13)));
        const size = 2 + depth * 5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
              background: i % 5 === 0 ? C.gold : C.amber,
              opacity: 0.55 * tw * depth * intensity,
              boxShadow: `0 0 ${8 + depth * 14}px ${hexA(C.amber, 0.8)}`,
              filter: depth < 0.5 ? 'blur(1.5px)' : undefined,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{ background: 'radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)' }}
      />
    </AbsoluteFill>
  );
};
