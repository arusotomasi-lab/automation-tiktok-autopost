#!/usr/bin/env bash
# Recreates the gitignored local audio toolchain (run from promo-video/).
set -e
mkdir -p .tools/voices && cd .tools
[ -f uv/uv.exe ] || { curl -sSL -o uv.zip https://github.com/astral-sh/uv/releases/download/0.9.5/uv-x86_64-pc-windows-msvc.zip && unzip -oq uv.zip -d uv; }
[ -f piper/piper.exe ] || { curl -sSL -o piper.zip https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip && unzip -oq piper.zip -d .; }
for f in id_ID-news_tts-medium.onnx id_ID-news_tts-medium.onnx.json; do
  [ -s voices/$f ] && [ $(wc -c < voices/$f) -gt 1000 ] || curl -sSL -o voices/$f "https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/news_tts/medium/$f"
done
cd ..
export UV_PYTHON_INSTALL_DIR="$PWD/.tools/python" UV_CACHE_DIR="$PWD/.tools/uv-cache"
[ -f .venv/Scripts/python.exe ] || .tools/uv/uv.exe venv --python 3.11 .venv
.tools/uv/uv.exe pip install --python .venv/Scripts/python.exe numpy==2.2.6 scipy==1.15.3 soundfile==0.13.1 pyworld==0.3.5
