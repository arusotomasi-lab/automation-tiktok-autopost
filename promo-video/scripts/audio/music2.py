"""V2 soundtrack: original cinematic electronic score, 120 BPM, A minor, arranged to the scene map.
INTRO (dark ambience + pulse) -> BUILD (beat enters at the warehouse) -> MOMENTUM (scanner rhythm, AI arp + motif,
scheduler energy) -> CLIMAX (publishing drop) -> lift (POSTED) -> pull-back (archive, low stock) -> FINAL hit + resolution.
Outputs cache/audio/v2/music.wav (stereo float 48 kHz) and stems for the mix.
"""
import json
import os
import numpy as np
from scipy import signal
from dsp import (SR, CACHE, ROOT, n, mtof, sine, saw, square, noise, adsr, expdec, biquad, reverb_ir, reverb, pingpong,
                 pan, place, write, song, soft_clip)

VER = os.environ.get('AUDIO_VER', 'v2')  # v2 = Chatterbox voice, v3 = Edge TTS Ardi
OUT = os.path.join(CACHE, VER)
os.makedirs(OUT, exist_ok=True)
S = song()
DUR = S['duration'] + 2.0
BEAT = 60 / S['bpm']
BAR = 4 * BEAT
CUES = {}
cue_path = os.path.join(ROOT, 'cache', 'voice', os.environ.get('AUDIO_VER', 'v2'), 'vo_cues.json')
if os.path.exists(cue_path):
    CUES = json.load(open(cue_path, encoding='utf-8'))
T_HIT = float(CUES.get('final_hit', 44.75))  # start of "Otomatiskan semuanya" -> biggest impact
rng = np.random.default_rng(42)

CH = {  # chord tones (pad voicing) and bass root (MIDI)
    'Am': ([57, 60, 64, 69], 45), 'F': ([53, 57, 60, 65], 41), 'C': ([55, 60, 64, 67], 48), 'G': ([55, 59, 62, 67], 43),
    'Dm': ([57, 62, 65, 69], 50), 'E': ([56, 59, 64, 68], 40), 'Fmaj7': ([57, 60, 64, 65], 41),
}
PROG = [('Am', 0), ('F', 6), ('Am', 8), ('F', 10), ('C', 12), ('G', 14), ('Am', 16), ('F', 18), ('C', 20), ('G', 22),
        ('F', 24), ('G', 26), ('Am', 28), ('C', 30), ('G', 32), ('F', 34), ('Dm', 36), ('E', 38), ('F', 40), ('G', 42),
        ('Am', T_HIT)]


def chord_at(t):
    cur = PROG[0][0]
    for c, a in PROG:
        if t >= a:
            cur = c
    return cur


def spans():
    out = []
    for i, (c, a) in enumerate(PROG):
        b = PROG[i + 1][1] if i + 1 < len(PROG) else DUR
        out.append((c, a, b))
    return out


def tv_lp(x, cutoff, q=0.8, block=256):
    """Time-varying resonant low-pass; cutoff is an array (Hz) per sample."""
    x2 = x if x.ndim == 2 else x[None, :]
    out = np.zeros_like(x2)
    zi = np.zeros((x2.shape[0], 2))
    N = x2.shape[1]
    for i in range(0, N, block):
        fr = float(np.clip(cutoff[min(i, len(cutoff) - 1)], 30, SR * 0.45))
        w0 = 2 * np.pi * fr / SR
        al = np.sin(w0) / (2 * q); cw = np.cos(w0)
        b = np.array([(1 - cw) / 2, 1 - cw, (1 - cw) / 2]) / (1 + al)
        a = np.array([1 + al, -2 * cw, 1 - al]) / (1 + al)
        for c in range(x2.shape[0]):
            out[c, i:i + block], zi[c] = signal.lfilter(b, a, x2[c, i:i + block], zi=zi[c])
    return out if x.ndim == 2 else out[0]


