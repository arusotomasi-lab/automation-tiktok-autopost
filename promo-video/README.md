# TikTok Automation — Promo Video

Cinematic 44 s vertical promo (1080x1920, 30 fps) that explains the finished TikTok automation:
upload once → warehouse → random pick → anti-duplicate → AI caption → schedule (06:00/07:00/08:00 WIB) →
Buffer → 3 accounts → archive → stock alert on Telegram. Built fully in code; no production system is touched.

- Picture: Remotion 4 + React, CSS 3D camera rigs (`src/camera`), scenes in `src/scenes`.
- Sound: original music, sung Indonesian vocal (local Piper TTS + WORLD retune) and SFX, all synthesized in `scripts/audio`.
- Timing for picture and sound: `src/audio/song.json`. Facts vs. live system: `docs/AUDIT.md`.

```bash
npm install && npm install-scripts approve ffmpeg-static esbuild && npm rebuild ffmpeg-static
bash scripts/setup-audio-tools.sh            # local Python/Piper toolchain (gitignored .tools, .venv)
cd scripts/audio && ../../.venv/Scripts/python.exe music.py && ../../.venv/Scripts/python.exe sing.py \
  && ../../.venv/Scripts/python.exe sfx.py && ../../.venv/Scripts/python.exe mix.py && cd ../..
npm run render:video && npm run mux && npm run qa   # -> output/tiktok-automation-promo.mp4
```

Output and caches are gitignored (`output/`, `cache/`, `public/audio/*.wav`); everything is regenerable from source.
