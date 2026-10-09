"""Chatterbox-TTS-Indonesian (Apache-2.0) with the designed male timbre as audio prompt.
Usage:
  cb_tts.py test <ref.wav> [exaggeration cfg_weight temperature]           -> cache/voice/v2/cand_cb_<i>.wav
  cb_tts.py lines <ref.wav> <lines.json> <outdir> [takes]                  -> <outdir>/<id>_t<k>.wav
"""
import json
import os
import sys
import torch
import torchaudio

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.environ.setdefault('HF_HOME', os.path.join(ROOT, '.hf'))
from chatterbox.tts import ChatterboxTTS  # noqa: E402
from huggingface_hub import hf_hub_download  # noqa: E402
from safetensors.torch import load_file  # noqa: E402

TESTS = [
    'Tiga akun TikTok. Satu sistem, yang bekerja otomatis.',
    'Setiap video dicek dulu, jadi tidak ada konten yang terunggah dua kali.',
    'Dan saat stok mulai menipis, sistem langsung mengirim peringatan.',
]


def load():
    model = ChatterboxTTS.from_pretrained(device='cuda')
    ckpt = hf_hub_download(repo_id='grandhigh/Chatterbox-TTS-Indonesian', filename='t3_cfg.safetensors')
    model.t3.load_state_dict(load_file(ckpt, device='cpu'))
    torch.cuda.empty_cache()
    return model


def main():
    mode, ref = sys.argv[1], sys.argv[2]
    model = load()
    if mode == 'test':
        ex, cfg, temp = (float(x) for x in (sys.argv[3:6] if len(sys.argv) > 5 else (0.5, 0.5, 0.8)))
        tag = sys.argv[6] if len(sys.argv) > 6 else 'cb'
        for i, t in enumerate(TESTS):
            torch.manual_seed(11)
            wav = model.generate(t, audio_prompt_path=ref, exaggeration=ex, cfg_weight=cfg, temperature=temp)
            torchaudio.save(os.path.join(ROOT, 'cache', 'voice', 'v2', f'cand_{tag}_{i}.wav'), wav.cpu(), model.sr)
    else:
        lines = json.load(open(sys.argv[3], encoding='utf-8'))
        outdir = sys.argv[4]
        takes = int(sys.argv[5]) if len(sys.argv) > 5 else 3
        os.makedirs(outdir, exist_ok=True)
        for ln in lines:
            for k in range(takes):
                path = os.path.join(outdir, f"{ln['id']}_t{k}.wav")
                if os.path.exists(path):
                    continue
                torch.manual_seed(1000 + 17 * k + hash(ln['id']) % 997)
                wav = model.generate(ln['say'], audio_prompt_path=ref, exaggeration=ln.get('ex', 0.5),
                                     cfg_weight=ln.get('cfg', 0.5), temperature=ln.get('temp', 0.8))
                torchaudio.save(path, wav.cpu(), model.sr)
                print('take', path, flush=True)
    print('done')


if __name__ == '__main__':
    main()
