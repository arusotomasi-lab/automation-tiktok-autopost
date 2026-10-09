# PROGRESS — TikTok Automation Promo Video

CURRENT CHECKPOINT:
A6 — V2 COMPLETE (rendered and verified)

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
[✓] A1 Voice script finalized: src/audio/voiceover.json (13 lines, natural Indonesian, male VO replaces the sung vocal; final scene extended to 46 s for the tagline)
[✓] A2 Male voice finalized: Chatterbox-TTS-Indonesian + designed male timbre (ref_male_2, f0 ~100-110 Hz). 13 lines, best of 4-6 takes by UTMOS + whisper-turbo CER (all CER 0, raw MOS 4.24-4.46, processed 3.9-4.3). WSOLA speed-up <=12% (phase vocoder rejected: MOS 1.4). Timing -> src/audio/vo_timing.json; video 47.5 s.
[✓] A3 Music finalized: scripts/audio/music2.py (120 BPM A minor; intro ambience+pulse, beat at warehouse, scanner rhythm, AI arp+motif, drop at publishing, POSTED lift, pull-back at low stock, final braam on "Otomatiskan semuanya"; chord check 19/21; spectrum 59/15/17/7%)
[✓] A4 SFX finalized: scripts/audio/sfx2.py (transition bus + detail bus, cues per animation)
[✓] A5 Audio mix finalized: public/audio/final-mix-v2.wav (47.5 s, -14.2 LUFS, peak -1.5 dBFS, 0 clipped; voice +8.8 dB over ducked music, music +4.1 dB in gaps; whisper-turbo on full mix CER 0.5%)
[✓] A6 Final render V2: output/tiktok-automation-promo-v2.mp4 — 1080x1920, 30 fps, 47.50 s, H.264 + AAC LC 48 kHz stereo (streams verified), full decode clean, no black frames, peak -1.36 dBFS. Audio decoded from the MP4 re-transcribed by whisper-turbo (CER 0.2%). "secara acak": text was already correct everywhere; the final /k/ was masked by a snare fill + whoosh at 10.5-11 s -> fill removed, whoosh moved to 11.12 s; now heard as "acak". V1 kept at output/tiktok-automation-promo-v1.mp4.

CURRENT TASK:
None. V2 COMPLETE.

NEXT:
Optional only: owner review of the video.

KNOWN ISSUES:
- Voice audit (3 test lines, UTMOS predicted MOS / whisper WER): Qwen3 Indonesian fine-tune 2.4-2.7 / 0.22-0.33 (rejected), Qwen3 Base clone 4.5 / 0.12-0.25 (English accent, rejected), Windows Andika 2.8-3.3 / 0-0.13 (robotic, rejected), Chatterbox-Indonesian + designed male ref 4.1-4.4 / 0-0.25 (chosen, best-take selection).
- GPU venvs (gitignored): .venv-tts (torch 2.6 cu124, qwen-tts 0.1.1, librosa, jiwer), .venv-cb (chatterbox-tts 0.1.4 --no-deps, transformers 4.46.3, setuptools<80). Models cached in .hf/.
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
RENDER STATUS: V2 rendered 10 Okt 2026 (1425 frames) -> cache/scene-renders/video-noaudio-v2.mp4, muxed with public/audio/final-mix-v2.wav (npm run render:video && node scripts/mux.mjs && node scripts/qa.mjs output/tiktok-automation-promo-v2.mp4)
FINAL OUTPUT: V2 promo-video/output/tiktok-automation-promo-v2.mp4 (47.5 s, 1080x1920, 30 fps, AAC 48 kHz stereo); V1 promo-video/output/tiktok-automation-promo-v1.mp4 (both gitignored, regenerable)

PRODUCTION SAFETY:
All MCP use was read-only. n8n/Supabase/Cloudflare/Buffer/TikTok/Railway modified: NO. Credentials modified: NO. Production workflow executed: NO.
