// The flow band: the animated field of the chosen style and the direction chip. The field's DOM
// is rebuilt only when its geometry changes (style, density, size) or the waves moved enough to
// be worth a redraw; a speed change only scales the playback rate of the running animations.
import type { Density, FlowStyle } from "../constants.ts";
import {
  amplitude,
  arrowRotation,
  baseDuration,
  fieldKey,
  fieldRotation,
  fieldSize,
  fieldSpec,
  gustCount,
  gustDuration,
  needsRedraw,
  rateOf,
  type FieldSpec,
  type Lane,
  type Streak,
} from "../flow.ts";
import { arrowIcon } from "./lead.ts";

const SVG = "http://www.w3.org/2000/svg";

export interface BandState {
  style: FlowStyle;
  density: Density;
  bearing: number | null;
  kmh: number;
  gustKmh: number | null;
  chip: string | null;
}

export const buildBand = (kind: "bg" | "band") => {
  const band = document.createElement("div");
  band.className = `wflow ${kind}`;
  const field = document.createElement("div");
  field.className = "field";
  band.appendChild(field);
  const chip = document.createElement("div");
  chip.className = "chip";
  chip.appendChild(arrowIcon());
  chip.appendChild(document.createElement("span"));
  band.appendChild(chip);
  return band;
};

const vars = (el: HTMLElement | SVGElement, v: Record<string, string | number>) => {
  for (const [k, val] of Object.entries(v)) el.style.setProperty(k, String(val));
};
const lanesEl = (lanes: Lane[], cls: "pt" | "fa") => {
  const frag = document.createDocumentFragment();
  for (const l of lanes) {
    const lane = document.createElement("div");
    lane.className = "lane";
    vars(lane, { "--p": `path('${l.d}')`, "--k": l.parts[0]?.k ?? 1 });
    for (const p of l.parts) {
      const i = document.createElement("i");
      i.className = cls;
      vars(i, { "--p0": p.p0, "--o": p.o });
      if (cls === "pt") {
        i.style.width = `${p.s}px`;
        i.style.height = `${p.s}px`;
      } else {
        i.style.width = `${p.s}px`;
        vars(i, { "--s": p.k });
      }
      lane.appendChild(i);
    }
    frag.appendChild(lane);
  }
  return frag;
};
const streaksEl = (streaks: Streak[]) => {
  const frag = document.createDocumentFragment();
  for (const s of streaks) {
    const i = document.createElement("i");
    i.className = "gs";
    vars(i, { "--p": `path('${s.d}')`, "--p0": s.p0 });
    i.style.width = `${s.w}px`;
    frag.appendChild(i);
  }
  return frag;
};
const svgEl = (size: number) => {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "abs");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  return svg;
};
const pathEl = (cls: string, d: string, v: Record<string, string | number>) => {
  const p = document.createElementNS(SVG, "path");
  p.setAttribute("class", cls);
  p.setAttribute("pathLength", "100");
  p.setAttribute("d", d);
  vars(p, v);
  return p;
};

export const buildField = (spec: FieldSpec) => {
  const frag = document.createDocumentFragment();
  if (spec.style === "lines") {
    const svg = svgEl(spec.size);
    for (const l of spec.lines)
      svg.appendChild(
        pathEl("sl", l.d, {
          "stroke-width": l.w,
          opacity: l.o,
          "stroke-dasharray": `${l.dash} 200`,
          "--from": l.dash,
          "--off": l.dash - l.p0 * (l.dash + 100),
          "--k": l.k,
          "--p0": l.p0,
        }),
      );
    frag.appendChild(svg);
  } else if (spec.style === "swoosh") {
    const svg = svgEl(spec.size);
    for (const s of spec.strokes)
      svg.appendChild(
        pathEl("swp", s.d, {
          "stroke-width": s.w,
          "--o": s.o,
          "--off": 34 - s.p0 * 134,
          "--k": s.k,
          "--p0": s.p0,
        }),
      );
    frag.appendChild(svg);
  } else frag.appendChild(lanesEl(spec.lanes, spec.style === "dots" ? "pt" : "fa"));
  frag.appendChild(streaksEl(spec.streaks));
  return frag;
};

// scales every running animation under `root` (the field's particles, the lead's) so a speed
// change is seen at once without restarting or jumping; the rate is kept on the element
export const setRate = (root: HTMLElement, rate: number) => {
  const r = rate.toFixed(3);
  if (root.dataset.rate === r) return;
  root.dataset.rate = r;
  if (typeof root.getAnimations !== "function") return;
  for (const a of root.getAnimations({ subtree: true })) a.playbackRate = rate;
};

export const updateBand = (band: HTMLElement, s: BandState) => {
  const field = band.querySelector<HTMLElement>(".field");
  const chip = band.querySelector<HTMLElement>(".chip span");
  if (!field || !chip) return;
  const w = band.clientWidth,
    h = band.clientHeight;
  // not laid out yet: the resize observer renders again once the band has a size
  if (w > 0 && h > 0) {
    const size = fieldSize(w, h);
    const key = fieldKey(s.style, s.density, size);
    const waves = { amp: amplitude(s.kmh, s.gustKmh), gusts: gustCount(s.gustKmh) };
    const built =
      band.dataset.amp === undefined
        ? null
        : { amp: Number(band.dataset.amp), gusts: Number(band.dataset.gusts) };
    if (band.dataset.key !== key || needsRedraw(built, waves)) {
      field.replaceChildren(
        buildField(fieldSpec(s.style, s.density, size, waves.amp, s.gustKmh, s.kmh)),
      );
      field.style.setProperty("--size", `${size}px`);
      // the durations of the field as built; later speeds scale the playback rate instead
      band.style.setProperty("--dur", `${baseDuration(s.kmh).toFixed(3)}s`);
      band.style.setProperty("--gdur", `${gustDuration(s.gustKmh).toFixed(3)}s`);
      band.dataset.key = key;
      band.dataset.amp = String(waves.amp);
      band.dataset.gusts = String(waves.gusts);
      band.dataset.kmh = String(s.kmh);
      delete band.dataset.rate;
    }
  }
  if (band.dataset.kmh !== undefined) setRate(band, rateOf(s.kmh, Number(band.dataset.kmh)));
  band.style.setProperty("--rot", `${s.bearing === null ? 0 : fieldRotation(s.bearing)}deg`);
  band.style.setProperty("--arrow", `${s.bearing === null ? 0 : arrowRotation(s.bearing)}deg`);
  band.classList.toggle("nodir", s.bearing === null);
  chip.textContent = s.chip ?? "";
};
