"""Voice audition: Qwen3-TTS options on Indonesian test lines -> cache/voice/v2/cand_<engine>_<i>.wav"""
import os
import sys
import soundfile as sf
import torch

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.environ.setdefault('HF_HOME', os.path.join(ROOT, '.hf'))
OUT = os.path.join(ROOT, 'cache', 'voice', 'v2')
from qwen_tts import Qwen3TTSModel  # noqa: E402

TESTS = [
    'Tiga akun TikTok. Satu sistem, yang bekerja otomatis.',
    'Setiap video dicek dulu, jadi tidak ada konten yang terunggah dua kali.',
    'Dan saat stok mulai menipis, sistem langsung mengirim peringatan.',
]
REF = os.path.join(OUT, sys.argv[2] if len(sys.argv) > 2 else 'ref_male_2.wav')
which = sys.argv[1]

if which == 'qid':  # Indonesian fine-tune, its own speaker
    m = Qwen3TTSModel.from_pretrained('alkhrzmy/qwen3-tts-0.6b-indonesian', device_map='cuda:0', dtype=torch.bfloat16)
    for i, t in enumerate(TESTS):
        torch.manual_seed(7)
        w, sr = m.generate_custom_voice(text=t, speaker='indonesian_speaker', language='auto')
        sf.write(os.path.join(OUT, f'cand_qid_{i}.wav'), w[0], sr)
elif which in ('qbase', 'qbase06'):  # multilingual base, cloning the designed male timbre
    name = 'Qwen/Qwen3-TTS-12Hz-1.7B-Base' if which == 'qbase' else 'Qwen/Qwen3-TTS-12Hz-0.6B-Base'
    m = Qwen3TTSModel.from_pretrained(name, device_map='cuda:0', dtype=torch.bfloat16)
    ref_text = open(REF.replace('.wav', '.txt'), encoding='utf-8').read()
    for i, t in enumerate(TESTS):
        torch.manual_seed(7)
        w, sr = m.generate_voice_clone(text=t, language='auto', ref_audio=REF, ref_text=ref_text)
        sf.write(os.path.join(OUT, f'cand_{which}_{i}.wav'), w[0], sr)
print('done', which)