def chorus(x, depth_ms=6, rate=0.6, mix=0.5):
    if x.ndim == 1:
        x = np.stack([x, x])
    N = x.shape[1]
    t = np.arange(N) / SR
    out = x.copy()
    for c, ph in enumerate([0, np.pi / 2]):
        d = (depth_ms / 2 * (1 + np.sin(2 * np.pi * rate * t + ph)) + 8) * SR / 1000
        idx = np.arange(N) - d
        i0 = np.clip(np.floor(idx).astype(int), 0, N - 1)
        fr = idx - np.floor(idx)
        i1 = np.clip(i0 + 1, 0, N - 1)
        out[c] = x[c] * (1 - mix) + mix * (x[c, i0] * (1 - fr) + x[c, i1] * fr)
    return out


def supersaw(midis, dur, voices=7, spread=0.22, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros((2, n(dur)))
    for m in midis:
        for v in range(voices):
            det = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
            x = saw(mtof(m) * 2 ** (det / 12), dur, phase=r.random())
            out += pan(x, (v / (voices - 1)) * 1.6 - 0.8) / voices
    return out / len(midis)


def env_curve(points, dur):
    t = np.arange(n(dur)) / SR
    return np.interp(t, [p[0] for p in points], [p[1] for p in points])


# =============== instruments ===============
def kick(punch=1.0):
    d = 0.5
    f = 46 + 130 * expdec(d, 0.028)
    body = sine(f, d) * expdec(d, 0.24)
    knock = sine(110, d) * expdec(d, 0.03) * 0.4
    click = np.zeros(n(d)); c = biquad(noise(0.006, 3), 'hp', 3500); click[:len(c)] = c * np.linspace(1, 0, len(c))
    k = body + knock + 0.35 * punch * click
    return soft_clip(k * 1.6, 1.4) * 0.9


def snare():
    d = 0.35
    tone = (sine(195, d) * 0.6 + sine(330, d) * 0.25) * expdec(d, 0.05)
    nz = biquad(biquad(noise(d, 5), 'hp', 1800), 'lp', 9000) * expdec(d, 0.11)
    return soft_clip((tone + nz * 0.9) * 1.2, 1.2)


def clap():
    d = 0.3
    x = biquad(biquad(noise(d, 8), 'bp', 1400, 0.9), 'hp', 800)
    env = np.zeros(n(d))
    for k, off in enumerate([0, 0.009, 0.02, 0.031]):
        a = n(off)
        env[a:] += (0.7 if k < 3 else 1.0) * expdec(d - off, 0.01 if k < 3 else 0.08)[: n(d) - a]
    return x * env


def hat(open_=False, seed=2):
    d = 0.35 if open_ else 0.07
    ratios = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]
    x = sum(square(f * 2.2, d) for f in ratios) / 6 + 0.4 * noise(d, seed)
    x = biquad(biquad(x, 'hp', 7200), 'peak', 10000, 1.0, 3)
    return x * expdec(d, 0.12 if open_ else 0.022)


def click_perc(f=2400):
    d = 0.04
    return (sine(f, d) + 0.3 * sine(f * 2.7, d)) * expdec(d, 0.006)


def rim():
    d = 0.08
    return (biquad(noise(d, 11), 'bp', 2200, 4) * 0.8 + sine(520, d) * 0.5) * expdec(d, 0.012)


def crash(d=2.6):
    x = biquad(noise(d, 21), 'hp', 3500) * 0.7
    x += biquad(sum(square(f, d) for f in [333, 471, 587, 711, 913]) / 5, 'hp', 4000) * 0.3
    return x * (expdec(d, 0.7) * np.minimum(1, np.arange(n(d)) / n(0.004)))


def braam(root=33, d=3.2, seed=0):
    x = supersaw([root, root + 7, root + 12, root + 19], d, voices=9, spread=0.18, seed=seed)
    x += np.stack([square(mtof(root), d)] * 2) * 0.25
    cut = env_curve([(0, 180), (0.12, 1600), (0.9, 700), (d, 200)], d)
    y = tv_lp(x, cut, 1.1)
    y = soft_clip(y * 2.2, 1.5) * env_curve([(0, 0), (0.03, 1), (1.2, 0.7), (d, 0)], d)
    return y


