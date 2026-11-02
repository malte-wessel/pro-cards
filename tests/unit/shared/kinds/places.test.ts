import { describe, it, expect } from "vitest";
import {
  GONE_KEYS,
  goneKey,
  goneVariant,
  IMAGE_BLUR,
  mergePlace,
  parseIcon,
  parseVisual,
  resolvePlaces,
  type IconPlace,
  type VisualPlace,
} from "../../../../src/shared/kinds/places.ts";

const icon = (raw: unknown, rule = false) => parseIcon(raw, "icon", rule);
const visual = (raw: unknown, rule = false) => parseVisual(raw, "visual", rule);

describe("parseIcon", () => {
  it("reads nothing, false, a name or the thing with its options", () => {
    expect(icon(undefined)).toBeUndefined();
    expect(icon(null)).toBeUndefined();
    expect(icon(false)).toBe(false);
    // a string is always the icon's name, even a thing's: it makes the place an icon
    expect(icon("mdi:sofa")).toEqual({ type: "icon", name: "mdi:sofa" });
    expect(icon("flow")).toEqual({ type: "icon", name: "flow" });
    // an object with a name and no type too
    expect(icon({ name: "mdi:sofa", ring: true })).toEqual({
      type: "icon",
      name: "mdi:sofa",
      ring: true,
    });
    expect(icon({ type: "icon", name: "mdi:sofa", ring: true, style: "plain" })).toEqual({
      type: "icon",
      name: "mdi:sofa",
      ring: true,
      style: "plain",
    });
    expect(icon({ type: "image", src: "person.malte", style: "circle" })).toEqual({
      type: "image",
      src: "person.malte",
      style: "circle",
    });
    expect(icon({ type: "flow", style: "swoosh" })).toEqual({ type: "flow", style: "swoosh" });
    expect(icon({ type: "flow", style: "ripples" })).toEqual({ type: "flow", style: "ripples" });
    // without a type: options for whatever the place draws
    expect(icon({ ring: true })).toEqual({ ring: true });
    expect(icon({ src: "/a.png", style: "plain" })).toEqual({ src: "/a.png", style: "plain" });
    // an option left undefined is no option
    expect(icon({ type: "icon", ring: undefined })).toEqual({ type: "icon" });
  });

  it("names what is wrong", () => {
    expect(() => icon("")).toThrow("icon: an icon's name must not be empty");
    expect(() => icon(3)).toThrow("icon takes an icon's name, { type, … } or false");
    expect(() => icon(["mdi:x"])).toThrow("icon takes an icon's name");
    expect(() => icon(true)).toThrow("icon takes an icon's name");
    expect(() => icon({ type: "glow" })).toThrow(
      'icon: type must be one of icon, image, flow, not "glow"',
    );
    expect(() => icon({ type: "flow", ring: true })).toThrow(
      "icon: flow takes style, tap_action, hold_action, double_tap_action, badge, not ring",
    );
    expect(() => icon({ type: "icon", src: "/a.png" })).toThrow(
      "icon: icon takes name, ring, style, tap_action, hold_action, double_tap_action, badge, not src",
    );
    expect(() => icon({ blur: 4 })).toThrow(
      "icon: blur is no option here (name, ring, style, src, tap_action, hold_action, double_tap_action, badge)",
    );
    expect(() => icon({ type: "icon", ring: "yes" })).toThrow("icon: ring must be true or false");
    expect(() => icon({ type: "icon", name: "" })).toThrow("icon: name must be a text");
    expect(() => icon({ type: "image", src: 3 })).toThrow("icon: src must be a text");
    expect(() => icon({ type: "icon", style: "square" })).toThrow("icon: style must be one of");
    // a style of the right kind for the thing
    expect(() => icon({ type: "flow", style: "plain" })).toThrow("icon: flow's style is one of");
    expect(() => icon({ type: "icon", style: "dots" })).toThrow(
      "icon: icon's style is circle or plain",
    );
    expect(() => icon({ type: "image", style: "drops" })).toThrow(
      "icon: image's style is circle or plain",
    );
  });

  it("reads a rule's icon the same way", () => {
    expect(icon("mdi:fire", true)).toEqual({ type: "icon", name: "mdi:fire" });
    expect(icon({ type: "image", src: "/a.png", ring: true }, true)).toEqual({
      type: "image",
      src: "/a.png",
      ring: true,
    });
    expect(() => parseIcon(3, "rules[2].icon", true)).toThrow("rules[2].icon takes an icon's name");
  });

  it("takes the icon's own actions and its badge, a rule the badge only", () => {
    const tap = { action: "navigate", navigation_path: "/x" };
    // as written, on any icon: the card parses them
    expect(icon({ name: "mdi:x", tap_action: "toggle", hold_action: tap })).toEqual({
      type: "icon",
      name: "mdi:x",
      tap_action: "toggle",
      hold_action: tap,
    });
    expect(icon({ type: "flow", double_tap_action: "more-info", badge: false })).toEqual({
      type: "flow",
      double_tap_action: "more-info",
      badge: false,
    });
    expect(icon({ badge: { icon: "mdi:alert" } })).toEqual({ badge: { icon: "mdi:alert" } });
    // a rule changes the look, not what a tap does
    for (const k of ["tap_action", "hold_action", "double_tap_action"])
      expect(() => parseIcon({ [k]: "toggle" }, "rules[0].icon", true)).toThrow(
        `rules[0].icon: a rule sets no ${k} (it is the card's: a rule changes the look, not what a tap does)`,
      );
    expect(icon({ badge: false }, true)).toEqual({ badge: false });
    expect(icon({ name: "mdi:fire", badge: { icon: "mdi:alert" } }, true)).toEqual({
      type: "icon",
      name: "mdi:fire",
      badge: { icon: "mdi:alert" },
    });
  });
});

