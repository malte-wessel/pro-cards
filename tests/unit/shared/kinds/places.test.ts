import { describe, it, expect } from "vitest";
import {
  GONE_KEYS,
  goneKey,
  goneVariant,
  idleOptions,
  IMAGE_BLUR,
  mergePlace,
  parseIcon,
  parseVisual,
  resolvePlaces,
  unfitThings,
  type IconPlace,
  type PlaceDefaults,
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
    // a flow's drawing is its variant; its style is the circle or none, as on any icon
    expect(icon({ type: "flow", variant: "swoosh" })).toEqual({ type: "flow", variant: "swoosh" });
    expect(icon({ type: "flow", variant: "ripples" })).toEqual({
      type: "flow",
      variant: "ripples",
    });
    expect(icon({ type: "flow", variant: "swoosh", style: "plain" })).toEqual({
      type: "flow",
      variant: "swoosh",
      style: "plain",
    });
    expect(icon({ type: "flow", style: "circle" })).toEqual({ type: "flow", style: "circle" });
    expect(icon({ variant: "lines" })).toEqual({ variant: "lines" });
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
      "icon: flow takes variant, style, tap_action, hold_action, double_tap_action, badge, not ring",
    );
    expect(() => icon({ type: "icon", src: "/a.png" })).toThrow(
      "icon: icon takes name, ring, style, tap_action, hold_action, double_tap_action, badge, not src",
    );
    expect(() => icon({ blur: 4 })).toThrow(
      "icon: blur is no option here (name, ring, style, src, variant, tap_action, hold_action, double_tap_action, badge)",
    );
    expect(() => icon({ type: "icon", ring: "yes" })).toThrow("icon: ring must be true or false");
    expect(() => icon({ type: "icon", name: "" })).toThrow("icon: name must be a text");
    expect(() => icon({ type: "image", src: 3 })).toThrow("icon: src must be a text");
    expect(() => icon({ type: "icon", style: "square" })).toThrow("icon: style must be one of");
    // style is the circle or none on every thing; a flow's drawing is its variant
    for (const type of ["icon", "image", "flow"])
      expect(() => icon({ type, style: "lines" })).toThrow(
        "icon: style must be one of circle, plain",
      );
    expect(() => icon({ style: "dots" })).toThrow("icon: style must be one of circle, plain");
    expect(() => icon({ type: "icon", variant: "dots" })).toThrow(
      "icon: icon takes name, ring, style, tap_action, hold_action, double_tap_action, badge, not variant",
    );
    expect(() => icon({ type: "image", variant: "drops" })).toThrow("icon: image takes src,");
    expect(() => icon({ type: "flow", variant: "plain" })).toThrow("icon: variant must be one of");
    // a cover's drawing is no flow's
    expect(() => icon({ type: "flow", variant: "garage" })).toThrow(
      "icon: a flow's variant is one of dots, lines, swoosh, vectors, drops, ripples, fill",
    );
    expect(() => icon({ variant: "blind" })).toThrow("icon: a flow's variant is one of");
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
    expect(visual({ type: "flow", variant: "lines" })).toEqual({ type: "flow", variant: "lines" });
    expect(visual({ type: "flow", variant: "fill" })).toEqual({ type: "flow", variant: "fill" });
    // a cover's drawing: its variant (left out: the device class's)
    for (const variant of ["shutter", "blind", "curtain", "garage", "gate", "awning", "window"])
      expect(visual({ type: "cover", variant })).toEqual({ type: "cover", variant });
    // without a type a variant merges onto whatever the place draws
    expect(visual({ variant: "garage" })).toEqual({ variant: "garage" });
    expect(visual({ variant: "swoosh" })).toEqual({ variant: "swoosh" });
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
    // a visual has no style: a flow's drawing is its variant, a cover's too
    expect(() => visual({ type: "flow", style: "lines" })).toThrow(
      "visual: flow takes variant, not style",
    );
    expect(() => visual({ style: "circle" })).toThrow("visual: style is no option here");
    expect(() => visual({ type: "flow", variant: "sideways" })).toThrow(
      "visual: variant must be one of",
    );
    expect(() => visual({ type: "flow", variant: "garage" })).toThrow(
      "visual: a flow's variant is one of dots, lines, swoosh, vectors, drops, ripples, fill",
    );
    expect(() => visual({ type: "cover", variant: "lines" })).toThrow(
      "visual: a cover's variant is one of shutter, blind, curtain, garage, gate, awning, window",
    );
    expect(() => visual({ type: "image", variant: "garage" })).toThrow(
      "visual: image takes src, opacity, tint, blur, not variant",
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
    // false empties the place, also a rule's over the card's
    expect(resolvePlaces([layer({ icon: { type: "flow" } }), layer({ icon: false })]).icon).toEqual(
      { type: "icon", hidden: true },
    );
  });

  it("keeps what every icon takes when a layer switches the thing", () => {
    // a rule's name over the card's photo: the ring, the plain style, the badge and the actions stay
    const card = layer({
      icon: { type: "image", ring: true, style: "plain", badge: false, tap_action: "toggle" },
    });
    expect(
      resolvePlaces([card, layer({ icon: { type: "icon", name: "mdi:home-export" } })]).icon,
    ).toEqual({
      type: "icon",
      name: "mdi:home-export",
      ring: true,
      style: "plain",
      badge: false,
      tap_action: "toggle",
    });
    // a thing's own options go with it: a picture's src, a flow's variant
    expect(
      resolvePlaces([
        layer({ icon: { type: "image", src: "/a.png" } }),
        layer({ icon: { type: "icon" } }),
      ]).icon,
    ).toEqual({ type: "icon" });
    expect(
      resolvePlaces([
        layer({ icon: { type: "flow", variant: "lines" } }),
        layer({ icon: { type: "icon" } }),
      ]).icon,
    ).toEqual({ type: "icon" });
    // the style is every icon's: it carries over a switch to a flow and back from one
    expect(
      resolvePlaces([
        layer({ icon: { type: "icon", name: "mdi:weather-windy", style: "plain", ring: true } }),
        layer({ icon: { type: "flow", variant: "swoosh" } }),
      ]).icon,
    ).toEqual({ type: "flow", variant: "swoosh", style: "plain", ring: true });
    expect(
      resolvePlaces([
        layer({ icon: { type: "flow", variant: "lines", style: "plain" } }),
        layer({ icon: { type: "icon" } }),
      ]).icon,
    ).toEqual({ type: "icon", style: "plain" });
    // the flow's own style wins
    expect(
      resolvePlaces([
        layer({ icon: { type: "image", style: "plain" } }),
        layer({ icon: { type: "flow", style: "circle" } }),
      ]).icon,
    ).toEqual({ type: "flow", style: "circle" });
    // the new thing's own option wins
    expect(
      resolvePlaces([
        layer({ icon: { type: "image", ring: true } }),
        layer({ icon: { type: "icon", ring: false } }),
      ]).icon,
    ).toEqual({ type: "icon", ring: false });
  });

  it("draws the animation in one place: a flow behind the card makes the icon the still one", () => {
    const wind = layer({ icon: { type: "flow", variant: "dots" } });
    expect(resolvePlaces([wind])).toEqual({
      icon: { type: "flow", variant: "dots" },
      visual: false,
    });
    expect(resolvePlaces([wind, layer({ visual: { type: "flow", variant: "lines" } })])).toEqual({
      icon: { type: "icon", still: true },
      visual: { type: "flow", variant: "lines" },
    });
    // the icon's other options stay
    expect(
      resolvePlaces([
        wind,
        layer({ icon: { ring: true }, visual: { type: "flow", variant: "swoosh" } }),
      ]).icon,
    ).toEqual({ type: "icon", ring: true, still: true });
    // a rule that moves the flow behind the card while it matches
    expect(resolvePlaces([wind, none, layer({ visual: { type: "flow" } })]).icon).toEqual({
      type: "icon",
      still: true,
    });
    // an icon asked for is no still one
    expect(
      resolvePlaces([wind, layer({ icon: { type: "icon" }, visual: { type: "flow" } })]).icon,
    ).toEqual({ type: "icon" });
  });
});

