import { describe, it, expect } from "vitest";
import { fireAction, fireEvent, fireHaptic, registerCard } from "../../../src/shared/card.ts";

const listen = (el: EventTarget, type: string) => {
  const seen: CustomEvent[] = [];
  el.addEventListener(type, (ev) => seen.push(ev as CustomEvent));
  return seen;
};

describe("card helpers", () => {
  it("fires composed, bubbling events Home Assistant listens for", () => {
    const outer = document.createElement("div");
    const el = document.createElement("span");
    outer.appendChild(el);
    const seen = listen(outer, "x");
    fireEvent(el, "x", { a: 1 });
    expect(seen.length).toBe(1);
    expect(seen[0].detail).toEqual({ a: 1 });
    expect(seen[0].bubbles).toBe(true);
    expect(seen[0].composed).toBe(true);
  });
  it("hands an action to HA in the shape handleAction expects", () => {
    const el = document.createElement("div");
    const seen = listen(el, "hass-action");
    const action = { action: "perform-action", perform_action: "light.turn_on", data: { x: 1 } };
    fireAction(el, "light.a", action, "hold");
    expect(seen[0].detail).toEqual({
      config: { entity: "light.a", hold_action: action },
      action: "hold",
    });
    const haptics = listen(el, "haptic");
    fireHaptic(el);
    fireHaptic(el, "success");
    expect(haptics.map((e) => e.detail)).toEqual(["light", "success"]);
  });
  it("registers the element and its card picker entry", () => {
    class T extends HTMLElement {
      static cardType = "test-register-card";
    }
    registerCard(T, { name: "T", description: "d" });
    expect(customElements.get("test-register-card")).toBe(T);
    expect(window.customCards?.at(-1)).toEqual({
      type: "test-register-card",
      name: "T",
      description: "d",
      preview: true,
    });
  });
});
