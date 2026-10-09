// Muxes the rendered (muted) video with the final mix -> output/tiktok-automation-promo.mp4
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
// Usage: node scripts/mux.mjs [video] [audio] [out]  (defaults = V2)
const video = process.argv[2] || 'cache/scene-renders/video-noaudio-v2.mp4';
const audio = process.argv[3] || 'public/audio/final-mix-v2.wav';
const out = process.argv[4] || 'output/tiktok-automation-promo-v2.mp4';
execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-i', audio, '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log('muxed', out);