def impact(d=4.0, big=True):
    sub = sine(28 + 70 * expdec(d, 0.12), d) * expdec(d, 1.1 if big else 0.5)
    hit = biquad(noise(0.5, 9), 'lp', 1800) * expdec(0.5, 0.08)
    out = np.zeros(n(d)); out += sub; out[: len(hit)] += hit * 0.8
    return soft_clip(out * 1.3, 1.1)


def riser(d=2.0, seed=5):
    t = np.arange(n(d)) / SR
    p = (t / d)
    nz = noise(d, seed)
    cut = 300 * (40 ** p)
    y = tv_lp(nz, cut, 2.5) * 0.7
    shep = sum(saw(220 * 2 ** (k + 2 * p), d) * np.sin(np.pi * ((k + 2 * p) / 4)) ** 2 for k in range(3)) * 0.12
    return pan(y + shep, 0) * p ** 2.2


def downlifter(d=1.6, seed=6):
    p = np.arange(n(d)) / n(d)
    y = tv_lp(noise(d, seed), 8000 * (0.03 ** p), 1.5)
    return pan(y * (1 - p) ** 1.5, 0)


def reverse_crash(d=1.5):
    return crash(d)[::-1].copy()


def pluck(m, d=0.3, bright=4200):
    x = 0.6 * saw(mtof(m), d) + 0.4 * square(mtof(m) * 1.002, d)
    cut = 500 + bright * expdec(d, 0.07)
    return tv_lp(x, cut, 1.6) * expdec(d, 0.18)


def lead(m_list, d_list, start_gap=0.0):
    """Motif lead with portamento and gentle vibrato."""
    total = sum(d_list)
    N = n(total)
    f = np.zeros(N)
    pos = 0
    for m, d in zip(m_list, d_list):
        f[n(pos):n(pos + d)] = mtof(m)
        pos += d
    f[f == 0] = mtof(m_list[-1])
    a = np.exp(-1 / (0.025 * SR))
    lf = signal.lfilter([1 - a], [1, -a], np.log(f), zi=[np.log(f[0])])[0]
    t = np.arange(N) / SR
    lf += 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.2) / 0.4, 0, 1)
    fr = np.exp(lf)
    x = saw(fr, total) * 0.5 + saw(fr * 1.004, total) * 0.5 + square(fr / 2, total) * 0.2
    x = tv_lp(x, 1800 + 1200 * np.abs(np.sin(np.pi * t / max(total, 1e-3))), 0.9)
    env = adsr(total, 0.02, 0.2, 0.85, 0.35)
    return x * env


# =============== arrangement ===============
L = {k: np.zeros((2, n(DUR))) for k in ['kick', 'drums', 'perc', 'bass', 'pad', 'arp', 'lead', 'fx', 'amb']}
kick_env = np.zeros(n(DUR))
K, SN, CL, HC, HO = kick(), snare(), clap(), hat(), hat(True)


def at_beats(a, b, step=BEAT, off=0.0):
    return [t for t in np.arange(a + off, b - 1e-6, step)]


def add_kick(t, g=1.0):
    place(L['kick'], K, t, g)
    e = expdec(0.3, 0.1)
    i = n(t)
    m = min(len(e), len(kick_env) - i)
    if m > 0:
        kick_env[i:i + m] = np.maximum(kick_env[i:i + m], e[:m] * g)


# intro heartbeat pulse (0-4): soft kicks on beat 1 & 3, filtered
for t in at_beats(0.0, 4.0, 2 * BEAT):
    place(L['kick'], biquad(K, 'lp', 300), t, 0.55)
# build (4-8): kick 4/4 enters
for t in at_beats(4, 36):
    add_kick(t, 0.95 if t >= 24 else 0.85)
for t in at_beats(36, 38, 2 * BEAT):  # pull-back: half-time
    add_kick(t, 0.6)
for t in at_beats(38, 40):
    add_kick(t, 0.7)
