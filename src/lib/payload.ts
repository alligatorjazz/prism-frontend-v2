import urlJoin from "url-join";
import { backendUrl } from "../api";
import type { Media, ThemeColor } from "../inbox/payload-types";
import type { ImageMetadata, UnresolvedImageTransform } from "astro";
export function processMedia(
  media: string | Media,
  override?: {
    width?: number;
    height?: number;
    format: ImageMetadata["format"];
  },
): {
  src: string;
  width: number;
  height: number;
  format: string;
  alt: string | null;
} {
  return typeof media === "string"
    ? {
        src: media,
        width: override?.width ?? 500,
        height: override?.height ?? 500,
        format: override?.format ?? "webp",
        alt: null,
      }
    : {
        src: media.url?.startsWith("/api")
          ? (urlJoin(backendUrl, media.url) ?? "/image-not-found")
          : (media.url ?? "/image-not-found"),
        width: media.width ?? override?.width ?? 500,
        height: media.height ?? override?.height ?? 500,
        format: override?.format ?? "webp",
        alt: media.alt,
      };
}

export function processColor(color?: string | ThemeColor | null) {
  if (!color) {
    return null;
  }
  return typeof color === "string" ? color : color.value;
}
