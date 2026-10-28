<script setup lang="ts">
// Renders a list of sections (each a list of cards) like a Home Assistant sections view.
import { ref, computed, onMounted, onBeforeUnmount, type PropType } from "vue";
import yamlLib from "js-yaml";
import { mountSections, loadRuntime, type MountHandle } from "./mount.ts";
import { THEMES, useExampleTheme, nextMode, type Mode, type ThemeId } from "./exampleTheme.ts";

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
    handles.push(...(await mountSections(host.value!, sections)));
  } catch (err) { error.value = err instanceof Error ? err.message : String(err); }
});
onBeforeUnmount(() => handles.forEach((h) => h.dispose()));
const showYaml = ref(false);
const cycle = () => { mode.value = nextMode(mode.value); };
</script>

<template>
  <div class="live">
    <div class="frame-wrap ha-theme" :class="mode === 'auto' ? '' : mode" :data-theme="theme">
      <div ref="host" class="ha-grid sections"></div>
    </div>
    <div class="tools">
      <button
        v-if="$slots.default"
        type="button"
        class="yaml-toggle"
        :class="{ on: showYaml }"
        @click="showYaml = !showYaml"
      >
        {{ showYaml ? "Hide YAML" : "Show YAML" }}
      </button>
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
    <div v-if="$slots.default && showYaml" class="yaml">
      <slot />
    </div>
  </div>
</template>
