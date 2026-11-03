<script setup lang="ts">
// A button with a dropdown panel (the Playground's Examples, Saved and ⋯): a disclosure, its
// panel's buttons reached by Tab or the arrow keys (the first one focused as it opens). It closes
// on a click outside, on Escape (the focus back on its button), and when an item asks it to
// (`close` in the slot).
import { nextTick, onBeforeUnmount, ref, useId, watch } from "vue";

defineProps<{ label: string; title?: string; align?: "left" | "right" }>();
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const id = useId();
const close = () => (open.value = false);
const outside = (ev: PointerEvent) => {
  if (root.value && !ev.composedPath().includes(root.value)) close();
};
const escape = (ev: KeyboardEvent) => {
  if (ev.key !== "Escape") return;
  close();
  button.value?.focus();
};
const items = () => [...(panel.value?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? [])];
// up and down through the panel's buttons, round at its ends
const arrows = (ev: KeyboardEvent) => {
  const step = ev.key === "ArrowDown" ? 1 : ev.key === "ArrowUp" ? -1 : 0;
  if (!step) return;
  const list = items();
  if (!list.length) return;
  ev.preventDefault();
  const at = list.indexOf(document.activeElement as HTMLElement);
  list[(at + step + list.length) % list.length].focus();
};
const listen = (on: boolean) => {
  const fn = on ? document.addEventListener : document.removeEventListener;
  fn.call(document, "pointerdown", outside as EventListener);
  fn.call(document, "keydown", escape as EventListener);
};
watch(open, async (o) => {
  listen(o);
  if (o) {
    await nextTick();
    items()[0]?.focus();
  }
});
// (unmounted while open: the watcher may not run again)
onBeforeUnmount(() => listen(false));
</script>

<template>
  <div ref="root" class="menu">
    <button
      ref="button"
      type="button"
      class="tb-btn"
      :class="{ on: open }"
      :title="title"
      :aria-expanded="open"
      :aria-controls="id"
      @click="open = !open"
    >
      <slot name="label">{{ label }}</slot>
      <svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z" /></svg>
    </button>
    <div
      v-if="open"
      :id="id"
      ref="panel"
      class="panel"
      :class="align ?? 'left'"
      role="group"
      :aria-label="title ?? label"
      @keydown="arrows"
    >
      <slot :close="close" />
    </div>
  </div>
</template>

<style scoped>
.menu {
  position: relative;
}
.caret {
  width: 16px;
  height: 16px;
  fill: currentColor;
  margin-left: 2px;
  opacity: 0.7;
}
.panel {
  position: absolute;
  top: calc(100% + 4px);
  z-index: 20;
  min-width: 240px;
  max-height: min(420px, 70vh);
  overflow-y: auto;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
}
.panel.left {
  left: 0;
}
.panel.right {
  right: 0;
}
</style>
