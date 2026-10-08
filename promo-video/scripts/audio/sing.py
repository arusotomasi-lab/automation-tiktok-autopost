"""Original Indonesian vocal: local Piper TTS (id_ID) per lyric line, then WORLD vocoder resynthesis that
(1) splits the line into syllable segments, (2) stretches vowels to the melody rhythm, and
(3) retunes every syllable to its melody note with portamento + vibrato. Output: cache/audio/vocal.wav.
Raw TTS and per-line sung takes are cached in cache/voice/ so a rerun only redoes what changed.
"""
import hashlib
import json
import os
import subprocess
import sys
import numpy as np
import pyworld as pw
from scipy import signal
from dsp import (SR, VOICE_CACHE, CACHE, ROOT, n, mtof, read, write, song, biquad, compress, reverb_ir, reverb,
                 pingpong, pan, place)

PIPER = os.path.join(ROOT, '.tools', 'piper', 'piper.exe')
MODEL = os.path.join(ROOT, '.tools', 'voices', 'id_ID-news_tts-medium.onnx')
FP = 5.0  # WORLD frame period (ms)
SCALE = [45, 47, 48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79]  # A natural minor


def tts(text, key):
    path = os.path.join(VOICE_CACHE, f'tts_{key}.wav')
    if not os.path.exists(path):
        subprocess.run([PIPER, '--model', MODEL, '--output_file', path, '--length_scale', '1.0',
                        '--noise_scale', '0.5', '--noise_w', '0.6', '--sentence_silence', '0'],
                       input=text.encode('utf-8'), check=True, capture_output=True)
    x, fs = read(path)
    x = x[0]
    # trim leading/trailing silence
    e = np.convolve(x ** 2, np.ones(256) / 256, mode='same')
    idx = np.where(e > 1e-5)[0]
    x = x[max(0, idx[0] - 200): idx[-1] + 400] if len(idx) else x
    return x.astype(np.float64), fs


def segment(f0, energy, N):
    """Split frames into N syllable-like segments by voiced-time fraction, snapped to nearby energy dips."""
    voiced = f0 > 0
    cum = np.cumsum(voiced)
    total = cum[-1]
    bounds = [0]
    for k in range(1, N):
        target = total * k / N
        i = int(np.searchsorted(cum, target))
        w = 8  # +-40 ms search window
        lo, hi = max(bounds[-1] + 2, i - w), min(len(f0) - 2, i + w)
        if hi > lo:
            i = lo + int(np.argmin(energy[lo:hi]))
        bounds.append(max(bounds[-1] + 1, i))
    bounds.append(len(f0))
    return bounds


