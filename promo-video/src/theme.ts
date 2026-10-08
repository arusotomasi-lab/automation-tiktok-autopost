import { loadFont as loadDisplay } from '@remotion/google-fonts/SpaceGrotesk';
import { loadFont as loadBody } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

export const DISPLAY = loadDisplay('normal', { weights: ['500', '700'], subsets: ['latin'] }).fontFamily;
export const BODY = loadBody('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] }).fontFamily;
export const MONO = loadMono('normal', { weights: ['400', '600'], subsets: ['latin'] }).fontFamily;

export const C = {
  bg: '#040508',
  bg2: '#0a0c12',
  panel: 'rgba(16, 18, 26, 0.78)',
  panelEdge: 'rgba(255, 170, 80, 0.28)',
  amber: '#ffb03a',
  orange: '#ff7a1a',
  gold: '#f3cf7a',
  white: '#f7f4ee',
  dim: 'rgba(247, 244, 238, 0.62)',
  faint: 'rgba(247, 244, 238, 0.32)',
  ok: '#5ef2a4',
  bad: '#ff4d5e',
};

export const W = 1080;
export const H = 1920;

export const glow = (color: string, r = 24, a = 0.55) =>
  `0 0 ${r}px ${hexA(color, a)}, 0 0 ${r * 2.5}px ${hexA(color, a * 0.45)}`;

export function hexA(hex: string, a: number) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
