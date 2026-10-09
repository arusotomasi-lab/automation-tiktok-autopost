"""Assembles the picked voice-over takes into one processed track (runs in .venv-tts).
Each line starts at its 'at' time; a take longer than its window is sped up (max 12%, pitch preserved).
Voice chain: HPF, mud cut, presence, de-ess, light saturation, compression, subtle short plate.
Outputs: cache/audio/v2/vo.wav (stereo 48 kHz), cache/voice/v2/vo_cues.json, src/audio/vo_timing.json.
"""
import json
import os
import sys
import numpy as np
import librosa
import soundfile as sf

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'audio'))
sys.path.insert(0, os.path.dirname(__file__))
from vo_assemble_lib import wsola_speed  # noqa: E402
from dsp import SR, ROOT, n, biquad, compress, reverb_ir, reverb, soft_clip, envelope_follow  # noqa: E402

V2 = os.path.join(ROOT, 'cache', 'voice', 'v2')
VO = json.load(open(os.path.join(ROOT, 'src', 'audio', 'voiceover.json'), encoding='utf-8'))['lines']
DUR = json.load(open(os.path.join(ROOT, 'src', 'audio', 'song.json'), encoding='utf-8'))['duration'] + 2.0


def deess(x, f=6500, thresh_db=-30, ratio=4.0):
    band = biquad(x, 'bp', f, 0.8)
    env = envelope_follow(band, 0.002, 0.05) + 1e-9
    over = np.maximum(0, 20 * np.log10(env) - thresh_db)
    g = 10 ** (-over * (1 - 1 / ratio) / 20)
    return x - band + band * g


track = np.zeros(n(DUR))
timing, cues = [], {}
for ln in VO:
    y, sr = librosa.load(os.path.join(V2, f"vo_{ln['id']}.wav"), sr=None, mono=True)
    y = librosa.resample(y, orig_sr=sr, target_sr=SR)
    window = ln['max'] - ln['at']
    rate = len(y) / SR / window
    if rate > 1.0:
        y = wsola_speed(y, min(rate, 1.12))
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.8
    f = n(0.008)
    y[:f] *= np.linspace(0, 1, f); y[-n(0.05):] *= np.linspace(1, 0, n(0.05))
    a = n(ln['at'])
    m = min(len(y), len(track) - a)
    track[a:a + m] += y[:m]
    end = ln['at'] + len(y) / SR
    timing.append({'id': ln['id'], 'start': round(ln['at'], 3), 'end': round(end, 3), 'text': ln['text']})
    if ln['id'] == '13_tag':  # onset of the second phrase "Otomatiskan semuanya" = final impact
        iv = librosa.effects.split(y, top_db=32, frame_length=1024, hop_length=128)
        gaps = [(iv[i][1], iv[i + 1][0]) for i in range(len(iv) - 1)]
        big = max(gaps, key=lambda g: g[1] - g[0]) if gaps else (0, int(len(y) * 0.4))
        cues['tag_start'] = round(ln['at'], 3)
        cues['final_hit'] = round(float(ln['at'] + big[1] / SR), 3)
    if ln['id'] == '12_final':
        cues['final_line'] = [round(ln['at'], 3), round(end, 3)]
    print(f"{ln['id']}: {ln['at']:.2f}-{end:.2f}s (window {window:.2f}, rate {max(1, rate):.3f})")

# voice chain
x = biquad(track, 'hp', 85, 0.7)
x = biquad(x, 'peak', 280, 1.0, -2.5)
x = biquad(x, 'peak', 3200, 0.9, 1.5)
x = biquad(x, 'highshelf', 9500, 0.7, 1.5)
x = deess(x)
x = compress(x, thresh_db=-20, ratio=2.2, attack=0.006, release=0.12, makeup_db=2)
st = np.stack([x, x])
st = reverb(st, reverb_ir(0.7, 0.16, 13, 7000), 0.07)
st = st / (np.max(np.abs(st)) + 1e-9) * 0.9
os.makedirs(os.path.join(ROOT, 'cache', 'audio', 'v2'), exist_ok=True)
sf.write(os.path.join(ROOT, 'cache', 'audio', 'v2', 'vo.wav'), st.T.astype(np.float32), SR, subtype='FLOAT')
json.dump(cues, open(os.path.join(V2, 'vo_cues.json'), 'w', encoding='utf-8'), indent=1)
json.dump({'lines': timing, 'cues': cues}, open(os.path.join(ROOT, 'src', 'audio', 'vo_timing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('vo ok', cues)