describe("parseVisual", () => {
  it("reads nothing, false, a thing's name or the thing with its options", () => {
    expect(visual(undefined)).toBeUndefined();
    expect(visual(null)).toBeUndefined();
    expect(visual(false)).toBe(false);
    for (const t of ["glow", "image", "flow", "sparkline", "columns", "strip", "bar", "gauge"])
      expect(visual(t)).toEqual({ type: t });
    for (const t of ["segments", "sun", "cover", "path", "line"])
      expect(visual(t)).toEqual({ type: t });
    expect(
      visual({ type: "image", src: "camera.garden", opacity: 0.4, tint: "blue", blur: 6 }),
    ).toEqual({ type: "image", src: "camera.garden", opacity: 0.4, tint: "blue", blur: 6 });
    expect(visual({ type: "flow", style: "lines" })).toEqual({ type: "flow", style: "lines" });
    expect(visual({ type: "flow", style: "fill" })).toEqual({ type: "flow", style: "fill" });
    expect(
      visual({
        type: "sparkline",
        hours: 6,
        bucket: 10,
        smoothing: 15,
        axis: true,
        src: "sensor.x",
      }),
    ).toEqual({
      type: "sparkline",
      hours: 6,
      bucket: 10,
      smoothing: 15,
      axis: true,
      src: "sensor.x",
    });
    expect(visual({ type: "columns", hours: "today", bucket: 60, axis: false })).toEqual({
      type: "columns",
      hours: "today",
      bucket: 60,
      axis: false,
    });
    expect(visual({ type: "strip", hours: 12, src: "sensor.x" })).toEqual({
      type: "strip",
      hours: 12,
      src: "sensor.x",
    });
    expect(visual({ type: "sun", hours: 48 })).toEqual({ type: "sun", hours: 48 });
    expect(() => visual("forecast")).toThrow("visual must be one of");
    // without a type: options for whatever the place draws
    expect(visual({ hours: 6 })).toEqual({ hours: 6 });
    expect(visual({ opacity: 0.5, blur: false })).toEqual({ opacity: 0.5, blur: 0 });
  });

  it("blurs by true, a number of px, or not by false", () => {
    const blur = (v: unknown) => (visual({ type: "image", blur: v }) as VisualPlace).blur;
    expect(blur(true)).toBe(IMAGE_BLUR);
    expect(blur(false)).toBe(0);
    expect(blur(0)).toBe(0);
    expect(blur(12)).toBe(12);
    for (const bad of [-1, "soft", Infinity])
      expect(() => blur(bad)).toThrow("visual: blur must be true, false or a number of px");
  });

  it("names what is wrong", () => {
    expect(() => visual("none")).toThrow("visual: none is false (no visual)");
    expect(() => visual("ring")).toThrow("visual must be one of glow, image, flow, cover");
    expect(() => visual("ring")).toThrow(/or false, not ring$/);
    expect(() => visual(3)).toThrow("visual takes a visual's name, { type, … } or false");
    expect(() => visual(true)).toThrow("visual takes a visual's name");
    expect(() => visual({ type: "ring" })).toThrow("visual: type must be one of glow, image");
    expect(() => visual({ type: "glow", opacity: 1 })).toThrow(
      "visual: glow takes no options, not opacity",
    );
    expect(() => visual({ type: "image", hours: 6 })).toThrow(
      "visual: image takes src, opacity, tint, blur, not hours",
    );
    expect(() => visual({ type: "strip", smoothing: 10 })).toThrow(
      "visual: strip takes hours, bucket, src, not smoothing",
    );
    expect(() => visual({ ring: true })).toThrow("visual: ring is no option here");
    expect(() => visual({ type: "image", opacity: 1.5 })).toThrow(
      "visual: opacity must be a number from 0 to 1",
    );
    expect(() => visual({ type: "image", opacity: "half" })).toThrow(
      "visual: opacity must be a number from 0 to 1",
    );
    expect(() => visual({ type: "image", tint: 3 })).toThrow("visual: tint must be a text");
    expect(() => visual({ type: "sparkline", axis: 1 })).toThrow(
      "visual: axis must be true or false",
    );
    for (const hours of [0, -2, "yesterday"])
      expect(() => visual({ type: "sparkline", hours })).toThrow(
        "visual: hours must be a number of hours or today",
      );
    expect(() => visual({ type: "sparkline", bucket: 2 })).toThrow(
      "visual: bucket must be a number of minutes, at least 5",
    );
    expect(() => visual({ type: "sparkline", smoothing: "1h" })).toThrow(
      "visual: smoothing must be a number of minutes, at least 5",
    );
    // a flow's style only
    expect(() => visual({ type: "flow", style: "plain" })).toThrow(
      "visual: flow's style is one of",
    );
    expect(() => visual({ style: "circle" })).toThrow("visual: flow's style is one of");
    expect(() => visual({ type: "flow", style: "sideways" })).toThrow(
      "visual: style must be one of",
    );
  });

  it("lets a rule change the look, never the history", () => {
    const rule = (raw: unknown) => parseVisual(raw, "rules[0].visual", true);
    expect(rule("glow")).toEqual({ type: "glow" });
    expect(rule(false)).toBe(false);
    expect(rule({ type: "image", src: "camera.garden", opacity: 0.5 })).toEqual({
      type: "image",
      src: "camera.garden",
      opacity: 0.5,
    });
    expect(rule({ type: "sparkline", axis: true })).toEqual({ type: "sparkline", axis: true });
    for (const k of ["hours", "bucket", "smoothing"])
      expect(() => rule({ type: "sparkline", [k]: 10 })).toThrow(
        `rules[0].visual: a rule sets no ${k} (it is the card's: a rule must not fetch history)`,
      );
    expect(() => rule({ hours: 6 })).toThrow("a rule sets no hours");
    expect(() => rule({ type: "sun", hours: 6 })).toThrow("a rule sets no hours");
    for (const type of ["sparkline", "columns", "strip"])
      expect(() => rule({ type, src: "sensor.x" })).toThrow(
        "rules[0].visual: a rule sets no src of a plot (it is the card's history)",
      );
    // the card's history is the card's to set
    expect(visual({ type: "sparkline", src: "sensor.x" })).toEqual({
      type: "sparkline",
      src: "sensor.x",
    });
  });
});

