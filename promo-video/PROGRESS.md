# PROGRESS — TikTok Automation Promo Video

CURRENT CHECKPOINT:
A0 — CHECKPOINT — Before Audio Overhaul (V1 preserved)

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
[✓] 12 Final MP4 rendered and verified (V1, source commit d40e83b)

AUDIO OVERHAUL (V2):
[✓] A0 Before Audio Overhaul: output/tiktok-automation-promo-v1.mp4 + cache/v1-audio/ preserved locally (gitignored); V1 source = commit d40e83b
[ ] A1 Voice script finalized (male Indonesian voice-over, replaces sung vocal)
[ ] A2 Male voice finalized
[ ] A3 Music finalized (new arrangement)
[ ] A4 SFX finalized
[ ] A5 Audio mix finalized
[ ] A6 Final render V2 -> output/tiktok-automation-promo-v2.mp4

CURRENT TASK:
Audit local male Indonesian TTS options and finalize voice-over script.

NEXT:
Optional only: owner review of the video.

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

LAST SUCCESSFUL TEST: npm run qa PASS (h264 1080x1920 30 fps, AAC 48 kHz stereo, 44.00 s, full decode clean, no black frames, audio peak -1.15 dBFS, RMS -16.8 dB)
LAST SUCCESSFUL PREVIEW: cache/stills/final-sheet.jpg from the final MP4 (all 11 scenes present, text inside safe margins, Telegram low-stock scene visible, final frame correct)
AUDIO STATUS: final-mix.wav done (regenerate: see RESUME). Stems music.wav, vocal.wav, sfx.wav generated in cache/audio (regenerable). Vocal QA: whisper.cpp small (id) on dry lead heard all lines; on full mix 10/11 lines recognisable (caption line weakest, lyric captions on screen cover it); minor: terjadwal/tercatat -> terjatuh, peringatan -> teringatan.
RENDER STATUS: re-rendered 10 Okt 2026 with brief values (08:00/12:00/18:00, 90 -> 9 VIDEOS LEFT, FILE HASH, THRESHOLD DETECTED -> TELEGRAM ALERT); 1320/1320 frames, muxed with final-mix.wav
FINAL OUTPUT: promo-video/output/tiktok-automation-promo.mp4 — 25.6 MB, 1080x1920, 30 fps, 44.00 s, H.264 + AAC 320k stereo 48 kHz (gitignored; regenerate with npm run render:video && npm run mux)

PRODUCTION SAFETY:
All MCP use was read-only. n8n/Supabase/Cloudflare/Buffer/TikTok/Railway modified: NO. Credentials modified: NO. Production workflow executed: NO.
