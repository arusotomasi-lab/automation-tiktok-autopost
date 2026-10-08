"""Objective checks for a stereo wav: peak, rough loudness, per-second RMS dB and spectral balance."""
import sys, numpy as np
from dsp import read, lufs_approx, biquad, SR
x, sr = read(sys.argv[1])
print(sys.argv[1], 'sr', sr, 'dur %.2f' % (x.shape[1] / sr), 'peak %.3f' % np.max(np.abs(x)), 'lufs~ %.1f' % lufs_approx(x))
m = x.mean(axis=0)
sec = [20 * np.log10(np.sqrt(np.mean(m[i * sr:(i + 1) * sr] ** 2)) + 1e-9) for i in range(int(len(m) / sr))]
print('rms/s:', ' '.join('%d:%.0f' % (i, v) for i, v in enumerate(sec)))
bands = [(20, 120), (120, 500), (500, 2000), (2000, 6000), (6000, 16000)]
spec = np.abs(np.fft.rfft(m)) ** 2; fr = np.fft.rfftfreq(len(m), 1 / sr)
tot = spec.sum()
print('bands:', ' '.join('%d-%d:%.0f%%' % (a, b, 100 * spec[(fr >= a) & (fr < b)].sum() / tot) for a, b in bands))
if x.shape[0] == 2:
    s = x[0] - x[1]; mm = x[0] + x[1]
    print('stereo width (side/mid rms) %.2f' % (np.sqrt(np.mean(s ** 2)) / (np.sqrt(np.mean(mm ** 2)) + 1e-9)))
