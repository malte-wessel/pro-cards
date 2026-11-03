<script setup lang="ts">
// A button with a dropdown panel (the Playground's Examples, Saved and ⋯): closes on a click
// outside, on Escape, and when an item asks it to (`close` in the slot).
import { onBeforeUnmount, ref, watch } from "vue";

defineProps<{ label: string; title?: string; align?: "left" | "right" }>();
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const close = () => (open.value = false);
const outside = (ev: PointerEvent) => {
  if (root.value && !ev.composedPath().includes(root.value)) close();
};
const escape = (ev: KeyboardEvent) => {
  if (ev.key === "Escape") close();
};
watch(open, (o) => {
  if (o) {
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
  } else {
    document.removeEventListener("pointerdown", outside);
    document.removeEventListener("keydown", escape);
  }
});
onBeforeUnmount(close);
</script>

<template>
  <div ref="root" class="menu">
    <button
      type="button"
      class="tb-btn"
      :class="{ on: open }"
      :title="title"
      :aria-expanded="open"
      @click="open = !open"
    >
      <slot name="label">{{ label }}</slot>
      <svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z" /></svg>
    </button>
    <div v-if="open" class="panel" :class="align ?? 'left'" role="menu">
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
