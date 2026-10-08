"""Small DSP toolkit for the promo soundtrack (numpy/scipy only, everything synthesized locally)."""
import json
import os
import numpy as np
from scipy import signal

SR = 48000
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(ROOT, 'cache', 'audio')
VOICE_CACHE = os.path.join(ROOT, 'cache', 'voice')
os.makedirs(CACHE, exist_ok=True)
os.makedirs(VOICE_CACHE, exist_ok=True)


def song():
    with open(os.path.join(ROOT, 'src', 'audio', 'song.json'), encoding='utf-8') as f:
        return json.load(f)


def n(sec):
    return int(round(sec * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(dur):
    return np.arange(n(dur)) / SR


# ---------- oscillators ----------
def sine(freq, dur, phase=0.0):
    t = t_axis(dur)
    if np.isscalar(freq):
        return np.sin(2 * np.pi * freq * t + phase)
    ph = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(ph + phase)


def saw(freq, dur, phase=0.0):
    """Band-limited-ish saw via polyBLEP."""
    N = n(dur)
    f = np.full(N, freq) if np.isscalar(freq) else freq[:N]
    dt = f / SR
    ph = (phase + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    # polyBLEP correction
    m1 = ph < dt
    x = ph[m1] / dt[m1]
    y[m1] -= x + x - x * x - 1
    m2 = ph > 1 - dt
    x = (ph[m2] - 1) / dt[m2]
    y[m2] -= x * x + x + x + 1
    return y


def square(freq, dur, phase=0.0):
    return 0.5 * (saw(freq, dur, phase) - saw(freq, dur, (phase + 0.5) % 1.0))


def noise(dur, seed=0):
    return np.random.default_rng(seed).uniform(-1, 1, n(dur))


# ---------- envelopes ----------
def adsr(dur, a=0.01, d=0.1, s=0.7, r=0.2, hold=None):
    N = n(dur)
    env = np.zeros(N)
    hold = dur - r if hold is None else hold
    ta = np.arange(N) / SR
    env = np.where(ta < a, ta / max(a, 1e-6), 1.0)
    dec = (ta >= a) & (ta < a + d)
    env[dec] = 1 - (1 - s) * (ta[dec] - a) / max(d, 1e-6)
    sus = (ta >= a + d) & (ta < hold)
    env[sus] = s
    rel = ta >= hold
    env[rel] = s * np.maximum(0, 1 - (ta[rel] - hold) / max(r, 1e-6))
    return env


def expdec(dur, tau):
    return np.exp(-t_axis(dur) / tau)


# ---------- filters ----------
def biquad(x, kind, f0, q=0.707, gain_db=0.0):
    w0 = 2 * np.pi * min(f0, SR * 0.45) / SR
    alpha = np.sin(w0) / (2 * q)
    cw = np.cos(w0)
    A = 10 ** (gain_db / 40)
    if kind == 'lp':
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]; a = [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == 'hp':
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]; a = [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == 'bp':
        b = [alpha, 0, -alpha]; a = [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == 'peak':
        b = [1 + alpha * A, -2 * cw, 1 - alpha * A]; a = [1 + alpha / A, -2 * cw, 1 - alpha / A]
    elif kind == 'lowshelf':
        sq = 2 * np.sqrt(A) * alpha
        b = [A * ((A + 1) - (A - 1) * cw + sq), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - sq)]
        a = [(A + 1) + (A - 1) * cw + sq, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - sq]
    elif kind == 'highshelf':
        sq = 2 * np.sqrt(A) * alpha
        b = [A * ((A + 1) + (A - 1) * cw + sq), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - sq)]
        a = [(A + 1) - (A - 1) * cw + sq, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - sq]
    else:
        raise ValueError(kind)
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=-1)


def sweep_lp(x, f_start, f_end, q=0.9, block=256):
    """Time-varying low-pass (exponential cutoff sweep), processed in blocks with carried state."""
    N = x.shape[-1]
    out = np.zeros_like(x)
    nb = (N + block - 1) // block
    zi = None
    for i in range(nb):
        a0, a1 = i * block, min(N, (i + 1) * block)
        fr = f_start * (f_end / f_start) ** (i / max(1, nb - 1))
        w0 = 2 * np.pi * min(fr, SR * 0.45) / SR
        alpha = np.sin(w0) / (2 * q); cw = np.cos(w0)
        b = np.array([(1 - cw) / 2, 1 - cw, (1 - cw) / 2]) / (1 + alpha)
        a = np.array([1 + alpha, -2 * cw, 1 - alpha]) / (1 + alpha)
        if zi is None:
            zi = signal.lfilter_zi(b, a) * x[..., a0:a0 + 1] if x.ndim == 1 else np.zeros((x.shape[0], 2))
        if x.ndim == 1:
            out[a0:a1], zi = signal.lfilter(b, a, x[a0:a1], zi=zi)
        else:
            for c in range(x.shape[0]):
                out[c, a0:a1], zi[c] = signal.lfilter(b, a, x[c, a0:a1], zi=zi[c])
    return out


# ---------- space ----------
def reverb_ir(dur=2.0, decay=0.45, seed=7, bright=6000):
    rng = np.random.default_rng(seed)
    N = n(dur)
    t = np.arange(N) / SR
    env = np.exp(-t / decay)
    ir = np.stack([rng.standard_normal(N), rng.standard_normal(N)]) * env
    ir = biquad(ir, 'lp', bright)
    ir[:, : n(0.012)] *= np.linspace(0, 1, n(0.012))  # pre-delay softness
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, ir, wet=0.25):
    """x: (2, N) stereo."""
    if x.ndim == 1:
        x = np.stack([x, x])
    y = np.stack([signal.fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])
    return x * (1 - wet) + y * wet


