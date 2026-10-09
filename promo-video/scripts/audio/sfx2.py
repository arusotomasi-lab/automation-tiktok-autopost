"""V2 sound design: synchronized, refined SFX (all synthesized). Cue times follow the scene animations
(frame math in src/scenes/*). Final-scene cues follow the voice-over timing (cache/voice/v2/vo_cues.json).
Output: cache/audio/v2/sfx_transition.wav and sfx_detail.wav (two buses for the mix hierarchy).
"""
import json
import os
import numpy as np
from dsp import SR, CACHE, ROOT, n, sine, noise, adsr, expdec, biquad, reverb_ir, reverb, pan, place, write, song

OUT = os.path.join(CACHE, 'v2')
S = song()
DUR = S['duration'] + 2.0
cues = {}
cp = os.path.join(ROOT, 'cache', 'voice', 'v2', 'vo_cues.json')
if os.path.exists(cp):
    cues = json.load(open(cp, encoding='utf-8'))
TAG = float(cues.get('tag_start', 44.7))


def fm(fc, ratio, index, d, idx_tau=0.08, amp_tau=0.4):
    t = np.arange(n(d)) / SR
    mod = np.sin(2 * np.pi * fc * ratio * t) * index * np.exp(-t / idx_tau)
    return np.sin(2 * np.pi * fc * t + mod) * np.exp(-t / amp_tau) * np.minimum(1, t / 0.002)


def whoosh(d=0.7, f0=500, f1=3500, seed=1, pan_from=-0.6, pan_to=0.6):
    x = noise(d, seed)
    p = np.arange(n(d)) / n(d)
    env = np.sin(np.pi * p) ** 1.8
    cen = f0 * (f1 / f0) ** np.sin(np.pi * p * 0.5)
    y = np.zeros(n(d))
    blk = 256
    from scipy import signal
    zi = np.zeros(2)
    for i in range(0, n(d), blk):
        w0 = 2 * np.pi * cen[i] / SR
        al = np.sin(w0) / (2 * 1.2); cw = np.cos(w0)
        b = np.array([al, 0, -al]) / (1 + al); a = np.array([1 + al, -2 * cw, 1 - al]) / (1 + al)
        y[i:i + blk], zi = signal.lfilter(b, a, x[i:i + blk], zi=zi)
    y *= env
    pp = pan_from + (pan_to - pan_from) * p
    ang = (pp + 1) * np.pi / 4
    return np.stack([y * np.cos(ang), y * np.sin(ang)]) * 1.6


def swipe(d=0.28, seed=2, l2r=True):
    return whoosh(d, 1500, 6500, seed, -0.4 if l2r else 0.4, 0.4 if l2r else -0.4) * 0.8


def tick(f=3200, d=0.03):
    return (sine(f, d) + 0.35 * sine(f * 2.01, d)) * expdec(d, 0.005)


def confirm(f=1568):
    a = fm(f, 2.0, 1.2, 0.5, 0.05, 0.18)
    b = fm(f * 1.335, 2.0, 1.0, 0.6, 0.05, 0.25)
    out = np.zeros(n(0.7)); out[: len(a)] += a; out[n(0.07): n(0.07) + len(b)] += b
    return out * 0.6


def posted():
    thump = sine(95 + 60 * expdec(0.4, 0.03), 0.4) * expdec(0.4, 0.08)
    bell = fm(1046.5, 3.0, 1.5, 1.2, 0.06, 0.45) + 0.7 * fm(1318.5, 3.0, 1.2, 1.2, 0.06, 0.45) + 0.5 * fm(1568, 3.0, 1.0, 1.2, 0.06, 0.4)
    out = np.zeros(n(1.2)); out[: len(thump)] += thump * 0.9; out += bell * 0.35
    return out


def energy(d=0.45, f0=180, f1=1400):
    p = np.arange(n(d)) / n(d)
    f = f0 * (f1 / f0) ** p
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) * 0.5 + 0.2 * np.sin(2 * ph)
    nz = biquad(noise(d, 4), 'bp', 2500, 1.5) * 0.35
    return (tone + nz) * np.sin(np.pi * p) ** 1.2 * 0.8


