"""Final mix: vocal on top, music ducked under the vocal, SFX balanced, bus compression + limiter.
Output: public/audio/final-mix.wav (48 kHz stereo, 24-bit, exactly song duration) + cache copy.
"""
import os
import numpy as np
import soundfile as sf
from dsp import SR, CACHE, ROOT, n, read, song, lufs_approx, envelope_follow, compress, limiter, biquad

S = song()
D = S['duration']


def load(name):
    x, sr = read(os.path.join(CACHE, name))
    assert sr == SR, (name, sr)
    out = np.zeros((2, n(D)))
    m = min(out.shape[1], x.shape[1])
    out[:, :m] = x[:, :m]
    return out


def to_lufs(x, target):
    return x * 10 ** ((target - lufs_approx(x)) / 20)


music = load('music.wav')
vocal = load('vocal.wav')
sfx = load('sfx.wav')

vocal = to_lufs(vocal, -16.5)
music = to_lufs(music, -20.0)
sfx = to_lufs(sfx, -25.0)

# ducking: music dips ~5 dB while the vocal sings (smooth attack/release)
venv = envelope_follow(vocal, attack=0.04, release=0.35)
venv = venv / (np.percentile(venv[venv > 1e-6], 95) + 1e-9)
duck_db = -5.0 * np.clip(venv, 0, 1)
# carve a little room in the music's vocal band as well (static presence dip)
music_v = biquad(music, 'peak', 2500, 0.8, -2.5)
music = music_v * 10 ** (duck_db / 20)

mixbus = vocal + music + sfx
mixbus = compress(mixbus, thresh_db=-14, ratio=2.0, attack=0.01, release=0.15)
mixbus = to_lufs(mixbus, -14.0)
mixbus = limiter(mixbus, ceiling_db=-1.0)

# fades
fi, fo = n(0.01), n(0.7)
mixbus[:, :fi] *= np.linspace(0, 1, fi)
mixbus[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5

out_public = os.path.join(ROOT, 'public', 'audio', 'final-mix.wav')
os.makedirs(os.path.dirname(out_public), exist_ok=True)
sf.write(out_public, mixbus.T.astype(np.float32), SR, subtype='PCM_24')
sf.write(os.path.join(CACHE, 'final-mix.wav'), mixbus.T.astype(np.float32), SR, subtype='PCM_24')

# report: vocal-to-music ratio where the vocal sings
active = venv > 0.25
def db(x, mask):
    return 10 * np.log10(np.mean(x.mean(axis=0)[mask] ** 2) + 1e-12)
print('mix ok: %.2fs, peak %.3f, lufs~ %.1f' % (mixbus.shape[1] / SR, np.max(np.abs(mixbus)), lufs_approx(mixbus)))
print('vocal over music (sung parts): %.1f dB' % (db(vocal, active) - db(music, active)))
print('sfx over music (overall): %.1f dB' % (db(sfx, np.ones(sfx.shape[1], bool)) - db(music, np.ones(sfx.shape[1], bool))))
print('clipped samples:', int(np.sum(np.abs(mixbus) >= 0.999)))
