import React from 'react';
import { C } from '../theme';

type P = { size?: number; color?: string; stroke?: number };
const Svg: React.FC<P & { children: React.ReactNode }> = ({ size = 64, color = C.amber, stroke = 2.4, children }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
    {children}
  </svg>
);

export const IconCloud: React.FC<P> = (p) => (
  <Svg {...p}><path d="M14 36h21a8 8 0 0 0 1-15.9A11 11 0 0 0 15 18a9 9 0 0 0-1 18z" /><path d="M24 22v10M20 28l4 4 4-4" /></Svg>
);
export const IconDatabase: React.FC<P> = (p) => (
  <Svg {...p}><ellipse cx="24" cy="11" rx="13" ry="5" /><path d="M11 11v26c0 2.8 5.8 5 13 5s13-2.2 13-5V11" /><path d="M11 24c0 2.8 5.8 5 13 5s13-2.2 13-5" /></Svg>
);
export const IconSpark: React.FC<P> = (p) => (
  <Svg {...p}><path d="M24 5l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" /><path d="M38 33l1.5 4.5L44 39l-4.5 1.5L38 45l-1.5-4.5L32 39l4.5-1.5z" /></Svg>
);
export const IconClock: React.FC<P> = (p) => (
  <Svg {...p}><circle cx="24" cy="24" r="17" /><path d="M24 14v10l7 5" /></Svg>
);
export const IconLayers: React.FC<P> = (p) => (
  <Svg {...p}><path d="M24 7l17 9-17 9-17-9z" /><path d="M7 24l17 9 17-9" /><path d="M7 32l17 9 17-9" /></Svg>
);
export const IconSend: React.FC<P> = (p) => (
  <Svg {...p}><path d="M42 7L6 22l14 5 5 14z" /><path d="M42 7L20 27" /></Svg>
);
export const IconCheck: React.FC<P> = (p) => (
  <Svg {...p}><path d="M10 25l9 9 19-20" /></Svg>
);
export const IconX: React.FC<P> = (p) => (
  <Svg {...p}><path d="M13 13l22 22M35 13L13 35" /></Svg>
);
export const IconShield: React.FC<P> = (p) => (
  <Svg {...p}><path d="M24 5l15 6v11c0 10-6.5 17-15 21C15.5 39 9 32 9 22V11z" /><path d="M17 24l5 5 9-10" /></Svg>
);
export const IconLock: React.FC<P> = (p) => (
  <Svg {...p}><rect x="11" y="21" width="26" height="20" rx="4" /><path d="M16 21v-6a8 8 0 0 1 16 0v6" /><path d="M24 29v5" /></Svg>
);
export const IconArchive: React.FC<P> = (p) => (
  <Svg {...p}><rect x="6" y="8" width="36" height="9" rx="2" /><path d="M9 17v20a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3V17" /><path d="M19 25h10" /></Svg>
);
export const IconPulse: React.FC<P> = (p) => (
  <Svg {...p}><path d="M4 26h9l4-10 7 20 5-14 3 4h12" /></Svg>
);
export const IconBell: React.FC<P> = (p) => (
  <Svg {...p}><path d="M14 33V22a10 10 0 0 1 20 0v11l3 4H11z" /><path d="M21 41a3.5 3.5 0 0 0 6 0" /></Svg>
);
export const IconPlay: React.FC<P> = (p) => (
  <Svg {...p}><circle cx="24" cy="24" r="18" /><path d="M20 16l12 8-12 8z" /></Svg>
);
export const IconShuffle: React.FC<P> = (p) => (
  <Svg {...p}><path d="M6 14h8c8 0 12 20 20 20h8M6 34h8c3 0 5-3 7-7M27 21c2-4 4-7 7-7h8" /><path d="M38 10l4 4-4 4M38 30l4 4-4 4" /></Svg>
);
export const IconWarn: React.FC<P> = (p) => (
  <Svg {...p}><path d="M24 6l20 35H4z" /><path d="M24 19v10M24 35v.5" /></Svg>
);
