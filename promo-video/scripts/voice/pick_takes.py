"""Take selection for the V2 voice-over (runs in .venv-tts).
  pick_takes.py prep  -> cache/voice/v2/lines_flat.json (one item per say-variant, for cb_tts.py lines)
  pick_takes.py pick  -> scores every take, picks the best per line -> cache/voice/v2/picked.json + vo_<id>.wav (trimmed)
Score = predicted MOS (naturalness) - 3*WER (intelligibility) - penalty if the take cannot fit its time window.
"""
import glob
import json
import os
import sys
import numpy as np
import librosa
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
from voice_eval import analyze, ROOT  # noqa: E402

V2 = os.path.join(ROOT, 'cache', 'voice', 'v2')
TAKES = os.path.join(V2, 'takes')
VO = json.load(open(os.path.join(ROOT, 'src', 'audio', 'voiceover.json'), encoding='utf-8'))['lines']
MAX_STRETCH = 1.12  # we may speed a take up by at most 12% (pitch-preserving) to fit its window


def trim(y, sr, db=38):
    yt, idx = librosa.effects.trim(y, top_db=db, frame_length=1024, hop_length=128)
    a = max(0, idx[0] - int(0.03 * sr))
    b = min(len(y), idx[1] + int(0.12 * sr))
    return y[a:b]


def tighten(y, sr, max_gap=0.26, db=36):
    """Shortens long internal pauses (TTS tends to over-pause) while keeping natural phrasing."""
    iv = librosa.effects.split(y, top_db=db, frame_length=1024, hop_length=128)
    if len(iv) < 2:
        return y
    out, fade = [], int(0.012 * sr)
    for i, (a, b) in enumerate(iv):
        seg = y[a:b].copy()
        if i + 1 < len(iv):
            gap = iv[i + 1][0] - b
            seg = np.concatenate([seg, y[b:b + min(gap, int(max_gap * sr))]])
        out.append(seg)
    return np.concatenate(out)


def prep():
    flat = []
    for ln in VO:
        for k, say in enumerate(ln['say']):
            flat.append({'id': f"{ln['id']}_v{k}", 'say': say, 'ex': ln.get('ex', 0.5), 'cfg': ln.get('cfg', 0.5), 'temp': ln.get('temp', 0.75)})
    json.dump(flat, open(os.path.join(V2, 'lines_flat.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(flat), 'variants')


def pick():
    report = {}
    for ln in VO:
        window = ln['max'] - ln['at']
        best = None
        for path in sorted(p for p in glob.glob(os.path.join(TAKES, f"{ln['id']}_v*_t*.wav")) if '.trim' not in p):
            y, sr = librosa.load(path, sr=None, mono=True)
            y = tighten(trim(y, sr), sr)
            tmp = path.replace('.wav', '.trim.wav')
            sf.write(tmp, y, sr)
            r = analyze(tmp, 'id', ln['text'])
            dur = len(y) / sr
            need = dur / window
            fit_pen = 0 if need <= 1 else (2.0 * (need - 1) if need <= MAX_STRETCH else 5)
            male_pen = 0 if 80 <= r['f0_med'] <= 150 else 1
            score = r['mos'] - 6 * r['cer'] - fit_pen - male_pen
            r.update({'take': os.path.basename(path), 'trim_dur': round(dur, 2), 'window': round(window, 2), 'score': round(score, 3)})
            print(r, flush=True)
            if best is None or score > best['score']:
                best = r
        report[ln['id']] = best
        y, sr = librosa.load(os.path.join(TAKES, best['take']), sr=None, mono=True)
        sf.write(os.path.join(V2, f"vo_{ln['id']}.wav"), tighten(trim(y, sr), sr), sr)
        print('PICK', ln['id'], best['take'], best['score'], best['heard'], flush=True)
    json.dump(report, open(os.path.join(V2, 'picked.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    {'prep': prep, 'pick': pick}[sys.argv[1]]()
