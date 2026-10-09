"""Objective voice QA (we cannot listen): naturalness (UTMOS22 predicted MOS, 1-5), pitch (male ~85-155 Hz),
prosody liveliness (f0 std in semitones), and intelligibility (whisper.cpp WER vs expected text).
Usage: voice_eval.py <lang id|en> <wav> [<expected text>] ...  (pairs of wav + text after lang)
"""
import os
import re
import subprocess
import sys
import numpy as np
import librosa
import torch
import jiwer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FF = os.path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
WH = os.path.join(ROOT, '.tools', 'whisper', 'main.exe')
WM = os.path.join(ROOT, '.tools', 'whisper', 'ggml-small.bin')
_mos = None


def mos(y, sr):
    global _mos
    if _mos is None:
        _mos = torch.hub.load('tarepan/SpeechMOS:v1.2.0', 'utmos22_strong', trust_repo=True)
    y16 = librosa.resample(y, orig_sr=sr, target_sr=16000)
    with torch.no_grad():
        return float(_mos(torch.from_numpy(y16).float().unsqueeze(0), 16000).item())


def transcribe(path, lang):
    tmp = path + '.16k.wav'
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-i', path, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', tmp], check=True)
    out = subprocess.run([WH, '-m', WM, '-l', lang, '-nt', '-f', tmp], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout
    os.remove(tmp)
    return ' '.join(l.strip() for l in out.splitlines() if l.strip())


def norm(t):
    t = t.lower().replace('tik tok', 'tiktok').replace('tik-tok', 'tiktok')
    return re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', t)).strip()


def analyze(path, lang, expected=None):
    y, sr = librosa.load(path, sr=None, mono=True)
    f0, vf, _ = librosa.pyin(y, fmin=60, fmax=400, sr=sr, frame_length=2048)
    f = f0[~np.isnan(f0)]
    st = 12 * np.log2(f / np.median(f)) if len(f) else np.array([0])
    res = {
        'file': os.path.basename(path), 'dur': round(len(y) / sr, 2), 'sr': sr,
        'f0_med': round(float(np.median(f)), 1) if len(f) else 0, 'f0_std_st': round(float(np.std(st)), 2),
        'mos': round(mos(y, sr), 2),
    }
    if expected:
        hyp = transcribe(path, lang)
        res['wer'] = round(jiwer.wer(norm(expected), norm(hyp)), 3)
        res['heard'] = hyp
    return res


if __name__ == '__main__':
    lang = sys.argv[1]
    args = sys.argv[2:]
    i = 0
    while i < len(args):
        wav = args[i]
        txt = args[i + 1] if i + 1 < len(args) and not args[i + 1].lower().endswith('.wav') else None
        i += 2 if txt else 1
        print(analyze(wav, lang, txt), flush=True)