describe("mergePlace", () => {
  const glow: VisualPlace = { type: "glow" };
  const spark: VisualPlace = { type: "sparkline", hours: "today" };

  it("keeps the place below where nothing is written", () => {
    expect(mergePlace(spark, undefined)).toBe(spark);
    expect(mergePlace(false, undefined)).toBe(false);
    expect(mergePlace(undefined, undefined)).toBeUndefined();
  });

  it("empties the place with false", () => {
    expect(mergePlace(spark, false)).toBe(false);
    expect(mergePlace(undefined, false)).toBe(false);
  });

  it("replaces the thing with a thing of another type", () => {
    expect(mergePlace(spark, glow)).toEqual(glow);
    expect(mergePlace<VisualPlace>(spark, { type: "columns", axis: true })).toEqual({
      type: "columns",
      axis: true,
    });
    expect(mergePlace(false, glow)).toEqual(glow);
    expect(mergePlace(undefined, glow)).toEqual(glow);
  });

  it("merges options onto the same thing, or onto what the place draws", () => {
    expect(mergePlace<VisualPlace>(spark, { type: "sparkline", axis: true })).toEqual({
      type: "sparkline",
      hours: "today",
      axis: true,
    });
    expect(mergePlace<VisualPlace>(spark, { hours: 6 })).toEqual({ type: "sparkline", hours: 6 });
    expect(mergePlace<IconPlace>({ type: "image" }, { ring: true })).toEqual({
      type: "image",
      ring: true,
    });
    // options merge onto options
    expect(mergePlace<IconPlace>({ ring: true }, { name: "mdi:x" })).toEqual({
      ring: true,
      name: "mdi:x",
    });
    // a typed thing over options takes them
    expect(mergePlace<IconPlace>({ ring: true }, { type: "icon" })).toEqual({
      type: "icon",
      ring: true,
    });
  });

  it("merges options onto nothing as they are, and nothing onto false", () => {
    expect(mergePlace<VisualPlace>(undefined, { hours: 6 })).toEqual({ hours: 6 });
    expect(mergePlace<VisualPlace>(false, { hours: 6 })).toEqual({ hours: 6 });
  });
});

