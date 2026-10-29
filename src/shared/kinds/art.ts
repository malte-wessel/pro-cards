// The main colour of a picture (cover art), read from the image once: drawn small on a canvas,
// its pixels weighted by how colourful they are, the result held to a lightness the theme's text
// reads against. Only same-origin images (Home Assistant serves media art through its own proxy)
// and data: URIs can be read; any other one has no colour. Kept per URL; `onReady` runs once the
// image has loaded, so the card draws again with the colour.

type Entry = string | null | "pending";
const cache = new Map<string, Entry>();
const waiting = new Map<string, Set<() => void>>();

const readable = (url: string) => {
  if (url.startsWith("data:")) return true;
  try {
    return new URL(url, location.href).origin === location.origin;
  } catch {
    return false;
  }
};

// the colour of the pixels, weighted by their saturation (a grey cover gives none)
export const mainColor = (data: Uint8ClampedArray): string | null => {
  let r = 0,
    g = 0,
    b = 0,
    w = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const max = Math.max(data[i], data[i + 1], data[i + 2]),
      min = Math.min(data[i], data[i + 1], data[i + 2]);
    const sat = max === 0 ? 0 : (max - min) / max;
    const weight = sat * sat + 0.01;
    r += data[i] * weight;
    g += data[i + 1] * weight;
    b += data[i + 2] * weight;
    w += weight;
  }
  if (w < 1) return null;
  return toReadable(r / w, g / w, b / w);
};

// an RGB colour moved to a lightness between 35 % and 60 % (HSL), its hue and saturation kept
const toReadable = (r: number, g: number, b: number) => {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb),
    min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  if (d < 0.08) return null;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rr) h = ((gg - bb) / d) % 6;
  else if (max === gg) h = (bb - rr) / d + 2;
  else h = (rr - gg) / d + 4;
  h = Math.round(h * 60 + 360) % 360;
  const L = Math.min(0.6, Math.max(0.35, l));
  return `hsl(${h}, ${Math.round(Math.max(0.35, s) * 100)}%, ${Math.round(L * 100)}%)`;
};

export const artColor = (url: string | null, onReady: () => void): string | null => {
  if (!url) return null;
  const known = cache.get(url);
  if (known === "pending") {
    waiting.get(url)?.add(onReady);
    return null;
  }
  if (known !== undefined) return known;
  if (!readable(url) || typeof Image === "undefined") {
    cache.set(url, null);
    return null;
  }
  cache.set(url, "pending");
  waiting.set(url, new Set([onReady]));
  const img = new Image();
  const done = (color: string | null) => {
    cache.set(url, color);
    for (const fn of waiting.get(url) ?? []) fn();
    waiting.delete(url);
  };
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 24;
      const g = canvas.getContext("2d");
      if (!g) return done(null);
      g.drawImage(img, 0, 0, 24, 24);
      done(mainColor(g.getImageData(0, 0, 24, 24).data));
    } catch {
      done(null);
    }
  };
  img.onerror = () => done(null);
  img.src = url;
  return null;
};
