// The shell of a section: a title line (optional sub text on the right) above the content.
import { qs } from "../../shared/util.ts";

export const sectionShell = (title: string | null, withHead = !!title) => {
  const el = document.createElement("div");
  el.className = "wsec";
  const head = document.createElement("div");
  head.className = "whead";
  head.innerHTML = `<div class="wtitle"></div><div class="wsub"></div>`;
  qs(head, ".wtitle").textContent = title ?? "";
  if (withHead) el.appendChild(head);
  return el;
};
export const setTitle = (el: HTMLElement, title: string, sub = "") => {
  const t = el.querySelector(".wtitle");
  if (t) t.textContent = title;
  const s = el.querySelector(".wsub");
  if (s) s.textContent = sub;
};
export const emptyEl = (text: string) => {
  const d = document.createElement("div");
  d.className = "wempty";
  d.textContent = text;
  return d;
};
