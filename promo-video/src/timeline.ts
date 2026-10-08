// Single source of timing for picture AND sound. scripts/audio reads timeline.json,
// which is generated from this file (npm run audio writes it before synthesis).
export const FPS = 30;
export const BPM = 120; // 1 beat = 15 frames, 1 bar = 60 frames
export const DURATION_S = 44;
export const DURATION = DURATION_S * FPS;

export const s = (sec: number) => Math.round(sec * FPS);

// Scene windows in seconds (start, end). Neighbouring scenes overlap by TRANSITION frames.
export const SCENES = {
  opening: [0, 4],
  warehouse: [4, 8],
  selection: [8, 11],
  duplicate: [11, 15],
  caption: [15, 20],
  schedule: [20, 24],
  publish: [24, 30],
  success: [30, 33],
  archive: [33, 36],
  stock: [36, 40],
  final: [40, 44],
} as const;

export type SceneKey = keyof typeof SCENES;
export const TRANSITION = 12;

// Lyric lines: [start s, end s, text]. Sung over the matching scene.
export const LYRICS: [number, number, string][] = [
  [0.5, 3.8, 'Tiga akun berjalan, dalam satu sistem'],
  [4.2, 7.8, 'Cukup siapkan videonya, biar semua bekerja'],
  [8.2, 10.8, 'Dipilih otomatis'],
  [11.2, 14.8, 'Tak ada posting terulang'],
  [15.2, 19.6, 'Hook dan caption tercipta, hashtag siap dipakai'],
  [20.2, 23.8, 'Jam enam, tujuh, delapan, semua terjadwal'],
  [24.4, 29.6, 'Tiga akun bergerak, tanpa upload manual'],
  [30.2, 32.8, 'Semua terkirim'],
  [33.2, 35.8, 'Yang selesai tersimpan, semua tercatat'],
  [36.2, 39.8, 'Saat stok menipis, peringatan langsung datang'],
  [40.3, 43.2, 'Upload sekali, otomatiskan semuanya'],
];

// Pipeline stages shown in the HUD; each lights up while its scene plays.
export const STAGES: { label: string; scenes: SceneKey[] }[] = [
  { label: 'INPUT', scenes: ['opening', 'warehouse'] },
  { label: 'SELECT', scenes: ['selection', 'duplicate'] },
  { label: 'CAPTION', scenes: ['caption'] },
  { label: 'SCHEDULE', scenes: ['schedule'] },
  { label: 'PUBLISH', scenes: ['publish', 'success'] },
  { label: 'ARCHIVE', scenes: ['archive'] },
  { label: 'MONITOR', scenes: ['stock'] },
];