add_kick(40.0, 1.0)
add_kick(T_HIT, 1.0)
# hats
for t in at_beats(4, 36, BEAT / 2):
    sixteenth = (t / (BEAT / 2)) % 2
    place(L['drums'], pan(HC, -0.25), t, 0.16 if sixteenth else 0.09)
for t in at_beats(20, 33, BEAT / 4):
    place(L['drums'], pan(HC, 0.3), t, 0.05 + 0.04 * (((t / (BEAT / 4)) % 4) == 2))
for t in at_beats(8, 33, BEAT, BEAT / 2):
    place(L['drums'], pan(HO, 0.2), t, 0.11 if t >= 20 else 0.07)
# claps / snares on 2 & 4
for t in at_beats(16, 33, BEAT):  # claps from 16.0 so the first word "Hook" (15.25) stays clear
    if round(t / BEAT) % 4 in (1, 3):
        place(L['drums'], pan(CL, 0.05), t, 0.42)
        if t >= 24:
            place(L['drums'], pan(SN, -0.05), t, 0.35)
# pickups / fills
# (no pickup fill at 10.5-11.0: it masked the final /k/ of 'secara acak' in the narration)
for k, t in enumerate(np.arange(23.0, 24.0, BEAT / 4)):
    place(L['drums'], pan(SN, (k % 2) * 0.3 - 0.15), t, 0.12 + 0.05 * k)
for k, t in enumerate(np.arange(38.0, 40.0, BEAT / 4)):
    place(L['drums'], pan(SN, 0), t, 0.08 + 0.32 * (k / 16) ** 1.7)
# crashes on section downbeats
for t, g in [(4.0, 0.25), (15.0, 0.1), (24.0, 0.55), (30.0, 0.45), (40.0, 0.6), (T_HIT, 0.7)]:
    place(L['drums'], pan(crash(), 0.1), t, g)
# syncopated digital percussion (8-36) + scanner rhythm (11-15)
synco = [0, 3, 6, 10, 12, 14]
for bar0 in np.arange(8, 36, BAR):
    for s16 in synco:
        t = bar0 + s16 * BEAT / 4
        if t < 36:
            place(L['perc'], pan(click_perc(2200 + 300 * (s16 % 3)), 0.5 * np.sin(s16)), t, 0.22)
    place(L['perc'], pan(rim(), -0.3), bar0 + 3.5 * BEAT, 0.3)
for k, t in enumerate(np.arange(11.0, 15.0, BEAT / 4)):  # scanning: rising blip sequence
    f = 1500 + 900 * ((k % 8) / 7)
    place(L['perc'], pan(click_perc(f), 0.6 * np.sin(k * 0.8)), t, 0.18)

# ---------- bass ----------
for c, a, b in spans():
    notes, root = CH[c]
    if a < 4:
        x = sine(mtof(root - 12), b - a) * env_curve([(0, 0), (1.5, 1), (b - a, 0.8)], b - a)
        place(L['bass'], pan(x, 0), a, 0.45)
        continue
    if a >= 40 and a < T_HIT:
        d = b - a
        x = sine(mtof(root - 12), d) * adsr(d, 0.05, 0.3, 0.8, 0.4)
        place(L['bass'], pan(x, 0), a, 0.55)
        continue
    if a >= T_HIT:
        d = b - a
        x = sine(mtof(root - 12), d) * expdec(d, 1.4)
        place(L['bass'], pan(x, 0), a, 0.7)
        continue
    step = BEAT / 2
    for t in np.arange(a, b - 1e-6, step):
        on = abs(t / BEAT - round(t / BEAT)) < 1e-6
        if 36 <= t < 40 and not on:
            continue
        d = step * 0.92
        sub = sine(mtof(root - 12), d) * adsr(d, 0.004, 0.1, 0.8, 0.04)
        g = 0.55 if not on else 0.35
        place(L['bass'], pan(sub, 0), t, g)
        if t >= 15:  # Reese layer for momentum and the drop
            r = saw(mtof(root), d) * 0.5 + saw(mtof(root) * 1.009, d) * 0.5
            r = tv_lp(r, 350 + (650 if t >= 24 else 250) * expdec(d, 0.06), 1.3) * adsr(d, 0.004, 0.08, 0.7, 0.04)
            place(L['bass'], pan(soft_clip(r * 2.0, 1.5), 0), t, 0.16 if t < 24 else 0.24)

