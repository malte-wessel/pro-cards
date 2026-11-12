<script setup lang="ts">
// The home page's feature rows: the rows of `feature_rows` in docs/index.md, each its copy on one
// side and its live cards on the other, the sides alternating. A row's cards sit side by side
// (`columns`), stacked on a phone. A card's `navigate` action opens its docs section: the rows
// catch it before the stand-in's own handler (which only says where it would go) and route it.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useData, useRouter, withBase } from "vitepress";
import { mountGrid, loadRuntime, type MountHandle } from "./mount.ts";
import { useExampleTheme } from "./exampleTheme.ts";

interface Row {
  title: string;
  text?: string;
  link?: string;
  label?: string;
  columns?: number;
  cards: unknown[];
}

const { frontmatter } = useData();
const rows = computed(() => {
  const r = frontmatter.value.feature_rows;
  return Array.isArray(r) ? (r as Row[]) : [];
});
const theme = useExampleTheme();
const router = useRouter();
// a tap (or hold) that navigates: a path on this site, opened here
type Action = { action?: string; navigation_path?: unknown };
const onAction = (ev: Event) => {
  const d = (ev as CustomEvent<{ config?: Record<string, unknown>; action?: string }>).detail;
  const a = d?.config?.[`${d.action}_action`] as Action | undefined;
  const path = a?.action === "navigate" ? a.navigation_path : null;
  if (typeof path !== "string" || !path.startsWith("/")) return;
  ev.stopPropagation();
  router.go(withBase(path));
};
const hosts: HTMLDivElement[][] = [];
let handles: MountHandle[] = [];
const error = ref("");

const host = (r: number, c: number) => (el: unknown) => {
  (hosts[r] ??= [])[c] = el as HTMLDivElement;
};

onMounted(async () => {
  try {
    await loadRuntime();
    const jobs = rows.value.flatMap((row, r) =>
      row.cards.map((card, c) => mountGrid(hosts[r][c], [card], { fullWidth: true })),
    );
    handles = await Promise.all(jobs);
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  }
});
onBeforeUnmount(() => handles.forEach((h) => h.dispose()));
</script>

<template>
  <section v-if="rows.length" class="features ha-theme" :data-theme="theme" @hass-action="onAction">
    <header class="head">
      <h2 class="headline">Cards that do more than show a number.</h2>
      <p class="lead">
        Live flows, real controls, posters and rules. Every card on this page is running, so go
        ahead and try them.
      </p>
    </header>
    <article v-for="(row, r) in rows" :key="row.title" class="row" :class="{ flip: r % 2 === 1 }">
      <div class="copy">
        <h3 class="title">{{ row.title }}</h3>
        <p v-if="row.text" class="text">{{ row.text }}</p>
        <a v-if="row.link" class="link" :href="withBase(row.link)"
          >{{ row.label ?? "Learn more" }} →</a
        >
      </div>
      <div class="stage" :style="{ '--cols': row.columns ?? 1 }">
        <div v-for="(_, c) in row.cards" :key="c" :ref="host(r, c)" class="ha-grid"></div>
      </div>
    </article>
    <div v-if="error" class="error">{{ error }}</div>
  </section>
</template>

<style scoped>
/* the section is a band of Home Assistant's ground, as the examples' frames are (ha-theme paints
   it and follows the example theme); the shadow carries it out to the window's edges without
   widening the page, the clip keeps it to the band's height */
.features {
  margin: 32px 0 96px;
  padding-block: 88px;
  box-shadow: 0 0 0 100vmax var(--primary-background-color);
  clip-path: inset(0 -100vmax);
}
/* the copy keeps the site's font; ha-theme gives the cards the example theme's */
.head,
.copy {
  font-family: var(--vp-font-family-base);
}
/* .vp-doc styles every h2 / h3 / p / a on the page; these reset what they set */
.head {
  max-width: 720px;
  margin: 0 auto 72px;
  text-align: center;
}
.head .headline {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 36px;
  line-height: 44px;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-wrap: balance;
  color: var(--vp-c-text-1);
}
.head .lead {
  margin: 16px 0 0;
  font-size: 18px;
  line-height: 28px;
  color: var(--vp-c-text-2);
}
/* copy on the left, cards on the right; every other row the other way round */
.row {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: center;
  gap: 64px;
}
.row + .row {
  margin-top: 112px;
}
.row.flip {
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
}
.row.flip .copy {
  order: 2;
}
.copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.copy .title {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 34px;
  line-height: 40px;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-wrap: balance;
  color: var(--vp-c-text-1);
}
.copy .text {
  margin: 4px 0 0;
  font-size: 17px;
  line-height: 27px;
  color: var(--vp-c-text-2);
}
.copy .link {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.copy .link:hover {
  color: var(--vp-c-brand-1);
}
/* the cards of a row are equally tall */
.stage {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 16px;
}
.error {
  margin-top: 12px;
  color: var(--vp-c-danger-1);
}
/* narrower: the copy above its cards */
@media (max-width: 959px) {
  .row,
  .row.flip {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }
  .row.flip .copy {
    order: 0;
  }
  .row + .row {
    margin-top: 80px;
  }
}
@media (max-width: 639px) {
  .head .headline {
    font-size: 28px;
    line-height: 34px;
  }
  .copy .title {
    font-size: 28px;
    line-height: 34px;
  }
  .stage {
    grid-template-columns: minmax(0, 1fr);
  }
  .row + .row {
    margin-top: 64px;
  }
}
</style>
