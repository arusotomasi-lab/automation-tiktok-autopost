"""Original cinematic electronic track, 120 BPM, A minor, arranged to the scene map in song.json.
Output: cache/audio/music.wav (stereo float, 48 kHz) and cache/audio/kick_env.npy (for sidechain in the mix).
"""
import os
import numpy as np
from dsp import (SR, CACHE, n, mtof, sine, saw, square, noise, adsr, expdec, biquad, sweep_lp, reverb_ir, reverb,
                 pingpong, pan, place, write, song, soft_clip)

S = song()
BPM = S['bpm']
BEAT = 60 / BPM
DUR = S['duration'] + 2.5  # tail; trimmed in the mix
CHORDS = {
    'Am': ([57, 60, 64, 69], 33), 'F': ([53, 57, 60, 65], 29), 'C': ([55, 60, 64, 67], 36),
    'G': ([55, 59, 62, 67], 31), 'Dm': ([57, 62, 65, 69], 38),
}
chord_list = S['chords']


def chord_at(t):
    cur = chord_list[0][0]
    for name, at in chord_list:
        if t >= at:
            cur = name
    return cur


def chord_spans():
    spans = []
    for i, (name, at) in enumerate(chord_list):
        end = chord_list[i + 1][1] if i + 1 < len(chord_list) else S['duration'] + 2
        spans.append((name, at, end))
    return spans


def in_any(t, ranges):
    return any(a <= t < b for a, b in ranges)


mix = {k: np.zeros((2, n(DUR))) for k in ['kick', 'drums', 'bass', 'pad', 'arp', 'stab', 'fx']}

# ---------------- drums ----------------
def kick():
    d = 0.45
    f = 45 + 120 * expdec(d, 0.035)
    body = sine(f, d) * expdec(d, 0.16)
    click = biquad(noise(0.012, 3), 'hp', 2500) * np.linspace(1, 0, n(0.012))
    k = body.copy()
    k[: len(click)] += 0.5 * click
    return soft_clip(k * 1.4, 1.2)


def clap(seed=1):
    d = 0.25
    x = noise(d, seed)
    x = biquad(biquad(x, 'bp', 1500, 0.8), 'hp', 700)
    env = np.zeros(n(d))
    for k, off in enumerate([0, 0.011, 0.022]):
        a = n(off)
        env[a:] += (0.8 if k < 2 else 1.0) * expdec(d - off, 0.012 if k < 2 else 0.07)[: n(d) - a]
    tone = sine(185, d) * expdec(d, 0.05) * 0.35
    return x * env * 0.9 + tone


def hat(open_=False, seed=2):
    d = 0.25 if open_ else 0.06
    x = biquad(noise(d, seed), 'hp', 7500)
    return x * expdec(d, 0.09 if open_ else 0.018)


K, CL, HC, HO = kick(), clap(), hat(), hat(True)
kick_env = np.zeros(n(DUR))

groove = [(4, 36), (40, 40.01)]          # kick sections (4-on-floor)
half = [(0, 0)]
claps = [(8, 11), (15, 33), (24, 30)]
hats8 = [(4, 36)]
hats16 = [(20, 30)]
open_h = [(8, 33)]

beat_times = np.arange(0, S['duration'], BEAT)
for i, t in enumerate(beat_times):
    if in_any(t, groove) and not (36 <= t < 40):
        place(mix['kick'], K, t, 0.95)
        kick_env[n(t):n(t) + n(0.25)] = np.maximum(kick_env[n(t):n(t) + n(0.25)], expdec(0.25, 0.09)[: len(kick_env[n(t):n(t) + n(0.25)])])
    if 36 <= t < 38 and i % 2 == 0:  # half-time pulse under the low-stock tension
        place(mix['kick'], K * 0.8, t, 0.85)
    if 2 <= t < 4 and i % 2 == 0:  # opening heartbeat
        place(mix['kick'], K * 0.7, t, 0.8)
    if in_any(t, claps) and i % 4 in (1, 3):
        place(mix['drums'], pan(CL, 0.05), t, 0.55)
    if in_any(t, open_h):
        place(mix['drums'], pan(HO, 0.25), t + BEAT / 2, 0.16)
for t in np.arange(0, S['duration'], BEAT / 2):
    if in_any(t, hats8):
        place(mix['drums'], pan(HC, -0.3), t, 0.22 if (t / (BEAT / 2)) % 2 else 0.12)
