#!/usr/bin/env bash
# Render the Sweetardios "Lineage" title sequence to transparent + preview video.
#
#   1. lineage_video.py  -> RGBA PNG frame sequence
#   2. ffmpeg            -> transparent WebM (VP9/alpha)  — the overlay deliverable
#                        -> transparent MOV  (ProRes 4444) — for pro editors (AE/Premiere/CapCut)
#                        -> preview MP4 over Oxford Blue   — easy viewing / approval
#
# Requires: python3 (Pillow, numpy) and ffmpeg with libvpx-vp9 + prores_ks.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRAMES="${FRAMES_DIR:-/tmp/lineage_frames}"
OUT="$ROOT/public/video"
FPS=30
FFMPEG="${FFMPEG:-ffmpeg}"

mkdir -p "$OUT"

echo "==> [1/4] Rendering frames"
FRAMES_DIR="$FRAMES" python3 "$ROOT/scripts/lineage_video.py"

echo "==> [2/4] Encoding transparent WebM (VP9 / alpha)"
"$FFMPEG" -y -framerate $FPS -i "$FRAMES/f%05d.png" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 22 \
  -auto-alt-ref 0 -row-mt 1 -threads 8 \
  "$OUT/sweetardios-lineage.webm"

echo "==> [3/4] Encoding transparent MOV (ProRes 4444 / alpha)"
"$FFMPEG" -y -framerate $FPS -i "$FRAMES/f%05d.png" \
  -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le -alpha_bits 16 -qscale:v 9 \
  "$OUT/sweetardios-lineage.mov"

echo "==> [4/4] Encoding preview MP4 (composited over Oxford Blue)"
"$FFMPEG" -y -framerate $FPS -i "$FRAMES/f%05d.png" \
  -f lavfi -i "color=c=0x070F34:s=1080x1080:r=$FPS" \
  -filter_complex "[1][0]overlay=shortest=1,format=yuv420p" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart \
  "$OUT/sweetardios-lineage-preview.mp4"

echo "==> Done. Outputs in $OUT"
ls -lh "$OUT"
