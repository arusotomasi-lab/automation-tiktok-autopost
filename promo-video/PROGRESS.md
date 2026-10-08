# PROGRESS — TikTok Automation Promo Video

CURRENT CHECKPOINT:
11 — Pre-render validation complete

COMPLETED:
[✓] 01 Repository audit (docs/AUDIT.md)
[✓] 02 Promo project initialized (Remotion 4.0.534, React 19, TypeScript)
[✓] 03 Base composition and visual system (Stage3D camera, Background, HUD, lyrics overlay, UI kit)
[✓] 04 Scenes 01–03
[✓] 05 Scenes 04–07
[✓] 06 Scenes 08–11
[✓] 07 Camera and motion system (per-scene Stage3D camera rigs, push-through transitions, HUD rail)
[✓] 08 Original music (scripts/audio/music.py, procedural 120 BPM A minor, section dynamics)
[✓] 09 Indonesian vocal / song (sung: Piper TTS + WORLD retune, double + harmony; Whisper QA transcribes ~all lines correctly)
[✓] 10 Audio mix (public/audio/final-mix.wav: 48 kHz stereo 24-bit, 44.00 s, ~-14 LUFS, peak -1 dBFS, vocal +6.5 dB over music, 0 clipped samples)
[✓] 11 Pre-render validation (tsc OK; stills incl. transitions + last frame OK; audio 44.00 s matches 1320 frames)
[ ] 12 Final MP4 rendered and verified

CURRENT TASK:
Render: npm run render:video (muted, -> cache/scene-renders/video-noaudio.mp4), then npm run mux -> output/tiktok-automation-promo.mp4, then npm run qa.

NEXT:
Vocal (Piper TTS id_ID + WORLD pitch retune) → SFX → mix → render → QA.

KNOWN ISSUES:
- Komputer lokal tidak bisa membuka r2.dev (tidak dibutuhkan untuk video).
- Tidak ada Python/FFmpeg sistem: Python portabel via uv di `.tools/` + `.venv/` (gitignored), FFmpeg dari ffmpeg-static.
- Timing tunggal untuk gambar dan suara: src/audio/song.json.

DEPENDENCIES INSTALLED:
whisper.cpp 1.5.5 + ggml-small (QA only) in .tools/whisper via node scripts/whisper-setup.mjs.
Python (portable, gitignored): .tools/uv/uv.exe 0.9.5, Python 3.11 in .tools/python, .venv with numpy 2.2.6, scipy 1.15.3, soundfile 0.13.1, pyworld 0.3.5.
Piper TTS 2023.11.14-2 in .tools/piper, voice .tools/voices/id_ID-news_tts-medium.onnx (HF rhasspy/piper-voices main).
npm: remotion/@remotion/cli/renderer/google-fonts 4.0.534, react 19.2.0, typescript, ffmpeg-static 5.2.0 (approved install script). Chrome Headless Shell (auto-downloaded by Remotion).

RESUME COMMANDS:
cd promo-video && npm install && npm install-scripts approve ffmpeg-static esbuild && npm rebuild ffmpeg-static
npm run check                      # typecheck
node scripts/stills.mjs 100 400    # preview stills -> cache/stills
npm run preview                    # Remotion Studio
bash scripts/setup-audio-tools.sh  # re-download uv/Python/Piper/voice if .tools is missing
cd scripts/audio && ../../.venv/Scripts/python.exe music.py && ../../.venv/Scripts/python.exe sing.py && ../../.venv/Scripts/python.exe sfx.py && ../../.venv/Scripts/python.exe mix.py

LAST SUCCESSFUL TEST: npm run check (tsc) OK
LAST SUCCESSFUL PREVIEW: stills frames 60–1315 (all 11 scenes) rendered OK
AUDIO STATUS: final-mix.wav done (regenerate: see RESUME). Stems music.wav, vocal.wav, sfx.wav generated in cache/audio (regenerable). Vocal QA: whisper.cpp small (id) on dry lead heard all lines; on full mix 10/11 lines recognisable (caption line weakest, lyric captions on screen cover it); minor: terjadwal/tercatat -> terjatuh, peringatan -> teringatan.
RENDER STATUS: starting full render (1320 frames)
FINAL OUTPUT: not created

PRODUCTION SAFETY:
All MCP use is read-only. No production change.
