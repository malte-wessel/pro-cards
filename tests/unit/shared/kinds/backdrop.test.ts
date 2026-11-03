import { afterEach, describe, expect, it, vi } from "vitest";
import { updateBackdrop } from "../../../../src/shared/kinds/backdrop.ts";
import type { RenderCtx } from "../../../../src/shared/entity/model.ts";

const ctx = { hass: undefined } as unknown as RenderCtx;
const setup = () => {
  const body = document.createElement("div");
  document.body.appendChild(body);
  const srcs = () => [...body.querySelectorAll(".pback > img")].map((i) => i.getAttribute("src"));
  const loaded = (src: string) =>
    body.querySelector(`img[src="${src}"]`)!.dispatchEvent(new Event("load"));
  return { body, srcs, loaded };
};

describe("the picture behind a poster", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("fades a new picture in over the one before, which then goes", () => {
    vi.useFakeTimers();
    const { body, srcs, loaded } = setup();
    updateBackdrop(body, ctx, "/a.jpg", null);
    updateBackdrop(body, ctx, "/b.jpg", null);
    expect(srcs()).toEqual(["/a.jpg", "/b.jpg"]);
    loaded("/b.jpg");
    vi.advanceTimersByTime(800);
    expect(srcs()).toEqual(["/b.jpg"]);
  });

  it("never leaves the layer empty when pictures change faster than a fade", () => {
    vi.useFakeTimers();
    const { body, srcs, loaded } = setup();
    updateBackdrop(body, ctx, "/a.jpg", null);
    updateBackdrop(body, ctx, "/b.jpg", null);
    loaded("/b.jpg");
    vi.advanceTimersByTime(100);
    updateBackdrop(body, ctx, "/c.jpg", null);
    loaded("/c.jpg");
    // b's fade ends: what was under b goes, c still fades in over it
    vi.advanceTimersByTime(700);
    expect(srcs()).toEqual(["/b.jpg", "/c.jpg"]);
    vi.advanceTimersByTime(200);
    expect(srcs()).toEqual(["/c.jpg"]);
  });
});