describe("options that do nothing", () => {
  const none = { icon: undefined, visual: undefined };
  const card = (o: object) => ({ ...none, ...o });
  const light: PlaceDefaults = {
    who: "a light poster",
    icon: undefined,
    visual: { type: "glow" },
    draws: [],
  };
  const fan: PlaceDefaults = { who: "a fan poster", icon: undefined, visual: undefined, draws: [] };
  const wind: PlaceDefaults = {
    who: "a wind poster",
    icon: { type: "flow", variant: "dots" },
    visual: undefined,
    draws: ["flow"],
  };
  const idle = (kind: PlaceDefaults | null, c: object, rules: object[] = []) =>
    idleOptions(kind, card(c), rules.map(card), "C");

  it("names options the thing under them does not take, and the thing that does", () => {
    expect(idle(light, { visual: { hours: 12 } })).toEqual([
      "C: visual: a light poster's visual is glow, which takes no options, not hours (name the thing that does: visual: { type: sparkline | columns | strip, hours: … })",
    ]);
    expect(idle(wind, { icon: { ring: true } })).toEqual([
      "C: icon: a wind poster's icon is flow, which takes variant, style, tap_action, hold_action, double_tap_action, badge, not ring (name the thing that does: icon: { type: icon | image, ring: … })",
    ]);
    // the options a thing takes, and a thing of its own type, do something
    expect(idle(light, { visual: { type: "sparkline", hours: 12 } })).toEqual([]);
    expect(idle(wind, { icon: { variant: "lines", style: "plain" } })).toEqual([]);
  });

  it("names options with nothing under them", () => {
    expect(idle(fan, { visual: { hours: 6 } })).toEqual([
      "C: visual: a fan poster draws no visual, so hours has nothing to change (name the thing that does: visual: { type: sparkline | columns | strip, hours: … })",
    ]);
    // a thing only some kinds draw is named only for a kind that draws it
    expect(idle(fan, { visual: { variant: "garage" } })[0]).not.toContain("type: cover");
  });

  it("checks a rule against the card's places, merged onto the kind's", () => {
    const sparkline = { visual: { type: "sparkline" } };
    expect(idle(light, sparkline, [{ visual: { opacity: 0.3 } }])).toEqual([
      "C: rules[0].visual: the card's visual is sparkline, which takes hours, bucket, src, axis, smoothing, not opacity (name the thing that does: visual: { type: image, opacity: … })",
    ]);
    expect(idle(light, { visual: false }, [{ visual: { axis: true } }])[0]).toMatch(
      /^C: rules\[0\]\.visual: the card draws no visual, so axis has nothing to change/,
    );
    // the card's options merged onto the kind's thing: the rule's options go onto that thing too
    expect(idle(light, { visual: {} }, [{ visual: { hours: 1 } }])[0]).toMatch(
      /^C: rules\[0\]\.visual: a light poster's visual is glow/,
    );
  });

  it("checks only what the card's own things decide while the kind is not known", () => {
    expect(idle(null, { visual: { hours: 12 } })).toEqual([]);
    expect(idle(null, { visual: { hours: 12 } }, [{ visual: { opacity: 1 } }])).toEqual([]);
    expect(
      idle(null, { visual: { type: "sparkline" } }, [{ visual: { opacity: 1 } }]),
    ).toHaveLength(1);
  });

  it("names a thing the kind does not draw", () => {
    expect(unfitThings(light, card({ visual: { type: "sun" } }), [], "C")).toEqual([
      "C: visual: a light poster draws no sun",
    ]);
    expect(unfitThings(wind, card({}), [card({ visual: { type: "flow" } })], "C")).toEqual([]);
    expect(unfitThings(light, card({}), [card({ icon: { type: "flow" } })], "C")).toEqual([
      "C: rules[0].icon: a light poster draws no flow",
    ]);
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
    expect(goneKey({ show_icon: false })).toBe("show_icon: false is icon: false");
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
        "show_icon",
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
        // the wind and rain cards'
        "flow",
        "layout",
        "lead",
        "title",
        "header_entities",
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
      "variant: lines is visual: { type: flow, variant: lines }",
    );
    expect(goneKey({ variant: "garage" })).toBe(
      "variant: garage is visual: { type: cover, variant: garage }",
    );
  });

  it("tells a flow's or a cover's drawing from an appliance's kind in variant", () => {
    for (const v of ["dots", "lines", "swoosh", "vectors", "drops", "ripples", "fill"])
      expect(goneVariant(v)).toBe(`variant: ${v} is visual: { type: flow, variant: ${v} }`);
    for (const v of ["shutter", "blind", "curtain", "garage", "gate", "awning", "window"])
      expect(goneVariant(v)).toBe(`variant: ${v} is visual: { type: cover, variant: ${v} }`);
    expect(goneVariant("heat_pump")).toBe("variant: heat_pump is kind: heat_pump");
    expect(goneVariant(3)).toBe(
      "variant is the drawing's: visual: { type: flow, variant: … }; an appliance is its kind",
    );
  });
});
