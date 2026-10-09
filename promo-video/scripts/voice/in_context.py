"""Re-picks one voice line by judging every take INSIDE the mix (voice over the ducked music at that moment),
so a word that is clear solo but masked by the music (e.g. final /k/ in "acak") is caught.
Usage: in_context.py <line_id>   -> overwrites cache/voice/v2/vo_<id>.wav with the best in-context take.
"""
import glob
import json
import os
import sys
import numpy as np
import librosa
import soundfile as sf
import jiwer

sys.path.insert(0, os.path.dirname(__file__))
from voice_eval import transcribe, norm, mos, ROOT  # noqa: E402
from pick_takes import trim, tighten  # noqa: E402
from vo_assemble_lib import wsola_speed  # noqa: E402

lid = sys.argv[1]
ln = next(l for l in json.load(open(os.path.join(ROOT, 'src', 'audio', 'voiceover.json'), encoding='utf-8'))['lines'] if l['id'] == lid)
SR = 48000
music, _ = librosa.load(os.path.join(ROOT, 'cache', 'audio', 'v2', 'music.wav'), sr=SR, mono=True)
seg = music[int(ln['at'] * SR): int(ln['max'] * SR) + SR // 2]
seg = seg / (np.sqrt(np.mean(seg ** 2)) + 1e-9) * 10 ** (-25.5 / 20)  # music level under the voice in the mix (~-9 dB)
tmp = os.path.join(ROOT, 'cache', 'voice', 'v2', f'ctx_{lid}.wav')
best = None
for path in sorted(p for p in glob.glob(os.path.join(ROOT, 'cache', 'voice', 'v2', 'takes', f'{lid}_v*_t*.wav')) if '.trim' not in p):
    y, sr = librosa.load(path, sr=None, mono=True)
    y = tighten(trim(y, sr), sr)
    y48 = librosa.resample(y, orig_sr=sr, target_sr=SR)
    rate = len(y48) / SR / (ln['max'] - ln['at'])
    if rate > 1:
        y48 = wsola_speed(y48, min(rate, 1.12))
    y48 = y48 / (np.sqrt(np.mean(y48 ** 2)) + 1e-9) * 10 ** (-16.5 / 20)
    mix = seg[: len(y48)].copy()
    mix[: len(y48)] += y48
    sf.write(tmp, mix, SR)
    heard = transcribe(tmp, 'id')
    cer = jiwer.cer(norm(ln['text']).replace(' ', ''), norm(heard).replace(' ', ''))
    m = mos(y, sr)
    score = m - 8 * cer - (5 if rate > 1.12 else 0)
    print(os.path.basename(path), 'rate %.3f' % rate, 'cer %.3f' % cer, 'mos %.2f' % m, '|', heard, flush=True)
    if best is None or score > best[0]:
        best = (score, path, heard, cer)
print('BEST', os.path.basename(best[1]), best[2], 'cer', round(best[3], 3))
y, sr = librosa.load(best[1], sr=None, mono=True)
sf.write(os.path.join(ROOT, 'cache', 'voice', 'v2', f'vo_{lid}.wav'), tighten(trim(y, sr), sr), sr)
