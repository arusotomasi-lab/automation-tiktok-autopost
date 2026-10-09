// Final QA of output/tiktok-automation-promo.mp4: streams, duration, black frames, audio levels, frame sheet.
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import fs from 'node:fs';

const file = process.argv[2] || 'output/tiktok-automation-promo.mp4';
const run = (args) => spawnSync(ffmpeg, ['-hide_banner', ...args], { encoding: 'utf8', maxBuffer: 64 << 20 }).stderr;
const ok = [];
const fail = [];
const check = (name, cond, info) => (cond ? ok : fail).push(`${name}: ${info}`);

const probe = run(['-i', file]);
const v = probe.match(/Video: (\w+).*?, (\d+)x(\d+).*?, ([\d.]+) fps/);
const a = probe.match(/Audio: (\w+).*?, (\d+) Hz, (stereo|mono)/);
const d = probe.match(/Duration: (\d+):(\d+):([\d.]+)/);
const dur = d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0;
check('video', v && v[1] === 'h264', v ? v[1] : 'missing');
check('resolution', v && v[2] === '1080' && v[3] === '1920', v ? `${v[2]}x${v[3]}` : '-');
check('fps', v && Math.abs(+v[4] - 30) < 0.01, v ? v[4] : '-');
check('audio', a && a[1] === 'aac' && a[3] === 'stereo', a ? `${a[1]} ${a[2]} Hz ${a[3]}` : 'missing');
check('duration', dur >= 35 && dur <= 45, `${dur.toFixed(2)} s`);

// full decode (playability) + black frame detection + audio stats
const dec = run(['-i', file, '-vf', 'blackdetect=d=0.25:pix_th=0.06', '-af', 'astats=metadata=0:reset=0', '-f', 'null', '-']);
const errors = dec.split('\n').filter((l) => /error|corrupt|invalid/i.test(l) && !/Error while filtering/i.test(l));
check('decode', errors.length === 0, errors.length ? errors.slice(0, 3).join(' | ') : 'full decode clean');
const blacks = [...dec.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => `${m[1]}-${m[2]}`);
check('black frames', blacks.length === 0, blacks.length ? blacks.join(', ') : 'none');
const peak = [...dec.matchAll(/Peak level dB: (-?[\d.inf]+)/g)].map((m) => parseFloat(m[1]));
const overallPeak = peak.length ? peak[peak.length - 1] : NaN;
check('audio peak', overallPeak < -0.3, `${overallPeak} dBFS`);
const rms = [...dec.matchAll(/RMS level dB: (-?[\d.inf]+)/g)].map((m) => parseFloat(m[1]));
check('audio present', rms.length && rms[rms.length - 1] > -40, `${rms[rms.length - 1]} dB RMS`);

// frame sheet: one frame per scene midpoint
fs.mkdirSync('cache/stills', { recursive: true });
const times = [2, 6, 9.8, 13.8, 18.8, 22.5, 28, 32, 35, 39, 43.9];
const inputs = times.flatMap((t) => ['-ss', String(t), '-i', file]);
const n = times.length;
const layout = Array.from({ length: n }, (_, i) => `${(i % 6) * 360}_${Math.floor(i / 6) * 640}`).join('|');
const filters = times.map((_, i) => `[${i}:v]scale=360:640,setsar=1[s${i}]`).join(';') + ';' + times.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=${n}:layout=${layout}:fill=black`;
run(['-y', ...inputs, '-frames:v', '1', '-filter_complex', filters, 'cache/stills/final-sheet.jpg']);
check('frame sheet', fs.existsSync('cache/stills/final-sheet.jpg'), 'cache/stills/final-sheet.jpg');

console.log('PASS\n  ' + ok.join('\n  '));
if (fail.length) { console.log('FAIL\n  ' + fail.join('\n  ')); process.exit(1); }
