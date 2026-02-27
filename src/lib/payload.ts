import type { Media, ThemeColor } from "../inbox/payload-types";
import type { ImageMetadata, UnresolvedImageTransform } from "astro";
export function processMedia(
  media: string | Media,
  override?: {
    width?: number;
    height?: number;
    format: ImageMetadata["format"];
  },
): UnresolvedImageTransform {
  return typeof media === "string"
    ? {
        src: media,
        width: override?.width ?? 500,
        height: override?.height ?? 500,
        format: override?.format ?? "webp",
      }
    : {
        src: media.url ?? "/image-not-found",
        width: media.width ?? override?.width ?? 500,
        height: media.height ?? override?.height ?? 500,
        format: override?.format ?? "webp",
      };
}

export function processColor(color?: string | ThemeColor | null) {
  if (!color) {
    return null;
  }
  return typeof color === "string" ? color : color.value;
}