describe("resolvePlaces", () => {
  type Layer = { icon: IconPlace | false | undefined; visual: VisualPlace | false | undefined };
  const none: Layer = { icon: undefined, visual: undefined };
  const layer = (o: Partial<Layer>): Layer => ({ ...none, ...o });

  it("draws the icon and nothing else when no layer says anything", () => {
    expect(resolvePlaces([])).toEqual({ icon: { type: "icon" }, visual: false });
    expect(resolvePlaces([none, none])).toEqual({ icon: { type: "icon" }, visual: false });
  });

  it("merges the layers in order: the kind's, the group's, the card's, the rule's", () => {
    const kind = layer({ icon: { type: "image" }, visual: { type: "image", blur: IMAGE_BLUR } });
    const group = layer({ visual: { opacity: 0.5 } });
    const card = layer({ icon: { ring: true } });
    const rule = layer({ visual: { tint: "red" } });
    expect(resolvePlaces([kind, group, card, rule])).toEqual({
      icon: { type: "image", ring: true },
      visual: { type: "image", blur: IMAGE_BLUR, opacity: 0.5, tint: "red" },
    });
    // a later layer's thing replaces, its false empties
    expect(resolvePlaces([kind, layer({ visual: { type: "glow" } })]).visual).toEqual({
      type: "glow",
    });
    expect(resolvePlaces([kind, card, layer({ visual: false })]).visual).toBe(false);
    // a rule's thing over the card's false
    expect(
      resolvePlaces([kind, layer({ visual: false }), layer({ visual: { type: "glow" } })]).visual,
    ).toEqual({ type: "glow" });
  });

  it("draws nothing for options with no thing under them", () => {
    expect(resolvePlaces([layer({ visual: { hours: 6 } })]).visual).toBe(false);
    // the icon is always some icon: the plain one where nothing names a thing
    expect(resolvePlaces([layer({ icon: { name: "mdi:x" } })]).icon).toEqual({
      type: "icon",
      name: "mdi:x",
    });
    expect(resolvePlaces([layer({ icon: { type: "flow" } }), layer({ icon: false })]).icon).toEqual(
      { type: "icon" },
    );
  });

  it("draws the animation in one place: a flow behind the card makes the icon the still one", () => {
    const wind = layer({ icon: { type: "flow", style: "dots" } });
    expect(resolvePlaces([wind])).toEqual({
      icon: { type: "flow", style: "dots" },
      visual: false,
    });
    expect(resolvePlaces([wind, layer({ visual: { type: "flow", style: "lines" } })])).toEqual({
      icon: { type: "icon" },
      visual: { type: "flow", style: "lines" },
    });
    // the icon's other options stay
    expect(
      resolvePlaces([
        wind,
        layer({ icon: { ring: true }, visual: { type: "flow", style: "swoosh" } }),
      ]).icon,
    ).toEqual({ type: "icon", ring: true });
    // a rule that moves the flow behind the card while it matches
    expect(resolvePlaces([wind, none, layer({ visual: { type: "flow" } })]).icon).toEqual({
      type: "icon",
    });
  });
});

