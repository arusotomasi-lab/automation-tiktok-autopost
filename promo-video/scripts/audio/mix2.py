"""V2 mix/master. Hierarchy: male voice > music > transition SFX > detail SFX.
Music ducks smoothly (~4.5 dB) while the narrator speaks and rises back in the gaps.
Master: gentle glue compression, -14 LUFS (social), sample-peak ceiling -1.5 dBFS.
Output: public/audio/final-mix-v2.wav (48 kHz stereo 24-bit, exactly song duration).
"""
import os
import numpy as np
import soundfile as sf
from dsp import SR, CACHE, ROOT, n, read, song, lufs_approx, envelope_follow, compress, limiter, biquad

S = song()
D = S['duration']
VER = os.environ.get('AUDIO_VER', 'v2')  # v2 = Chatterbox voice, v3 = Edge TTS Ardi
V2 = os.path.join(CACHE, VER)


def load(name):
    x, sr = read(os.path.join(V2, name))
    assert sr == SR, (name, sr)
    out = np.zeros((2, n(D)))
    m = min(out.shape[1], x.shape[1])
    out[:, :m] = x[:, :m]
    return out


def active_db(x, mask):
    m = x.mean(axis=0)[mask]
    return 10 * np.log10(np.mean(m ** 2) + 1e-12)


vo = load('vo.wav')
music = load('music.wav')
trans = load('sfx_transition.wav')
det = load('sfx_detail.wav')

venv = envelope_follow(vo, attack=0.01, release=0.25)
speech = venv > np.percentile(venv[venv > 1e-6], 30) * 0.5
# level the stems relative to the voice (measured where the narrator speaks)
vo *= 10 ** ((-16.0 - active_db(vo, speech)) / 20)
music *= 10 ** ((-21.0 - active_db(music, speech)) / 20)      # pre-duck: music 5 dB under voice
trans *= 10 ** ((-25.0 - active_db(trans, np.ones(trans.shape[1], bool))) / 20)
det *= 10 ** ((-29.0 - active_db(det, np.ones(det.shape[1], bool))) / 20)

# smooth ducking curve (80 ms in, 450 ms out), depth 4.5 dB on music, 2 dB on detail SFX
duck = envelope_follow(vo, attack=0.08, release=0.45)
duck = np.clip(duck / (np.percentile(duck[duck > 1e-6], 90) + 1e-9), 0, 1)
music = biquad(music, 'peak', 2800, 0.9, -2.0) * 10 ** ((-5.0 * duck) / 20)  # also carve the presence band
det = det * 10 ** ((-3.0 * duck) / 20)
trans = trans * 10 ** ((-6.0 * duck) / 20)  # whooshes never cover the end of a word

mix = vo + music + trans + det
mix = compress(mix, thresh_db=-16, ratio=1.8, attack=0.015, release=0.2)
mix *= 10 ** ((-14.0 - lufs_approx(mix)) / 20)
mix = limiter(mix, ceiling_db=-1.5)
fo = n(0.9)
mix[:, -fo:] *= np.linspace(1, 0, fo) ** 1.6
mix[:, :n(0.01)] *= np.linspace(0, 1, n(0.01))

out = os.path.join(ROOT, 'public', 'audio', f'final-mix-{VER}.wav')
sf.write(out, mix.T.astype(np.float32), SR, subtype='PCM_24')
sf.write(os.path.join(V2, f'final-mix-{VER}.wav'), mix.T.astype(np.float32), SR, subtype='PCM_24')
sp = speech
print('mix v2 ok: %.2fs peak %.3f lufs~ %.1f clipped %d' % (mix.shape[1] / SR, np.max(np.abs(mix)), lufs_approx(mix), int(np.sum(np.abs(mix) >= 0.999))))
print('voice over music while speaking: %.1f dB' % (active_db(vo, sp) - active_db(music, sp)))
print('voice over SFX(all) while speaking: %.1f dB' % (active_db(vo, sp) - active_db(trans + det, sp)))
print('music level in gaps vs speech: %.1f dB' % (active_db(music, ~sp) - active_db(music, sp)))