# ---------- pads ----------
for c, a, b in spans():
    notes, _ = CH[c]
    d = b - a + 0.8
    p = supersaw(notes, d, voices=7, spread=0.2, seed=int(a * 10))
    p *= adsr(d, 0.35 if a < 24 else 0.08, 0.4, 0.85, 0.7)
    place(L['pad'], p, a, 1.0)
pts = [(0, 500), (4, 900), (8, 1300), (11, 1000), (15, 1800), (20, 2400), (23.9, 3200), (24, 5200), (30, 4400),
       (33, 1600), (36, 900), (39.9, 2600), (40, 4200), (43, 1500), (T_HIT, 5200), (DUR, 2000)]
cut = np.exp(np.interp(np.arange(n(DUR)) / SR, [p[0] for p in pts], [np.log(p[1]) for p in pts]))
L['pad'] = chorus(tv_lp(L['pad'], cut, 0.7), 5, 0.4, 0.45)

# ---------- arp (AI caption -> drop) ----------
pattern = [0, 2, 1, 3, 2, 1, 3, 2]
for k, t in enumerate(np.arange(15.75, 36.0, BEAT / 4)):  # enters right after the word "Hook" (15.25-15.6)
    notes, _ = CH[chord_at(t)]
    m = notes[pattern[k % 8]] + 12
    bright = 2500 if t < 24 else 4500
    g = 0.11 if t < 20 else 0.13
    if 30 <= t < 33:
        g = 0.09
    if 33 <= t < 36:
        g = 0.06
    place(L['arp'], pan(pluck(m, 0.28, bright), 0.4 * np.sin(k * 0.6)), t, g)
for k, t in enumerate(np.arange(8.0, 14.75, BEAT / 2)):  # sparse intro arp from the selection scene
    notes, _ = CH[chord_at(t)]
    place(L['arp'], pan(pluck(notes[k % 4] + 12, 0.35, 1500), 0.3 * np.sin(k)), t, 0.07)
L['arp'] = pingpong(L['arp'], BEAT * 0.75, fb=0.38, mix=0.32)

# ---------- motif (memorable 2-bar hook) ----------
MOTIF = ([69, 72, 76, 74, 72, 71, 67, 69], [0.5, 0.25, 0.75, 0.5, 0.5, 0.25, 0.75, 0.5])
MOTIF_B = ([69, 72, 76, 74, 72, 74, 76, 81], [0.5, 0.25, 0.75, 0.5, 0.5, 0.25, 0.25, 1.0])
for t0, g, mot in [(16.0, 0.10, MOTIF), (24.0, 0.16, MOTIF), (26.0, 0.16, MOTIF_B), (28.0, 0.15, MOTIF)]:
    x = lead(*mot)
    place(L['lead'], pan(x, -0.1), t0, g)
    place(L['lead'], pan(lead([m + 12 for m in mot[0]], mot[1]), 0.15), t0, g * 0.25)
# final resolution statement on the tagline hit
fin = lead([76, 74, 72, 69], [0.25, 0.25, 0.25, 1.4])
place(L['lead'], pan(fin, 0), T_HIT, 0.14)
L['lead'] = pingpong(L['lead'], BEAT * 0.75, fb=0.3, mix=0.22)