def scan(d=1.6):
    t = np.arange(n(d)) / SR
    f = 1100 + 500 * np.sin(2 * np.pi * 1.25 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * 0.18 + biquad(noise(d, 8), 'bp', 4200, 4) * 0.25
    return x * (0.55 + 0.45 * np.sin(2 * np.pi * 18 * t)) * adsr(d, 0.06, 0.1, 0.85, 0.25)


def blocked():
    d = 0.38
    x = sum(np.sign(np.sin(2 * np.pi * f * np.arange(n(d)) / SR)) for f in (110, 116.5)) * 0.25
    return biquad(x, 'lp', 1400) * adsr(d, 0.004, 0.08, 0.6, 0.12)


def data_texture(d=2.2, seed=3):
    out = np.zeros(n(d))
    r = np.random.default_rng(seed)
    for _ in range(70):
        at = r.uniform(0, d - 0.03)
        b = tick(r.uniform(2400, 6200), 0.018) * r.uniform(0.08, 0.3)
        out[n(at): n(at) + len(b)] += b[: len(out) - n(at)]
    return out * np.sin(np.pi * np.arange(n(d)) / n(d)) ** 0.6


def typing(d=0.8, seed=0):
    out = np.zeros(n(d))
    for k, at in enumerate(np.arange(0, d - 0.03, 0.06)):
        b = tick(2600 + 350 * ((k + seed) % 3), 0.016) * (0.25 + 0.08 * (k % 2))
        out[n(at): n(at) + len(b)] += b
    return out


def count_ticks(d, up=True):
    out = np.zeros(n(d))
    for k, at in enumerate(np.arange(0, d, 0.055)):
        f = 1600 + (k * 18 if up else -k * 12)
        b = tick(max(700, f), 0.02) * 0.3
        out[n(at): n(at) + len(b)] += b[: len(out) - n(at)]
    return out


def spin_ticks(d=1.6):
    out = np.zeros(n(d)); at, gap = 0.0, 0.035
    while at < d - 0.03:
        b = tick(2100, 0.02) * 0.35
        out[n(at): n(at) + len(b)] += b
        at += gap; gap *= 1.11
    return out


def land():
    d = 0.3
    out = sine(90, d) * expdec(d, 0.06) * 0.9
    c = tick(1800, 0.02)
    out[: len(c)] += c * 0.4
    return out


def warning():
    out = np.zeros(n(0.9))
    for k, f in enumerate([880, 740]):
        b = fm(f, 1.0, 0.8, 0.32, 0.1, 0.12)
        out[n(k * 0.22): n(k * 0.22) + len(b)] += b
    return out * 0.8


def notify():
    a = fm(1318.5, 2.0, 0.9, 0.5, 0.06, 0.16)
    b = fm(1975.5, 2.0, 0.9, 0.7, 0.06, 0.28)
    out = np.zeros(n(0.9)); out[: len(a)] += a; out[n(0.12): n(0.12) + len(b)] += b
    return out * 0.8


def shimmer(d=2.6):
    out = np.zeros(n(d))
    for k, f in enumerate([1760, 2217.5, 2637, 3520]):
        x = sine(f, d - k * 0.08) * adsr(d - k * 0.08, 0.25, 0.4, 0.5, 1.2) * 0.12
        out[n(k * 0.08): n(k * 0.08) + len(x)] += x
    return out


trans = np.zeros((2, n(DUR)))   # transitions / camera
det = np.zeros((2, n(DUR)))     # UI detail
# scene transitions (push-through camera): soft cinematic whooshes, alternating direction
for i, t in enumerate([3.78, 7.8, 10.8, 14.8, 19.8, 23.8, 29.8, 32.8, 35.8, 39.75]):
    place(trans, whoosh(0.62, 400, 3800, 10 + i, -0.7 if i % 2 else 0.7, 0.7 if i % 2 else -0.7), t - 0.25, 0.42)
# opening: three cards fly in, chips light, lines connect, core appears
for k, t in enumerate([0.2, 0.43, 0.67]):
    place(det, swipe(0.3, 20 + k, k != 2), t, 0.22)
for k, t in enumerate([1.33, 1.53, 1.73]):
    place(det, pan(tick(2800 + 300 * k), (k - 1) * 0.5), t, 0.35)
for k, t in enumerate([1.67, 1.8, 1.93]):
    place(det, pan(energy(0.4, 200, 900), (k - 1) * 0.6), t, 0.22)
place(det, pan(confirm(1046.5), 0), 1.9, 0.3)
# warehouse: upload drops in and lands, counter rolls up
place(det, swipe(0.4, 30, True), 4.45, 0.3)
place(det, pan(land(), 0), 5.36, 0.55)
place(det, pan(energy(0.35, 300, 1200), 0), 5.36, 0.18)
place(det, pan(count_ticks(1.7, True), 0.2), 4.95, 0.45)
# selection: carousel spin decelerates, pick, pull forward
place(det, pan(spin_ticks(1.55), -0.2), 7.95, 0.5)
place(det, pan(confirm(1760), 0), 9.53, 0.4)
place(det, pan(energy(0.4, 250, 1500), 0), 9.55, 0.25)
place(det, swipe(0.35, 31, True), 9.7, 0.25)
# duplicate scanner
place(det, swipe(0.5, 32, True), 10.95, 0.28)
place(det, pan(scan(1.62), 0), 11.73, 0.5)
for k, t in enumerate([12.1, 12.43, 12.77, 13.1]):
    place(det, pan(tick(2400 + 200 * k, 0.04), -0.2), t, 0.45)
place(det, pan(blocked(), 0.6), 12.73, 0.4)
place(det, pan(confirm(2093), 0), 13.47, 0.55)
# AI caption engine
place(det, swipe(0.45, 33, False), 14.85, 0.28)
place(det, pan(energy(0.6, 150, 2200), 0), 15.0, 0.25)
place(det, pan(data_texture(2.6, 4), 0), 15.4, 0.35)
for k, t in enumerate([15.8, 16.4, 17.0]):
    place(det, pan(typing(0.85, k), 0.15 * (k - 1)), t, 0.32)
for k, t in enumerate([18.07, 18.33, 18.6]):
    place(det, pan(tick(1900 + 350 * k, 0.05), (k - 1) * 0.6), t, 0.42)
# scheduler: clock pulse along the timeline, slots confirm
for k, t in enumerate(np.arange(20.2, 23.2, 0.5)):
    place(det, pan(tick(1300, 0.03), -0.3), t, 0.18)
for k, t in enumerate([21.2, 21.75, 22.3]):
    place(det, pan(confirm(1318.5 * 2 ** (k * 2 / 12)), 0.3), t, 0.3)
# publishing: engine -> buffer -> three directional pulses
place(det, pan(energy(0.5, 200, 1000), 0), 24.33, 0.3)
place(det, pan(tick(2200, 0.04), 0), 24.75, 0.3)
for k, t in enumerate([25.33, 25.6, 25.87]):
    place(det, pan(energy(0.55, 300, 1600), [-0.7, 0, 0.7][k]), t, 0.32)
for k in range(3):
    place(det, pan(data_texture(1.8, 10 + k), [-0.6, 0, 0.6][k]), 26.6 + k * 0.33, 0.14)
# POSTED x3 (premium confirmation), spread left -> right
for k, t in enumerate([30.07, 30.33, 30.6]):
    place(det, pan(posted(), [-0.6, 0, 0.6][k]), t, 0.42)
# archive: smooth transfer left -> right, landing, DB status
place(trans, whoosh(1.2, 350, 2600, 40, -0.6, 0.6), 33.25, 0.32)
place(det, pan(confirm(1568), 0.5), 34.42, 0.35)
place(det, pan(tick(2600, 0.04), 0), 34.55, 0.3)
# stock monitor: count down, warning, signal chain, Telegram notification
place(det, pan(count_ticks(1.5, False), 0), 36.02, 0.4)
place(det, pan(warning(), 0), 37.53, 0.5)
for k, t in enumerate([37.73, 38.0, 38.3, 38.58]):
    place(det, pan(energy(0.3, 400 + 150 * k, 1400 + 200 * k), -0.6 + 0.4 * k), t, 0.22)
place(det, pan(notify(), 0.1), 38.47, 0.6)
# final: system map reveal (node ticks), headline shimmer on the tagline
for k in range(10):
    place(det, pan(tick(1700 + 120 * k, 0.03), -0.5 + 0.11 * k), 39.85 + k * 0.133, 0.16)
place(det, pan(shimmer(2.6), 0), TAG + 0.05, 0.4)

ir = reverb_ir(1.4, 0.35, 5, 8000)
trans = biquad(reverb(trans, ir, 0.22), 'hp', 150, 0.7)
det = biquad(reverb(det, ir, 0.15), 'hp', 180, 0.7)
peak = max(np.max(np.abs(trans)), np.max(np.abs(det)))
write(os.path.join(OUT, 'sfx_transition.wav'), trans / peak * 0.9)
write(os.path.join(OUT, 'sfx_detail.wav'), det / peak * 0.9)
print('sfx v2 ok, peak', round(float(peak), 3), 'tag at', TAG)