for t in np.arange(0, S['duration'], BEAT / 4):
    if in_any(t, hats16):
        place(mix['drums'], pan(HC, 0.35), t, 0.07 + 0.05 * ((t / (BEAT / 4)) % 2 == 1))
# snare roll into the final (38.5 -> 40)
for k, t in enumerate(np.arange(38.0, 40.0, BEAT / 4)):
    place(mix['drums'], pan(CL, 0), t, 0.12 + 0.4 * (k / 16) ** 1.6)
place(mix['kick'], K, 40.0, 1.0)

# ---------------- bass ----------------
for name, a, b in chord_spans():
    notes, root = CHORDS[name]
    f = mtof(root + 12)  # A1 octave for sub, chord root
    # sub: off-beat eighths (pumping), sustained in intro / final
    if a < 4 or a >= 40:
        d = b - a
        sub = sine(f, d) * adsr(d, 0.3, 0.2, 0.8, 0.6)
        place(mix['bass'], sub, a, 0.5 if a < 4 else 0.6)
        continue
    for t in np.arange(a, b, BEAT / 2):
        d = BEAT / 2 * 0.95
        on_beat = abs((t / BEAT) - round(t / BEAT)) < 1e-6
        if 36 <= t < 40:
            if not on_beat:
                continue
        x = sine(f, d) * adsr(d, 0.004, 0.08, 0.7, 0.05)
        mid = saw(f * 2, d) * adsr(d, 0.004, 0.12, 0.25, 0.05)
        mid = biquad(mid, 'lp', 900 if a >= 24 else 600, 1.2)
        place(mix['bass'], x * (0.4 if on_beat else 0.75) + mid * (0.25 if a >= 15 else 0.12), t, 0.55)

# ---------------- pad (supersaw) ----------------
pad = np.zeros((2, n(DUR)))
for name, a, b in chord_spans():
    notes, _ = CHORDS[name]
    d = b - a + 0.6
    chord = np.zeros((2, n(d)))
    for m in notes:
        for v, det in enumerate([-0.18, -0.1, -0.04, 0, 0.05, 0.11, 0.17]):
            fr = mtof(m) * 2 ** (det / 12)
            x = saw(fr, d, phase=(v * 0.137) % 1)
            chord += pan(x, -0.8 + v * 0.27) * 0.05
    chord *= adsr(d, 0.25, 0.3, 0.85, 0.55)
    place(pad, chord, a, 1.0)
# filter automation: closed in intro, opens to drop, closes for tension
cut = np.zeros(n(DUR))
pts = [(0, 700), (4, 1300), (8, 2000), (11, 1500), (15, 2600), (24, 5000), (30, 4000), (33, 2400), (36, 1600), (39.9, 3500), (40, 5200), (44, 2600), (DUR, 1800)]
tt = np.arange(n(DUR)) / SR
cut = np.exp(np.interp(tt, [p[0] for p in pts], [np.log(p[1]) for p in pts]))
block = 512
# block-wise time-varying low-pass
from scipy import signal as _sig
zi = np.zeros((2, 2))
out = np.zeros_like(pad)
for i in range(0, n(DUR), block):
    fr = cut[i]
    w0 = 2 * np.pi * fr / SR; q = 0.8
    alpha = np.sin(w0) / (2 * q); cw = np.cos(w0)
    bb = np.array([(1 - cw) / 2, 1 - cw, (1 - cw) / 2]) / (1 + alpha)
    aa = np.array([1 + alpha, -2 * cw, 1 - alpha]) / (1 + alpha)
    for c in range(2):
        out[c, i:i + block], zi[c] = _sig.lfilter(bb, aa, pad[c, i:i + block], zi=zi[c])
mix['pad'] = out * 0.9

# ---------------- arp (pluck 16ths) ----------------
arp = np.zeros((2, n(DUR)))
arp_ranges = [(1, 15), (15, 36), (36, 40)]
pattern = [0, 1, 2, 3, 2, 1, 2, 3]
step = BEAT / 4
for k, t in enumerate(np.arange(0, 40, step)):
    if not in_any(t, arp_ranges):
        continue
    notes, _ = CHORDS[chord_at(t)]
    m = notes[pattern[k % 8]] + 12
    if 36 <= t < 40 and k % 2:
        continue
    d = step * 1.6
    x = (0.6 * square(mtof(m), d) + 0.4 * saw(mtof(m) * 1.003, d)) * expdec(d, 0.07)
    bright = 1200 + 2600 * min(1, max(0, (t - 1) / 23)) if t < 30 else 2200
    x = biquad(x, 'lp', bright, 1.4)
    level = 0.1 if t < 4 else 0.13
    place(arp, pan(x, 0.35 * np.sin(k * 0.7)), t, level)