# ---------- cinematic fx ----------
place(L['fx'], braam(33, 3.6, 1), 0.0, 0.55)
place(L['fx'], pan(impact(4.5), 0), 0.0, 0.6)
place(L['fx'], riser(1.6, 3), 2.4, 0.38)
place(L['fx'], pan(reverse_crash(1.2), 0), 2.8, 0.25)
place(L['fx'], pan(impact(1.6, False), 0), 13.5, 0.35)          # UNIQUE
place(L['fx'], riser(2.0, 4), 22.0, 0.45)
place(L['fx'], pan(reverse_crash(1.5), 0), 22.5, 0.3)
place(L['fx'], pan(impact(4.0), 0), 24.0, 0.7)                   # drop
place(L['fx'], braam(33, 2.4, 2), 24.0, 0.25)
place(L['fx'], pan(impact(2.5, False), 0), 30.0, 0.5)           # POSTED
place(L['fx'], downlifter(1.8), 32.9, 0.32)                      # into archive
place(L['fx'], downlifter(1.4, 7), 35.9, 0.28)                   # pull back for low stock
place(L['fx'], riser(2.3, 8), 37.7, 0.45)
place(L['fx'], pan(reverse_crash(1.6), 0), 38.4, 0.3)
place(L['fx'], braam(29, 3.4, 3), 40.0, 0.55)                    # final reveal (F)
place(L['fx'], pan(impact(4.0), 0), 40.0, 0.75)
place(L['fx'], riser(max(0.6, T_HIT - 43.6 - 0.05), 9), 43.6, 0.4)
place(L['fx'], braam(33, 3.5, 4), T_HIT, 0.6)                    # biggest hit: OTOMATISKAN SEMUANYA
place(L['fx'], pan(impact(5.0), 0), T_HIT, 0.9)

# ---------- ambience ----------
wind = tv_lp(noise(DUR, 31), 250 + 200 * np.sin(2 * np.pi * 0.08 * np.arange(n(DUR)) / SR) ** 2 + 50, 0.7)
air = biquad(noise(DUR, 32), 'hp', 7000) * 0.05
amb = (wind + air) * env_curve([(0, 0.0), (0.5, 1), (4, 0.8), (6, 0.2), (36, 0.2), (37, 0.7), (40, 0.4), (DUR, 0.5)], DUR)
L['amb'] = np.stack([amb, np.roll(amb, n(0.013))]) * 0.35

# ---------- sidechain + bus ----------
pump = 1 - 0.55 * np.clip(kick_env, 0, 1)
for k in ['bass', 'pad', 'arp']:
    L[k] = L[k] * pump
ir_hall = reverb_ir(3.0, 0.9, 7, 5500)
ir_room = reverb_ir(1.2, 0.3, 3, 8000)
bus = {
    'drums': (L['kick'] * 0.8 + reverb(L['drums'], ir_room, 0.18) * 3.2 + reverb(L['perc'], ir_room, 0.25) * 2.4),
    'bass': L['bass'] * 1.0,
    'music': (reverb(L['pad'], ir_hall, 0.35) * 1.15 + reverb(L['arp'], ir_room, 0.25) * 1.5 + reverb(L['lead'], ir_hall, 0.25) * 1.6) * 4.2,
    'fx': reverb(L['fx'], ir_hall, 0.3) * 0.8 + L['amb'] * 2.0,
}
mix = sum(bus.values())
mix = biquad(mix, 'hp', 30, 0.7)
mix = biquad(mix, 'peak', 250, 0.9, -1.5)
mix = biquad(mix, 'highshelf', 7000, 0.7, 2.0)
sec = [(0, -2.5), (4, -1.5), (15, -0.5), (20, 0), (24, 1.5), (30, 0.5), (33, -1.0), (36, -2.5), (39.9, 0), (40, 1.0),
       (43.5, -1.0), (T_HIT, 1.5), (DUR, 0)]
gdb = np.interp(np.arange(n(DUR)) / SR, [p[0] for p in sec], [p[1] for p in sec])
mix = mix * 10 ** (gdb / 20)
peak = float(np.max(np.abs(mix)))
mix = mix / peak * 0.89
write(os.path.join(OUT, 'music.wav'), mix)
for k, v in bus.items():
    write(os.path.join(OUT, f'bus_{k}.wav'), v / peak * 0.89)
json.dump({'final_hit': T_HIT, 'duration': DUR}, open(os.path.join(OUT, 'music_meta.json'), 'w'))
print('music v2 ok', round(DUR, 2), 's, final hit at', T_HIT, 'peak', round(peak, 2))
