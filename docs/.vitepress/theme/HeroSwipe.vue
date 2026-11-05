<script setup lang="ts">
// On a phone the home hero has no backdrop (HeroDashboard.vue mounts nothing there): the posters
// of `hero.swipe` in docs/index.md sit in a swipe card under the buttons instead, live. Each
// poster goes in a layout card, which gives it a poster's three rows in the swipe card.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useData } from "vitepress";
import { mountGrid, loadRuntime, type MountHandle } from "./mount.ts";
import { useExampleTheme } from "./exampleTheme.ts";
import { PHONE } from "./hero.ts";

const { frontmatter } = useData();
const posters = computed(() => {
  const s = frontmatter.value.hero?.swipe;
  return Array.isArray(s) ? (s as Record<string, unknown>[]) : [];
});
const theme = useExampleTheme();
const host = ref<HTMLDivElement | null>(null);
let handle: MountHandle | null = null;

// mounted while the window is a phone's, gone when it grows past that (and back when it shrinks)
const phone = typeof window === "undefined" ? null : matchMedia(PHONE);
let loading = false;
const update = async () => {
  if (!phone?.matches) {
    handle?.dispose();
    handle = null;
    host.value?.replaceChildren();
    return;
  }
  if (handle || loading || !host.value || !posters.value.length) return;
  loading = true;
  const card = {
    type: "custom:swipe-card-pro",
    per_page: 1.2,
    cards: posters.value.map((p) => ({
      type: "custom:layout-card-pro",
      cards: [{ type: "custom:poster-card-pro", ...p }],
    })),
  };
  try {
    await loadRuntime();
    if (phone.matches && !handle) handle = await mountGrid(host.value, [card], { fullWidth: true });
  } catch (err) {
    console.error("hero swipe:", err);
  } finally {
    loading = false;
  }
};
onMounted(() => {
  void update();
  phone?.addEventListener("change", update);
});
onBeforeUnmount(() => {
  phone?.removeEventListener("change", update);
  handle?.dispose();
});
</script>

<template>
  <div v-if="posters.length" class="hero-swipe ha-theme" :data-theme="theme">
    <div ref="host"></div>
  </div>
</template>

<style scoped>
/* on the page ground (not the examples' frame), running off the screen's right edge past the
   hero's 24 px padding, so the next poster peeks in from the edge */
.hero-swipe {
  position: relative;
  z-index: 1;
  margin: 40px -24px 0 0;
  background: transparent;
}
@media (min-width: 640px) {
  .hero-swipe {
    display: none;
  }
}
</style>