describe("the keys the places replaced", () => {
  it("names the new spelling of each", () => {
    // by the value written
    expect(goneKey({ poster: "solar" })).toBe("poster: solar is kind: solar");
    expect(goneKey({ image: "/a.jpg" })).toBe("image is visual: { type: image, src: /a.jpg }");
    expect(goneKey({ image: false })).toBe("image: false is visual: false");
    expect(goneKey({ icon_ring: true })).toBe("icon_ring: true is icon: { ring: true }");
    expect(goneKey({ icon_style: "circle" })).toBe("icon_style: circle is icon: { style: circle }");
    expect(goneKey({ show_entity_picture: true })).toBe(
      "show_entity_picture: true is icon: { type: image }",
    );
    expect(goneKey({ show_entity_picture: false })).toBe(
      "show_entity_picture: false is icon: { type: icon }",
    );
    expect(goneKey({ hours_to_show: 6 })).toBe("hours_to_show is visual: { hours: 6 }");
    expect(goneKey({ control_step: 5 })).toBe("control_step is control: { step: 5 }");
    expect(goneKey({ control_position: "block" })).toBe(
      "control_position is control: { position: block }",
    );
    expect(goneKey({ control_attribute: "brightness" })).toBe(
      "control_attribute is control: { attribute: brightness }",
    );
    expect(goneKey({ control_options: ["a"] })).toBe(
      "control_options is control: { options: [ … ] }",
    );
    expect(goneKey({ control_confirm: true })).toBe(
      "control_confirm is control: { confirm: true }",
    );
    expect(goneKey({ icon_tap_action: "toggle" })).toBe(
      "icon_tap_action is icon: { tap_action: … }",
    );
    expect(goneKey({ icon_hold_action: "none" })).toBe(
      "icon_hold_action is icon: { hold_action: … }",
    );
    expect(goneKey({ icon_double_tap_action: "none" })).toBe(
      "icon_double_tap_action is icon: { double_tap_action: … }",
    );
    expect(goneKey({ icon_badge: false })).toBe("icon_badge is icon: { badge: false }");
    expect(goneKey({ icon_badge: { icon: "mdi:x" } })).toBe("icon_badge is icon: { badge: … }");
    // status_badge is the tile's again: no gone key
    expect(goneKey({ status_badge: true })).toBeNull();
    for (const k of Object.keys(GONE_KEYS)) expect(goneKey({ [k]: 1 })).toBe(GONE_KEYS[k](1));
    expect(Object.keys(GONE_KEYS).sort()).toEqual(
      [
        "bucket_minutes",
        "hours_to_show",
        "icon_image",
        "icon_ring",
        "icon_style",
        "image",
        "image_blur",
        "image_opacity",
        "image_tint",
        "name_position",
        "poster",
        "show_entity_picture",
        "show_picture",
        "smoothing_minutes",
        "icon_tap_action",
        "icon_hold_action",
        "icon_double_tap_action",
        "icon_badge",
        "control_position",
        "control_attribute",
        "control_step",
        "control_options",
        "control_confirm",
      ].sort(),
    );
  });

  it("finds the first gone key, none for keys left undefined or still in use", () => {
    expect(
      goneKey({ entity: "sensor.x", icon: "mdi:x", visual: "glow", kind: "solar" }),
    ).toBeNull();
    expect(goneKey({ image: undefined })).toBeNull();
    expect(goneKey({ name: "x", image_tint: "red", poster: "solar" })).toBe(
      GONE_KEYS.image_tint("red"),
    );
    expect(goneKey({ variant: "lines" })).toBe(
      "variant: lines is visual: { type: flow, style: lines }",
    );
  });

  it("tells a flow's style from a device's kind in variant", () => {
    for (const style of ["dots", "lines", "swoosh", "vectors", "drops", "ripples", "fill"])
      expect(goneVariant(style)).toBe(
        `variant: ${style} is visual: { type: flow, style: ${style} }`,
      );
    expect(goneVariant("garage")).toBe("variant: garage is kind: garage");
    expect(goneVariant("heat_pump")).toBe("variant: heat_pump is kind: heat_pump");
    expect(goneVariant(3)).toBe(
      "variant is gone: a flow's style is visual: { type: flow, style: … }, a device is its kind",
    );
  });
});
