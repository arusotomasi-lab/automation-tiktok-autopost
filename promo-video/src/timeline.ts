// Timing shared with the audio scripts lives in src/audio/song.json (single source for picture and sound).
import song from './audio/song.json';

export const FPS = 30;
export const BPM = song.bpm; // 1 beat = 15 frames, 1 bar = 60 frames
export const DURATION_S = song.duration;
export const DURATION = DURATION_S * FPS;

export const s = (sec: number) => Math.round(sec * FPS);

// Scene windows in seconds (start, end). Neighbouring scenes overlap by TRANSITION frames.
type SceneMap = { opening: [number, number]; warehouse: [number, number]; selection: [number, number]; duplicate: [number, number]; caption: [number, number]; schedule: [number, number]; publish: [number, number]; success: [number, number]; archive: [number, number]; stock: [number, number]; final: [number, number] };
export const SCENES = song.scenes as unknown as SceneMap;

export type SceneKey = keyof typeof SCENES;
export const TRANSITION = 12;

// Lyric lines: [start s, end s, text]. Sung over the matching scene.
export const LYRICS: [number, number, string][] = song.lines.map((l) => [l.start, l.end, l.text]);

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
