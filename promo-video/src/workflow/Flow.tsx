import React from 'react';
import { useCurrentFrame } from 'remotion';
import { bezier, clamp01 } from '../animation/ease';
import { C, hexA } from '../theme';

type Pt = [number, number];

/** Cubic path from a to b; vertical (default) or horizontal tangents. */
export function curve(a: Pt, b: Pt, dir: 'v' | 'h' = 'v', bend = 0.5): [Pt, Pt, Pt, Pt] {
  if (dir === 'v') {
    const dy = (b[1] - a[1]) * bend;
    return [a, [a[0], a[1] + dy], [b[0], b[1] - dy], b];
  }
  const dx = (b[0] - a[0]) * bend;
  return [a, [a[0] + dx, a[1]], [b[0] - dx, b[1]], b];
}

/**
 * Glowing connection drawn progressively (draw: 0→1) with energy packets travelling along it.
 * Coordinates are in the parent's pixel space; the SVG covers [x0,y0,w,h].
 */
export const GlowPath: React.FC<{
  pts: [Pt, Pt, Pt, Pt]; draw: number; box: [number, number, number, number]; color?: string; width?: number;
  packets?: number; speed?: number; packetOpacity?: number; dashed?: boolean;
}> = ({ pts, draw, box, color = C.amber, width = 4, packets = 3, speed = 0.018, packetOpacity = 1, dashed }) => {
  const f = useCurrentFrame();
  const [x0, y0, w, h] = box;
  const [p0, p1, p2, p3] = pts;
  const d = `M ${p0[0] - x0} ${p0[1] - y0} C ${p1[0] - x0} ${p1[1] - y0}, ${p2[0] - x0} ${p2[1] - y0}, ${p3[0] - x0} ${p3[1] - y0}`;
  const len = 2000;
  const dr = clamp01(draw);
  return (
    <svg width={w} height={h} style={{ position: 'absolute', left: x0, top: y0, overflow: 'visible' }}>
      <path d={d} stroke={hexA(color, 0.18)} strokeWidth={width * 4} fill="none" strokeLinecap="round"
        pathLength={len} strokeDasharray={`${len * dr} ${len}`} style={{ filter: 'blur(6px)' }} />
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round"
        pathLength={len} strokeDasharray={dashed ? '14 16' : `${len * dr} ${len}`} opacity={dashed ? dr : 1} />
      {dr > 0.98 && packetOpacity > 0 && Array.from({ length: packets }).map((_, i) => {
        const t = ((f * speed + i / packets) % 1 + 1) % 1;
        const [x, y] = bezier(p0, p1, p2, p3, t);
        return (
          <g key={i} opacity={packetOpacity * Math.sin(t * Math.PI)}>
            <circle cx={x - x0} cy={y - y0} r={width * 4} fill={hexA(color, 0.25)} />
            <circle cx={x - x0} cy={y - y0} r={width * 1.6} fill="#fff6e6" />
          </g>
        );
      })}
      {dr > 0 && dr < 1 && (() => {
        const [x, y] = bezier(p0, p1, p2, p3, dr);
        return <circle cx={x - x0} cy={y - y0} r={width * 2.4} fill="#fff6e6" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />;
      })()}
    </svg>
  );
};

/** Expanding ring pulse at a point (for arrivals / confirmations). */
export const Pulse: React.FC<{ x: number; y: number; at: number; color?: string; size?: number }> = ({ x, y, at, color = C.amber, size = 200 }) => {
  const f = useCurrentFrame();
  const t = (f - at) / 22;
  if (t < 0 || t > 1) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: size * (0.3 + t), height: size * (0.3 + t), borderRadius: '50%',
      transform: 'translate(-50%,-50%)', border: `3px solid ${hexA(color, 1 - t)}`, boxShadow: `0 0 30px ${hexA(color, 0.6 * (1 - t))}`,
    }} />
  );
};
