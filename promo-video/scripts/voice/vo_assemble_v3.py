"""Assembles the V3 Edge TTS (id-ID-ArdiNeural) narration into one track (runs in .venv-tts).
Lines start at their 'at' time (src/audio/voiceover_v3.json); no time-stretching (every line fits).
Light chain only (Edge output is already clean): HPF, mud cut, small presence lift, de-ess, gentle compression.
Outputs: cache/audio/v3/vo.wav, cache/voice/v3/vo_cues.json, src/audio/vo_timing.json (subtitles + final-hit cue).
"""
import json
import os
import sys
import numpy as np
import librosa
import soundfile as sf

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'audio'))
sys.path.insert(0, os.path.dirname(__file__))
from dsp import SR, ROOT, n, biquad, compress, envelope_follow  # noqa: E402
from pick_takes import trim, tighten  # noqa: E402

SRC = os.path.join(ROOT, 'cache', 'voice', 'v3', 'edge')
VO = json.load(open(os.path.join(ROOT, 'src', 'audio', 'voiceover_v3.json'), encoding='utf-8'))['lines']
DUR = json.load(open(os.path.join(ROOT, 'src', 'audio', 'song.json'), encoding='utf-8'))['duration'] + 2.0


def deess(x, f=6500, thresh_db=-30, ratio=3.0):
    band = biquad(x, 'bp', f, 0.8)
    env = envelope_follow(band, 0.002, 0.05) + 1e-9
    over = np.maximum(0, 20 * np.log10(env) - thresh_db)
    return x - band + band * 10 ** (-over * (1 - 1 / ratio) / 20)


track = np.zeros(n(DUR))
timing, cues, prev_end = [], {}, 0.0
for ln in VO:
    y, sr = librosa.load(os.path.join(SRC, f"{ln['id']}.mp3"), sr=None, mono=True)
    y = tighten(trim(y, sr), sr, max_gap=0.35)
    y = librosa.resample(y, orig_sr=sr, target_sr=SR)
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.8
    f = n(0.006)
    y[:f] *= np.linspace(0, 1, f); y[-n(0.04):] *= np.linspace(1, 0, n(0.04))
    assert ln['at'] >= prev_end - 0.02, f"overlap before {ln['id']}"
    a = n(ln['at'])
    track[a:a + len(y)] += y[: len(track) - a]
    end = ln['at'] + len(y) / SR
    prev_end = end
    timing.append({'id': ln['id'], 'start': round(ln['at'], 3), 'end': round(end, 3), 'text': ln['text']})
    if ln['id'] == '13_tag':  # "Upload sekali." | "Otomatiskan semuanya." -> final impact on the second phrase
        iv = librosa.effects.split(y, top_db=32, frame_length=1024, hop_length=128)
        gaps = [(iv[i][1], iv[i + 1][0]) for i in range(len(iv) - 1)]
        big = max(gaps, key=lambda g: g[1] - g[0]) if gaps else (0, int(len(y) * 0.4))
        cues['tag_start'] = round(ln['at'], 3)
        cues['final_hit'] = round(float(ln['at'] + big[1] / SR), 3)
    if ln['id'] == '12_final':
        cues['final_line'] = [round(ln['at'], 3), round(end, 3)]
    print(f"{ln['id']}: {ln['at']:.2f}-{end:.2f}s")

x = biquad(track, 'hp', 80, 0.7)
x = biquad(x, 'peak', 300, 1.0, -2.0)
x = biquad(x, 'peak', 3000, 0.9, 1.5)
x = deess(x)
x = compress(x, thresh_db=-20, ratio=2.0, attack=0.006, release=0.12, makeup_db=1.5)
st = np.stack([x, x])
st = st / (np.max(np.abs(st)) + 1e-9) * 0.9
os.makedirs(os.path.join(ROOT, 'cache', 'audio', 'v3'), exist_ok=True)
sf.write(os.path.join(ROOT, 'cache', 'audio', 'v3', 'vo.wav'), st.T.astype(np.float32), SR, subtype='FLOAT')
json.dump(cues, open(os.path.join(ROOT, 'cache', 'voice', 'v3', 'vo_cues.json'), 'w', encoding='utf-8'), indent=1)
json.dump({'lines': timing, 'cues': cues, 'voice': 'id-ID-ArdiNeural (Edge TTS)'},
          open(os.path.join(ROOT, 'src', 'audio', 'vo_timing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('vo v3 ok', cues)
