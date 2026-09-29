<script setup lang="ts">
// Renders a list of sections (each a list of cards) like a Home Assistant sections view.
import { ref, onMounted, onBeforeUnmount, type PropType } from "vue";
import yamlLib from "js-yaml";
import { mountGrid, loadRuntime, type MountHandle } from "./mount.ts";

// a section of a sections view: its cards (or a bare list of cards) and an optional column span
interface SectionConfig {
  column_span?: number;
  cards?: unknown[];
}

const props = defineProps({
  b64: { type: String, default: "" },
  yaml: { type: String, default: "" },
  sections: { type: Array as PropType<unknown[] | null>, default: null },
  theme: { type: String, default: "auto" },
});
const host = ref<HTMLDivElement | null>(null);
const error = ref("");
const mode = ref(props.theme);
const handles: MountHandle[] = [];

const decode = (b: string) => { try { return decodeURIComponent(escape(atob(b))); } catch { return atob(b); } };

onMounted(async () => {
  try {
    await loadRuntime();
    const doc = props.sections ?? yamlLib.load(props.b64 ? decode(props.b64) : props.yaml);
    const sections: unknown[] = Array.isArray(doc)
      ? doc
      : (doc as { sections?: unknown[] } | null | undefined)?.sections || [];
    const root = host.value!;
    root.textContent = "";
    for (const raw of sections) {
      const sec = raw as SectionConfig;
      const el = document.createElement("div");
      el.className = "section";
      if (Number(sec.column_span) > 1) el.style.gridColumn = "1 / -1";
      root.appendChild(el);
      handles.push(await mountGrid(el, (sec.cards || raw) as unknown[], { fullWidth: false }));
    }
  } catch (err) { error.value = err instanceof Error ? err.message : String(err); }
});
onBeforeUnmount(() => handles.forEach((h) => h.dispose()));
const cycle = () => { mode.value = mode.value === "auto" ? "light" : mode.value === "light" ? "dark" : "auto"; };
</script>

<template>
  <div class="live">
    <div class="frame-wrap ha-theme" :class="mode === 'auto' ? '' : mode">
      <div ref="host" class="ha-grid sections"></div>
      <div class="tools">
        <button type="button" :class="{ on: mode !== 'auto' }" @click="cycle">
          {{ mode === 'auto' ? 'auto' : mode }}
        </button>
      </div>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <details v-if="$slots.default">
      <summary>YAML</summary>
      <slot />
    </details>
  </div>
</template>
