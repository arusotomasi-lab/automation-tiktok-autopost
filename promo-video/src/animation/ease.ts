import { Easing, interpolate, spring } from 'remotion';
import { FPS } from '../timeline';

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

/** 0→1 progress between frame `from` and `from + dur`, clamped and eased. */
export function prog(frame: number, from: number, dur: number, easing = easeOut) {
  return interpolate(frame, [from, from + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
}

/** Map frame through keyframes [frame, value][] with easing between each pair. */
export function keys(frame: number, k: [number, number][], easing = easeInOut) {
  if (frame <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, v0] = k[i];
    const [f1, v1] = k[i + 1];
    if (frame <= f1) return interpolate(frame, [f0, f1], [v0, v1], { easing });
  }
  return k[k.length - 1][1];
}

/** Soft spring with slight overshoot, starting at `delay`. */
export function pop(frame: number, delay = 0, stiffness = 140, damping = 14) {
  return spring({ frame: frame - delay, fps: FPS, config: { stiffness, damping, mass: 0.9 } });
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Point on a cubic bezier. */
export function bezier(
  p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], t: number,
): [number, number] {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Deterministic pseudo random in [0,1) for index i and seed. */
export function rand(i: number, seed = 1) {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