def sing_line(line, idx, transpose=0, detune_cents=0.0, harmony=False):
    key = hashlib.md5(line['tts'].encode('utf-8')).hexdigest()[:10]
    x, fs = tts(line['tts'], key)
    f0, t = pw.harvest(x, fs, f0_floor=70, f0_ceil=700, frame_period=FP)
    sp = pw.cheaptrick(x, f0, t, fs)
    ap = pw.d4c(x, f0, t, fs)
    hop = int(fs * FP / 1000)
    energy = np.array([np.mean(x[i * hop:(i + 1) * hop] ** 2) if i * hop < len(x) else 0 for i in range(len(f0))])
    notes = line['notes']
    N = len(notes)
    bounds = segment(f0, energy, N)
    src_len = np.diff(bounds).astype(float)  # frames per segment
    slot = (line['end'] - line['start']) - 0.12
    T = slot * 1000 / FP  # target frames
    w = np.array([nt[1] for nt in notes], float)
    tgt = w / w.sum() * T
    ratio = np.clip(tgt / src_len, 0.75, 4.0)
    tgt = ratio * src_len
    tgt *= T / tgt.sum()
    # per-frame durations: stretch voiced frames, keep consonants (unvoiced) near natural length
    dur = np.ones(len(f0))
    seg_of = np.zeros(len(f0), int)
    for k in range(N):
        a, b = bounds[k], bounds[k + 1]
        seg_of[a:b] = k
        v = f0[a:b] > 0
        nv, nu = v.sum(), (~v).sum()
        u_ratio = min(1.15, max(0.8, tgt[k] / max(1, b - a)))
        rem = tgt[k] - nu * u_ratio
        v_ratio = rem / nv if nv > 0 else 1.0
        if nv == 0 or v_ratio <= 0:
            dur[a:b] = tgt[k] / (b - a)
        else:
            dur[a:b] = np.where(v, v_ratio, u_ratio)
    # build target timeline -> fractional source index
    cum = np.concatenate([[0], np.cumsum(dur)])
    Tn = int(np.floor(cum[-1]))
    tq = np.arange(Tn) + 0.5
    src_pos = np.interp(tq, cum, np.arange(len(cum))) - 0.5
    src_pos = np.clip(src_pos, 0, len(f0) - 1)
    i0 = np.floor(src_pos).astype(int)
    i1 = np.minimum(i0 + 1, len(f0) - 1)
    fr = (src_pos - i0)[:, None]
    sp_t = np.exp(np.log(sp[i0] + 1e-12) * (1 - fr) + np.log(sp[i1] + 1e-12) * fr)
    ap_t = ap[i0] * (1 - fr) + ap[i1] * fr
    near = np.round(src_pos).astype(int)
    voiced_t = f0[near] > 0
    seg_t = seg_of[near]
    # melody pitch curve
    target_m = np.array([notes[k][0] for k in seg_t], float) + transpose
    if harmony:
        def third(m):
            i = int(np.argmin(np.abs(np.array(SCALE) - m)))
            return SCALE[min(i + 2, len(SCALE) - 1)]
        target_m = np.array([third(notes[k][0]) for k in seg_t], float)
    hz = mtof(target_m)
    # portamento (one-pole, ~28 ms)
    a = np.exp(-FP / 28.0)
    sm = signal.lfilter([1 - a], [1, -a], np.log(hz), zi=[np.log(hz[0])])[0]
    # vibrato that fades in on long notes
    since = np.zeros(Tn)
    for i in range(1, Tn):
        since[i] = since[i - 1] + FP if seg_t[i] == seg_t[i - 1] else 0
    depth = np.clip((since - 160) / 200, 0, 1) * 0.013  # ~ +-22 cents at full depth
    vib = depth * np.sin(2 * np.pi * 5.6 * np.arange(Tn) * FP / 1000 + idx)
    # keep a little of the natural contour so it does not sound fully robotic
    nat = np.where(f0[near] > 0, np.log(np.maximum(f0[near], 1)), np.nan)
    med = np.nanmedian(nat) if np.any(~np.isnan(nat)) else 0
    detail = np.nan_to_num(nat - med) * 0.08
    detail = signal.lfilter([0.2], [1, -0.8], detail)
    f0_t = np.exp(sm + vib + detail) * 2 ** (detune_cents / 1200)
    f0_t = np.where(voiced_t, f0_t, 0.0)
    y = pw.synthesize(f0_t, np.ascontiguousarray(sp_t), np.ascontiguousarray(ap_t), fs, FP)
    y = signal.resample_poly(y, 320, 147)  # 22050 -> 48000
    # gentle fades
    f = n(0.01)
    y[:f] *= np.linspace(0, 1, f)
    y[-n(0.04):] *= np.linspace(1, 0, n(0.04))
    return y


def main():
    S = song()
    dur = S['duration'] + 2.5
    lead = np.zeros((2, n(dur)))
    dbl = np.zeros((2, n(dur)))
    harm = np.zeros((2, n(dur)))
    report = []
    for i, line in enumerate(S['lines']):
        y = sing_line(line, i)
        write(os.path.join(VOICE_CACHE, f'line_{i:02d}.wav'), y)
        place(lead, pan(y, 0.0), line['start'], 1.0)
        y2 = sing_line(line, i + 50, detune_cents=9)
        place(dbl, pan(y2, -0.55), line['start'] + 0.018, 0.32)
        y3 = sing_line(line, i + 90, detune_cents=-8)
        place(dbl, pan(y3, 0.55), line['start'] + 0.026, 0.32)
        if line.get('harmony'):
            h = sing_line(line, i + 130, harmony=True)
            place(harm, pan(h, 0.35), line['start'] + 0.01, 0.42)
            h2 = sing_line(line, i + 170, harmony=True, detune_cents=7)
            place(harm, pan(h2, -0.35), line['start'] + 0.02, 0.35)
        report.append({'line': i, 'text': line['text'], 'seconds': round(len(y) / SR, 2), 'slot': round(line['end'] - line['start'], 2)})
        print('sung', i, line['text'], f'{len(y) / SR:.2f}s')
    vox = lead + dbl + harm
    # vocal chain
    vox = biquad(vox, 'hp', 150, 0.7)
    vox = biquad(vox, 'peak', 300, 1.0, -2.5)
    vox = biquad(vox, 'peak', 3400, 0.9, 3.5)
    vox = biquad(vox, 'highshelf', 9000, 0.7, 2.0)
    vox = biquad(vox, 'lp', 14000, 0.7)
    vox = compress(vox, thresh_db=-22, ratio=3.5, attack=0.003, release=0.12, makeup_db=4)
    ir = reverb_ir(1.5, 0.42, 21, 7500)
    wet = reverb(vox, ir, 0.2)
    wet = wet + pingpong(vox, 0.375, fb=0.35, mix=0.12) - vox  # add 3/16 ping-pong echo
    vox = wet
    vox = vox / max(1e-9, np.max(np.abs(vox))) * 0.9
    write(os.path.join(CACHE, 'vocal.wav'), vox)
    write(os.path.join(CACHE, 'vocal_dry_lead.wav'), lead / max(1e-9, np.max(np.abs(lead))) * 0.9)
    with open(os.path.join(VOICE_CACHE, 'report.json'), 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    print('vocal ok')


if __name__ == '__main__':
    main()
