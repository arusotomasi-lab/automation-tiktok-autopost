"""Step 1 of the voice: design an ORIGINAL generic male timbre from a text description (Qwen3-TTS VoiceDesign).
No real person is referenced. Output: cache/voice/v2/ref_male_{k}.wav (+ .txt transcript) used as a timbre reference.
"""
import os
import sys
import numpy as np
import soundfile as sf
import torch

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.environ.setdefault('HF_HOME', os.path.join(ROOT, '.hf'))
OUT = os.path.join(ROOT, 'cache', 'voice', 'v2')
os.makedirs(OUT, exist_ok=True)
from qwen_tts import Qwen3TTSModel  # noqa: E402

INSTRUCT = ("A male voice-over narrator in his early thirties. Medium-low pitch, warm and clear timbre, confident and "
            "articulate, calm but powerful, modern premium technology commercial delivery. Natural, not exaggerated, "
            "close-mic studio recording with no background noise.")
TEXT = ("Every great system starts with a simple idea. Prepare your content once, and let the automation handle the rest, "
        "every single day, with precision and calm confidence.")

model = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', device_map='cuda:0', dtype=torch.bfloat16)
for k in range(int(sys.argv[1]) if len(sys.argv) > 1 else 4):
    torch.manual_seed(100 + k)
    wavs, sr = model.generate_voice_design(text=TEXT, language='English', instruct=INSTRUCT)
    path = os.path.join(OUT, f'ref_male_{k}.wav')
    sf.write(path, wavs[0], sr)
    with open(path.replace('.wav', '.txt'), 'w', encoding='utf-8') as f:
        f.write(TEXT)
    print('ref', k, path, f'{len(wavs[0]) / sr:.2f}s', sr)
