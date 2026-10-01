// The rain band: drops, ripples or the gauge behind the texts, and the chip with today's total.
// The field is rebuilt only when rain starts or stops or the drop count moves by a quarter; a
// rate change scales the playback rate of the running animations, the slant and the water
// level are CSS variables updated in place.
import { el, setRate, vars } from "../../shared/flow/dom.ts";
import type { RainStyle } from "../constants.ts";
import {
  countOf,
  fallOf,
  fallRate,
  isWet,
  levelOf,
  needsRebuild,
  rainSpec,
  tanOf,
  waveAmp,
  wavePathD,
  wavePeriod,
  type Drop,
  type RainSpec,
  type Ripple,
} from "../rain.ts";
import { waterEl } from "./lead.ts";

export interface RainBand {
  style: RainStyle;
  rate: number;
  today: number | null;
  slant: number; // degrees from vertical, + to the right
  chip: string | null;
}

export const fieldEl = () => {
  const field = document.createElement("div");
  field.className = "rfield";
  return field;
};

const dropsEl = (drops: Drop[]) => {
  const frag = document.createDocumentFragment();
  for (const d of drops) {
    const v = { "--x": `${d.x}%`, "--k": d.k, "--p0": d.p0 };
    frag.appendChild(el("dr", { ...v, "--w": `${d.w}px`, "--h": `${d.h}px`, "--o": d.o }));
    if (d.splash) frag.appendChild(el("sp", v));
  }
  return frag;
};
const ripplesEl = (ripples: Ripple[]) => {
  const frag = document.createDocumentFragment();
  for (const r of ripples) {
    const v = {
      "--x": `${r.x}%`,
      "--y": `${r.y}%`,
      "--w": `${r.w}px`,
      "--h": `${r.h}px`,
      "--dur": `${r.dur}s`,
    };
    frag.appendChild(el("rp", { ...v, "--p0": r.p0 }));
    frag.appendChild(el("rp second", { ...v, "--p0": (r.p0 + 0.25 / r.dur) % 1 }));
  }
  return frag;
};

export const buildField = (spec: RainSpec) => {
  const frag = document.createDocumentFragment();
  if (spec.style === "ripples") frag.appendChild(ripplesEl(spec.ripples));
  else {
    if (spec.style === "fill") frag.appendChild(waterEl(spec.amp));
    frag.appendChild(dropsEl(spec.drops));
  }
  return frag;
};

export const updateBand = (band: HTMLElement, s: RainBand) => {
  const field = band.querySelector<HTMLElement>(".rfield");
  const chip = band.querySelector<HTMLElement>(".chip span");
  if (!field || !chip) return;
  const now = { n: countOf(s.style, s.rate), wet: isWet(s.rate) };
  const built =
    band.dataset.n === undefined
      ? null
      : { n: Number(band.dataset.n), wet: band.dataset.wet === "1" };
  if (band.dataset.style !== s.style || needsRebuild(built, now)) {
    field.replaceChildren(buildField(rainSpec(s.style, s.rate, s.today)));
    // the durations of the field as built; later rates scale the playback rate instead
    band.style.setProperty("--fall", `${fallOf(s.rate).toFixed(3)}s`);
    band.style.setProperty("--wp", `${wavePeriod(s.rate).toFixed(2)}s`);
    band.dataset.style = s.style;
    band.dataset.n = String(now.n);
    band.dataset.wet = now.wet ? "1" : "0";
    band.dataset.rate0 = String(s.rate);
    band.dataset.amp = String(Math.round(waveAmp(s.rate) * 2) / 2);
    delete band.dataset.rate;
  }
  setRate(band, fallRate(s.rate, Number(band.dataset.rate0)));
  const level = levelOf(s.today);
  const h = band.clientHeight;
  vars(band, {
    "--t": tanOf(s.slant).toFixed(4),
    "--sl": `${(-s.slant).toFixed(2)}deg`,
    "--lv": `${(level * 100).toFixed(1)}%`,
  });
  // not laid out yet: the resize observer renders again once the band has a size
  if (h > 0)
    vars(band, {
      "--H": `${s.style === "fill" ? Math.round(h * (1 - level)) : h}px`,
      "--sb": s.style === "fill" ? `calc(${(level * 100).toFixed(1)}% + 4px)` : "0px",
    });
  if (s.style === "fill") {
    const amp = Math.round(waveAmp(s.rate) * 2) / 2;
    if (band.dataset.amp !== String(amp)) {
      band.querySelector(".wtop path")?.setAttribute("d", wavePathD(amp));
      band.dataset.amp = String(amp);
    }
    band.style.setProperty("--wa", `${amp}px`);
  }
  band.classList.toggle("dry", !now.wet);
  band.classList.toggle("notoday", s.chip === null);
  chip.textContent = s.chip ?? "";
};
