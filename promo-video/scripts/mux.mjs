// Muxes the rendered (muted) video with the final mix -> output/tiktok-automation-promo.mp4
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
const video = 'cache/scene-renders/video-noaudio.mp4';
const audio = 'public/audio/final-mix.wav';
const out = 'output/tiktok-automation-promo.mp4';
execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-i', audio, '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log('muxed', out);
