"""Pitch accuracy of each sung line vs its melody (median absolute error in cents on voiced frames)."""
import os, numpy as np, pyworld as pw
from scipy import signal
from dsp import read, song, VOICE_CACHE, mtof
S = song()
for i, line in enumerate(S['lines']):
    x, sr = read(os.path.join(VOICE_CACHE, f'line_{i:02d}.wav'))
    x = signal.resample_poly(x[0], 147, 320)
    f0, t = pw.harvest(x.astype(np.float64), 22050, f0_floor=70, f0_ceil=700, frame_period=5)
    v = f0[f0 > 0]
    notes = sorted(set(m for m, _ in line['notes']))
    # distance of each voiced frame to the nearest melody note
    cents = np.min(np.abs(1200 * np.log2(v[:, None] / mtof(np.array(notes))[None, :])), axis=1)
    print(f'{i:2d} voiced {len(v)/len(f0)*100:3.0f}%  median err {np.median(cents):5.1f}c  p90 {np.percentile(cents,90):5.1f}c  range {v.min():.0f}-{v.max():.0f}Hz  {line["text"]}')