mix['arp'] = pingpong(arp, BEAT * 0.75, fb=0.4, mix=0.35)

# ---------------- stabs on the drop ----------------
for t in np.arange(24, 30, BEAT):
    notes, _ = CHORDS[chord_at(t)]
    d = 0.22
    st = sum(saw(mtof(m + 12), d) + saw(mtof(m + 12) * 1.006, d) for m in notes) * 0.07
    st = biquad(st * expdec(d, 0.08), 'lp', 3500, 1.1)
    place(mix['stab'], pan(st, -0.2), t + BEAT / 2, 0.75)
    place(mix['stab'], pan(st, 0.2), t + BEAT / 2 + 0.012, 0.5)
# bright major lift at 30
for m in [60, 64, 67, 72]:
    d = 2.8
    x = (saw(mtof(m), d) + saw(mtof(m) * 1.004, d)) * adsr(d, 0.01, 0.6, 0.3, 1.5) * 0.06
    place(mix['stab'], pan(biquad(x, 'lp', 4200), 0), 30.0, 0.9)

# ---------------- musical fx: risers, impacts, swells ----------------
def riser(d, seed=5):
    x = noise(d, seed)
    y = sweep_lp(x, 300, 9000, 1.5)
    t = np.arange(n(d)) / SR
    tone = sine(np.linspace(220, 880, n(d)), d) * 0.15
    return (y * 0.8 + tone) * (t / d) ** 2


def impact(d=3.0, big=True):
    boom = sine(42 + 30 * expdec(d, 0.08), d) * expdec(d, 0.9 if big else 0.4)
    hit = biquad(noise(0.4, 9), 'lp', 2500) * expdec(0.4, 0.07)
    x = boom * 0.9
    x[: len(hit)] += hit * 0.6
    return x


ir_big = reverb_ir(3.2, 0.9, 11, 5000)
fx = np.zeros((2, n(DUR)))
place(fx, impact(4.0), 0.0, 0.8)
place(fx, riser(1.6), 2.4, 0.35)
place(fx, riser(3.2, 6), 36.8, 0.4)
place(fx, impact(4.5), 40.0, 0.95)
place(fx, impact(2.0, False), 30.0, 0.5)
place(fx, riser(1.4, 8), 22.6, 0.3)
mix['fx'] = reverb(fx, ir_big, 0.35)

# ---------------- sum + glue ----------------
ir_room = reverb_ir(1.6, 0.35, 3, 7000)
music = (mix['kick'] * 0.85 + mix['drums'] * 2.4 + mix['bass'] * 0.6 + reverb(mix['pad'], ir_room, 0.3) * 2.6
         + mix['arp'] * 2.4 + reverb(mix['stab'], ir_room, 0.25) * 1.8 + mix['fx'] * 0.8)
# sidechain pump from the kick on pad/arp/bass is applied in the mix via kick_env; here a gentle pre-pump on pad
music = biquad(music, 'hp', 28, 0.7)
music = biquad(music, 'highshelf', 6000, 0.7, 4.0)
# section dynamics: the drop (24-30) and the final hit are the loudest moments
sec_pts = [(0, -3), (4, -1.5), (15, 0), (24, 2.5), (30, 1), (33, -0.5), (36, -1), (40, 1.5), (DUR, 0)]
gdb = np.interp(np.arange(n(DUR)) / SR, [p[0] for p in sec_pts], [p[1] for p in sec_pts])
music = music * 10 ** (gdb / 20)
peak = np.max(np.abs(music))
music = music / peak * 0.89
write(os.path.join(CACHE, 'music.wav'), music)
np.save(os.path.join(CACHE, 'kick_env.npy'), kick_env)
# stems for re-mixing without re-synthesis
for k in ['pad', 'arp', 'bass']:
    write(os.path.join(CACHE, f'stem_{k}.wav'), mix[k] / max(1e-9, np.max(np.abs(mix[k]))) * 0.9)
print('music ok', music.shape[1] / SR, 's peak', peak)
