ICON_DIR="icons"
STICKER_DIR="stickers"

mkdir -p "$STICKER_DIR"

find "$ICON_DIR" -maxdepth 1 -type f -print0 | while IFS= read -r -d '' file; do
    name=$(basename "$file")
    ext="${name##*.}"
    base="${name%.*}"

    # Handle files with no extension
    if [ "$base" = "$name" ]; then
        ext=""
    else
        ext=$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')
    fi

    # Convert base name to snake_case
    snake=$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g; s/_\+/_/g; s/^_//; s/_$//')

    # Rename in-place
    new_name="$ICON_DIR/${snake}${ext:+.${ext}}"
    if [ "$file" != "$new_name" ]; then
        mv -n -- "$file" "$new_name"
    fi

    # Generate sticker
    output_name="${snake}-sticker${ext:+.${ext}}"
		contour -x 0 -y 0 -r 0 -h 0 -m recolor -o transparent "$new_name" "$STICKER_DIR/$output_name" 
done
