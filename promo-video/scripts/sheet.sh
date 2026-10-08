#!/usr/bin/env bash
# Usage: scripts/sheet.sh out.jpg f1 f2 ... (6 stills from cache/stills) -> 3x2 contact sheet
FF=node_modules/ffmpeg-static/ffmpeg.exe
out=$1; shift
args=(); for f in "$@"; do args+=(-i "cache/stills/f$(printf %04d $f).jpg"); done
n=$#
$FF -hide_banner -loglevel error -y "${args[@]}" -filter_complex "xstack=inputs=$n:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0:fill=black,scale=1200:-1" "cache/stills/$out"
