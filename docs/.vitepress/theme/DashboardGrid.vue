<script setup lang="ts">
// Renders a list of sections (each a list of cards) like a Home Assistant sections view.
import { ref, computed, onMounted, onBeforeUnmount, type PropType } from "vue";
import yamlLib from "js-yaml";
import { mountGrid, loadRuntime, type MountHandle } from "./mount.ts";
import { THEMES, useExampleTheme, nextMode, type Mode, type ThemeId } from "./exampleTheme.ts";

// a section of a sections view: its cards (or a bare list of cards) and an optional column span
interface SectionConfig {
  column_span?: number;
  cards?: unknown[];
}

const props = defineProps({
  b64: { type: String, default: "" },
  yaml: { type: String, default: "" },
  sections: { type: Array as PropType<unknown[] | null>, default: null },
  mode: { type: String as PropType<Mode>, default: "auto" }, // auto | light | dark
  theme: { type: String as PropType<ThemeId | "">, default: "" }, // pin a theme; "" follows the site-wide choice
});
const host = ref<HTMLDivElement | null>(null);
const error = ref("");
const mode = ref<Mode>(props.mode);
const siteTheme = useExampleTheme();
const theme = computed(() => props.theme || siteTheme.value);
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
      // like HA: a span of 2 takes two of three columns, anything wider takes the row
      const span = Number(sec.column_span) || 1;
      if (span === 2) el.classList.add("span-2");
      else if (span > 2) el.style.gridColumn = "1 / -1";
      root.appendChild(el);
      handles.push(await mountGrid(el, (sec.cards || raw) as unknown[], { fullWidth: false }));
    }
  } catch (err) { error.value = err instanceof Error ? err.message : String(err); }
});
onBeforeUnmount(() => handles.forEach((h) => h.dispose()));
const cycle = () => { mode.value = nextMode(mode.value); };
</script>

<template>
  <div class="live">
    <div class="frame-wrap ha-theme" :class="mode === 'auto' ? '' : mode" :data-theme="theme">
      <div ref="host" class="ha-grid sections"></div>
    </div>
    <div class="tools">
      <select v-if="!props.theme" v-model="siteTheme" title="Home Assistant theme of every example">
        <option v-for="t in THEMES" :key="t.id" :value="t.id">{{ t.label }}</option>
      </select>
      <span v-else class="pinned" title="This example is pinned to one theme">
        {{ THEMES.find((t) => t.id === theme)?.label }}
      </span>
      <button
        type="button"
        :class="{ on: mode !== 'auto' }"
        @click="cycle"
        :title="'Theme: ' + mode"
      >
        {{ mode === 'auto' ? 'auto' : mode }}
      </button>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <details v-if="$slots.default">
      <summary>YAML</summary>
      <slot />
    </details>
  </div>
</template>
