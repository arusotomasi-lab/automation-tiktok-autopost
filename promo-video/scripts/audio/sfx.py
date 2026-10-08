"""Original UI / cinematic sound effects, placed at the cue times in song.json -> cache/audio/sfx.wav."""
import os
import numpy as np
from dsp import (SR, CACHE, n, sine, saw, square, noise, adsr, expdec, biquad, sweep_lp, reverb_ir, reverb, pan, place,
                 write, song)

S = song()
DUR = S['duration'] + 2.5


def whoosh(d=0.55, up=True, seed=1):
    x = noise(d, seed)
    y = sweep_lp(x, 400 if up else 6000, 6000 if up else 400, 2.0)
    t = np.arange(n(d)) / SR
    env = np.sin(np.pi * t / d) ** 1.5
    return y * env * 0.9


def click(f=2400, d=0.03):
    return (sine(f, d) * 0.6 + biquad(noise(d, 4), 'hp', 3000) * 0.4) * expdec(d, 0.006)


def blip(freqs, d=0.09, wave='sine'):
    out = np.zeros(n(d * len(freqs)))
    for i, f in enumerate(freqs):
        osc = sine(f, d) if wave == 'sine' else square(f, d) * 0.5
        out[n(i * d * 0.7): n(i * d * 0.7) + n(d)] += (osc * adsr(d, 0.003, 0.03, 0.5, 0.04))[: len(out) - n(i * d * 0.7)]
    return out


def scan(d=1.6):
    t = np.arange(n(d)) / SR
    f = 900 + 500 * np.sin(2 * np.pi * 1.25 * t)
    x = sine(f, d) * 0.25 + biquad(noise(d, 8), 'bp', 3000, 3) * 0.3
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 16 * t)
    return x * trem * adsr(d, 0.05, 0.1, 0.8, 0.3)


def data_stream(d=1.4):
    out = np.zeros(n(d))
    rng = np.random.default_rng(3)
    for k in range(40):
        at = rng.uniform(0, d - 0.03)
        b = click(rng.uniform(1800, 5200), 0.02) * rng.uniform(0.2, 0.5)
        out[n(at): n(at) + len(b)] += b[: len(out) - n(at)]
    return out


def typing(d=0.9):
    out = np.zeros(n(d))
    for k, at in enumerate(np.arange(0, d - 0.03, 0.055)):
        b = click(3000 + 400 * (k % 3), 0.018) * (0.25 + 0.1 * (k % 2))
        out[n(at): n(at) + len(b)] += b
    return out


def tick_roll(d=1.6):
    out = np.zeros(n(d))
    at, gap = 0.0, 0.04
    while at < d - 0.03:
        b = click(2000, 0.02) * 0.4
        out[n(at): n(at) + len(b)] += b
        at += gap
        gap *= 1.12
    return out


def count_ticks(d=1.6, down=False):
    out = np.zeros(n(d))
    for k, at in enumerate(np.arange(0, d, 0.05)):
        f = 1200 + (k * 25 if not down else -k * 15)
        b = click(max(500, f), 0.02) * 0.25
        out[n(at): n(at) + len(b)] += b[: len(out) - n(at)]
    return out


def success():
    return blip([880, 1318.5, 1760], 0.08) * 0.8


def confirm():
    return blip([1318.5, 1760], 0.06) * 0.6


def deny():
    d = 0.35
    x = (square(180, d) * 0.6 + square(185, d) * 0.4) * adsr(d, 0.005, 0.1, 0.6, 0.1)
    return biquad(x, 'lp', 1800) * 0.7


def warning():
    out = np.zeros(n(0.9))
    for k in range(3):
        b = (square(740, 0.14) * 0.5 + sine(1480, 0.14) * 0.3) * adsr(0.14, 0.004, 0.05, 0.7, 0.04)
        out[n(k * 0.26): n(k * 0.26) + len(b)] += biquad(b, 'lp', 3500)
    return out * 0.8


def notify():
    a = sine(1046.5, 0.18) * expdec(0.18, 0.06)
    b = sine(1568, 0.35) * expdec(0.35, 0.12)
    out = np.zeros(n(0.5))
    out[: len(a)] += a
    out[n(0.11): n(0.11) + len(b)] += b
    return out * 0.8


def pulse():
    d = 0.4
    return (sine(np.linspace(300, 900, n(d)), d) * 0.4 + biquad(noise(d, 5), 'bp', 2500, 2) * 0.2) * expdec(d, 0.1)


def pop_():
    d = 0.12
    return sine(np.linspace(500, 1200, n(d)), d) * expdec(d, 0.03) * 0.6


def shimmer(d=2.4):
    out = np.zeros(n(d))
    for k, f in enumerate([1760, 2217, 2637, 3520]):
        x = sine(f, d - k * 0.1) * adsr(d - k * 0.1, 0.4, 0.4, 0.5, 1.0) * 0.12
        out[n(k * 0.1): n(k * 0.1) + len(x)] += x
    return out


def drop_in():
    d = 0.5
    return sine(np.linspace(1400, 300, n(d)), d) * expdec(d, 0.12) * 0.35


def impact_soft():
    d = 1.2
    return sine(60, d) * expdec(d, 0.3) * 0.6


GEN = {
    'whoosh': lambda: (whoosh(0.5), 0.5), 'swoosh_arc': lambda: (whoosh(1.0, True, 4), 0.45), 'click': lambda: (click(), 0.5),
    'drop': lambda: (drop_in(), 0.6), 'count': lambda: (count_ticks(1.6), 0.45), 'count_down': lambda: (count_ticks(1.5, True), 0.5),
    'tick_roll': lambda: (tick_roll(), 0.5), 'select': lambda: (success(), 0.6), 'scan': lambda: (scan(), 0.5),
    'confirm': lambda: (confirm(), 0.45), 'deny': lambda: (deny(), 0.55), 'success': lambda: (success(), 0.5),
    'data': lambda: (data_stream(), 0.32), 'type': lambda: (typing(), 0.26), 'pop': lambda: (pop_(), 0.5),
    'tick': lambda: (tick_roll(1.2), 0.3), 'pulse': lambda: (pulse(), 0.45), 'warning': lambda: (warning(), 0.55),
    'pulse_alert': lambda: (pulse(), 0.5), 'notify': lambda: (notify(), 0.7), 'shimmer': lambda: (shimmer(), 0.6),
    # musical fx (riser/impact) live in music.py; keep these cues silent here
    'impact': lambda: (np.zeros(10), 0), 'riser': lambda: (np.zeros(10), 0), 'impact_soft': lambda: (np.zeros(10), 0),
}

buf = np.zeros((2, n(DUR)))
for i, (name, at) in enumerate(S['sfx']):
    x, g = GEN[name]()
    p = [-0.3, 0.3, 0.0][i % 3]
    place(buf, pan(x, p), at, g)
ir = reverb_ir(1.2, 0.3, 5, 9000)
buf = reverb(buf, ir, 0.18)
buf = biquad(buf, 'hp', 120, 0.7)
peak = np.max(np.abs(buf))
write(os.path.join(CACHE, 'sfx.wav'), buf / max(peak, 1e-9) * 0.9)
print('sfx ok', len(S['sfx']), 'cues, peak', round(float(peak), 3))
