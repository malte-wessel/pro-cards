// Mode "arc": a half-circle gauge with the zones as segments and the value in the middle.
import { t } from "../../shared/i18n.ts";
import type { IlluminanceHost } from "../config.ts";
import { posOf, zoneOf } from "../zones.ts";
import { fmtLx, pillEl } from "./plot.ts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const renderArc = (card: IlluminanceHost, body: HTMLElement, v: number | null) => {
  const cfg = card._config,
    zones = cfg.zonesList;
  const W = 300,
    H = 150,
    cx = 150,
    cy = 116,
    r = 86,
    sw = 13,
    gap = 2.5 / r;
  const pt = (f: number, rad = r): [number, number] => {
    const th = Math.PI * (1 - f);
    return [cx + rad * Math.cos(th), cy - rad * Math.sin(th)];
  };
  let html = "";
  let lo = 0;
  const labels: { f: number; text: string }[] = [];
  zones.forEach((z, i) => {
    const hi = i === zones.length - 1 ? 1 : posOf(z.max, cfg.min_lx, cfg.max_lx);
    const a = i === 0 ? lo : lo + gap / 2,
      b = i === zones.length - 1 ? hi : hi - gap / 2;
    if (b > a) {
      const [x1, y1] = pt(a),
        [x2, y2] = pt(b);
      html += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}" stroke="${z.css}" stroke-width="${sw}" fill="none" opacity=".55"/>`;
    }
    labels.push({ f: (lo + hi) / 2, text: z.label });
    lo = hi;
  });
  labels.forEach((l) => {
    const [x, y] = pt(l.f, r + 20);
    const anchor = l.f < 0.18 ? "end" : l.f > 0.82 ? "start" : "middle";
    html += `<text class="zl" x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="${anchor}">${esc(l.text.toUpperCase())}</text>`;
  });
  if (v !== null) {
    const [mx, my] = pt(posOf(v, cfg.min_lx, cfg.max_lx));
    html += `<circle class="mark" cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="6"/>`;
  }
  html += `<text class="bigv" x="${cx}" y="104" text-anchor="middle">${v === null ? "–" : fmtLx(card._hass, v)}</text>`;
  html += `<text class="unit" x="${cx}" y="130" text-anchor="middle">${esc(t(card._hass, "illuminance.lux"))}</text>`;
  body.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "arcwrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `-30 0 ${W + 60} ${H}`);
  svg.innerHTML = html;
  wrap.appendChild(svg);
  const z = v === null ? null : zoneOf(zones, v);
  if (z) wrap.appendChild(pillEl(z));
  body.appendChild(wrap);
};
