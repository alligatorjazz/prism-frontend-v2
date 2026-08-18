#!/usr/bin/env bash

set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <image_file>"
    exit 1
fi

input="$1"

if [ ! -f "$input" ]; then
    echo "Error: File not found: $input" >&2
    exit 1
fi

if command -v magick >/dev/null 2>&1; then
    convert_cmd="magick"
elif command -v convert >/dev/null 2>&1; then
    convert_cmd="convert"
else
    echo "Error: ImageMagick not found (need 'magick' or 'convert')" >&2
    exit 1
fi

base="${input%.*}"
ext="${input##*.}"

names=(
    activist-aqua
    youth-yellow-1
    youth-yellow-2
    youth-yellow-3
    rainbow-red
    rainbow-orange
    rainbow-yellow
    rainbow-green
    rainbow-blue
    rainbow-purple
    bold-black
    witty-white
)

hexes=(
    "#51c0a7"
    "#ffe09d"
    "#ffc03a"
    "#eba000"
    "#d02c28"
    "#f19221"
    "#fbed1f"
    "#74bf44"
    "#07a8df"
    "#854e9e"
    "#000000"
    "#ffffff"
)

for i in "${!names[@]}"; do
    output="${base}-${names[$i]}.${ext}"
    $convert_cmd "$input" -fill "${hexes[$i]}" -colorize 100% "$output"
    echo "Created: $output"
done