def pingpong(x, delay_s, fb=0.35, mix=0.25, repeats=6):
    if x.ndim == 1:
        x = np.stack([x, x])
    out = x.copy()
    d = n(delay_s)
    src = x.mean(axis=0)
    for k in range(1, repeats + 1):
        g = mix * fb ** (k - 1)
        ch = k % 2
        if d * k >= x.shape[1]:
            break
        out[ch, d * k:] += g * src[: -d * k]
    return out


def pan(x, p):
    """p in [-1, 1], constant power."""
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


# ---------- dynamics ----------
def envelope_follow(x, attack=0.005, release=0.12):
    mono = np.abs(x if x.ndim == 1 else x.mean(axis=0))
    ga, gr = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    env = np.zeros_like(mono)
    e = 0.0
    # vectorised enough for 2M samples with a simple loop in chunks via scipy is tricky; use decimated follower
    dec = 48
    m = mono[: len(mono) // dec * dec].reshape(-1, dec).max(axis=1)
    out = np.zeros_like(m)
    ga, gr = np.exp(-dec / (attack * SR)), np.exp(-dec / (release * SR))
    for i, v in enumerate(m):
        e = ga * e + (1 - ga) * v if v > e else gr * e + (1 - gr) * v
        out[i] = e
    env[: len(out) * dec] = np.repeat(out, dec)
    env[len(out) * dec:] = out[-1] if len(out) else 0
    return env


def compress(x, thresh_db=-18, ratio=3.0, attack=0.004, release=0.1, makeup_db=0.0):
    env = envelope_follow(x, attack, release) + 1e-9
    lvl = 20 * np.log10(env)
    over = np.maximum(0, lvl - thresh_db)
    gain_db = -over * (1 - 1 / ratio) + makeup_db
    g = 10 ** (gain_db / 20)
    return x * g


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def limiter(x, ceiling_db=-1.0, lookahead=0.005, release=0.08):
    ceiling = 10 ** (ceiling_db / 20)
    peak = np.max(np.abs(x), axis=0)
    la = n(lookahead)
    # running max over lookahead window
    from scipy.ndimage import maximum_filter1d
    pk = maximum_filter1d(peak, size=2 * la + 1)
    need = np.minimum(1.0, ceiling / np.maximum(pk, 1e-9))
    # smooth gain (fast attack already handled by lookahead max, release smoothing)
    g = np.copy(need)
    gr = np.exp(-1 / (release * SR))
    dec = 16
    m = need[: len(need) // dec * dec].reshape(-1, dec).min(axis=1)
    out = np.zeros_like(m)
    e = 1.0
    grd = np.exp(-dec / (release * SR))
    for i, v in enumerate(m):
        e = v if v < e else grd * e + (1 - grd) * v
        out[i] = e
    g[: len(out) * dec] = np.repeat(out, dec)
    y = x * g
    return np.clip(y, -ceiling, ceiling)


def place(buf, x, at_s, gain=1.0):
    """Add mono/stereo x into stereo buf at time at_s."""
    if x.ndim == 1:
        x = np.stack([x, x])
    a = n(at_s)
    if a >= buf.shape[1]:
        return
    if a < 0:
        x = x[:, -a:]; a = 0
    m = min(x.shape[1], buf.shape[1] - a)
    buf[:, a:a + m] += gain * x[:, :m]


def write(path, x, sr=SR):
    import soundfile as sf
    sf.write(path, (x.T if x.ndim == 2 else x).astype(np.float32), sr, subtype='FLOAT')


def read(path):
    import soundfile as sf
    x, sr = sf.read(path, always_2d=True)
    return x.T.astype(np.float64), sr


def lufs_approx(x):
    """Rough integrated loudness (K-weighting approximation, no gating)."""
    y = biquad(x, 'highshelf', 1500, 0.707, 4.0)
    y = biquad(y, 'hp', 38, 0.5)
    ms = np.mean(y ** 2)
    return -0.691 + 10 * np.log10(ms + 1e-12) + (3.01 if x.ndim == 2 else 0)
