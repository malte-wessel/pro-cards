<script setup lang="ts">
// The hero's image column: the mark floating over a faint isometric "floor" of dashboard
// tiles. The floor uses the mark's 2:1 slope (matrix(1 .5 -1 .5)) and fades out radially.
// Tiles are given in grid units: x, y, w, h, plus whether they carry an icon dot and text bar.
const U = 56;
const tiles: [number, number, number, number, boolean][] = [
  [0, 0, 2, 1, true],
  [2.2, 0, 1, 1, false],
  [3.6, 0, 0.8, 1, false],
  [0, 1.2, 1, 1, false],
  [1.2, 1.2, 2.2, 1, true],
  [3.6, 1.2, 0.8, 2.2, false],
  [0, 2.4, 3.4, 1, true],
  [0, 3.6, 1.6, 1, false],
  [1.8, 3.6, 1.6, 1, true],
  [3.6, 3.6, 0.8, 1, false],
];
const width = 4.4;
const height = 4.6;
</script>

<template>
  <div class="visual">
    <svg class="floor" viewBox="-320 -220 640 440" aria-hidden="true">
      <defs>
        <radialGradient
          id="pcFloorFade"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(0 60) scale(280 170)"
        >
          <stop offset="0" stop-color="#fff" />
          <stop offset="0.55" stop-color="#fff" stop-opacity=".7" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
        <mask id="pcFloorMask">
          <rect x="-320" y="-220" width="640" height="440" fill="url(#pcFloorFade)" />
        </mask>
      </defs>
      <g mask="url(#pcFloorMask)">
        <g
          :transform="`translate(0 70) matrix(1 0.5 -1 0.5 0 0) translate(${(-width / 2) * U} ${(-height / 2) * U})`"
        >
          <g v-for="([x, y, w, h, deco], i) in tiles" :key="i">
            <rect
              class="tile"
              :x="x * U"
              :y="y * U"
              :width="w * U"
              :height="h * U"
              :rx="U * 0.18"
            />
            <template v-if="deco">
              <circle class="dot" :cx="x * U + U * 0.32" :cy="y * U + U * 0.5" :r="U * 0.13" />
              <rect
                class="bar"
                :x="x * U + U * 0.6"
                :y="y * U + U * 0.42"
                :width="(w - 0.9) * U"
                :height="U * 0.16"
                :rx="U * 0.08"
              />
            </template>
          </g>
        </g>
      </g>
    </svg>
    <!-- The mark, inline so its translucent middle layer can be drawn opaque here: the floor
         would otherwise show through it. The colours are the .6-opacity layer pre-blended
         with the page ground (see --pc-mid-* below). -->
    <svg class="image-src mark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pcHeroTop" x1="8" y1="8" x2="56" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#4FD1FF" />
          <stop offset="1" stop-color="#2F5BF5" />
        </linearGradient>
        <linearGradient
          id="pcHeroLow"
          x1="8"
          y1="32"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#7AA8FF" />
          <stop offset="1" stop-color="#6A1BF0" />
        </linearGradient>
        <linearGradient
          id="pcHeroMid"
          x1="8"
          y1="32"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" class="mid-a" />
          <stop offset="1" class="mid-b" />
        </linearGradient>
      </defs>
      <path
        d="M8 44 L32 56 L56 44"
        stroke="url(#pcHeroLow)"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8 32 L32 44 L56 32"
        stroke="url(#pcHeroMid)"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M32 8 L56 20 L32 32 L8 20 Z"
        stroke="url(#pcHeroTop)"
        stroke-width="5"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<style scoped>
.visual {
  position: absolute;
  inset: 0;
}
.floor {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(150%, calc(100vw - 32px));
  height: auto;
  transform: translate(-50%, -50%);
  overflow: visible;
  pointer-events: none;
  color: var(--vp-c-brand-1);
}
.tile {
  fill: currentColor;
  fill-opacity: 0.04;
  stroke: currentColor;
  stroke-opacity: 0.18;
  stroke-width: 1.5;
}
.dot,
.bar {
  fill: currentColor;
  fill-opacity: 0.12;
}
.dark .floor {
  color: #7aa8ff;
}
.dark .tile {
  fill-opacity: 0.06;
  stroke-opacity: 0.28;
}
.image-src {
  position: relative;
  width: 192px;
  height: 192px;
}
@media (min-width: 640px) {
  .image-src {
    width: 256px;
    height: 256px;
  }
}
@media (min-width: 960px) {
  .image-src {
    width: 320px;
    height: 320px;
  }
}
/* #7AA8FF / #6A1BF0 at 60% over white, and over Night */
.mid-a {
  stop-color: #afcbff;
}
.mid-b {
  stop-color: #a676f6;
}
.dark .mid-a {
  stop-color: #4d6ba6;
}
.dark .mid-b {
  stop-color: #44179d;
}
</style>
