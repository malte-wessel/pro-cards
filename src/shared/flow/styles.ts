// CSS shared by the flow cards: the tile / hero typography, the animated lead's circle, the band,
// the flow tile (the band behind the texts, with a narrow and a wide text variant), the chip and
// the reduced-motion pause. The `w` prefix of the class names is historical (the wind card came
// first); the rain card uses the same ones. Each card appends its own particles and keyframes.
export const STYLE_FLOW = `
  .row.wtile { flex: 1; justify-content: center; }
  .whero .big b { font-size: 40px; line-height: 44px; letter-spacing: -1px; }
  .whero .big span { font-size: 16px; }
  .whero .primary { font-size: 15px; }
  .whero .secondary { white-space: normal; }
  .secondary .accent { color: var(--fe-color); font-weight: 500; }

  /* the animated lead: whatever the card draws, clipped to the soft circle */
  .lead.wlead { overflow: hidden; border-radius: 50%; }

  /* the band: the animation behind a chip */
  .wflow { position: relative; overflow: hidden; border-radius: 10px; background: color-mix(in srgb, var(--fe-color) 7%, transparent); contain: layout paint; }
  .wflow.band { flex: none; height: var(--band-h, 120px); }
  .row.wtile.flow { position: relative; container-type: inline-size; }
  .wflow.bg .chip { display: none; }
  /* a narrow flow tile shows the plain tile's line; a wide one the label line and the big value */
  .row.wtile.flow .secondary:not(.narrow), .row.wtile.flow .end { display: none; }
  @container (min-width: 340px) {
    .row.wtile.flow .secondary:not(.narrow) { display: block; }
    .row.wtile.flow .secondary.narrow { display: none; }
    .row.wtile.flow .end { display: flex; }
  }
  .row.wtile.flow .wflow.bg { position: absolute; inset: -8px -12px; border-radius: 0; }
  .row.wtile.flow > .hit { inset: -8px -12px; }
  .row.wtile.flow .top { position: relative; }
  .row.wtile.flow .lead .shape { background: color-mix(in srgb, var(--fe-color) 20%, var(--ha-card-background, var(--card-background-color))); }
  .row.wtile.flow .end .big b { font-size: 26px; line-height: 30px; }

  /* the chip on the band */
  .chip { position: absolute; left: 8px; top: 8px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px 2px 4px; border-radius: 999px; background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color)) 80%, transparent); font-size: 12px; line-height: 16px; font-weight: 500; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .chip ha-icon { --mdc-icon-size: 14px; color: var(--fe-color); }
`;
// appended last by every flow card: the `animation` shorthands of the particles would reset the
// play state if this came before them
export const STYLE_FLOW_MOTION = `
  @media (prefers-reduced-motion: reduce) { .wflow *, .lead.wlead * { animation-play-state: paused; } }
`;
