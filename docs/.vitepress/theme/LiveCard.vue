<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, type PropType } from "vue";
import yamlLib from "js-yaml";
import { mountGrid, loadRuntime, type MountHandle } from "./mount.ts";
import type { CardConfigBase } from "../../../src/shared/ha.ts";

const props = defineProps({
  yaml: { type: String, default: "" },
  b64: { type: String, default: "" },
  config: { type: [Object, Array] as PropType<CardConfigBase | CardConfigBase[] | null>, default: null },
  width: { type: String, default: "" },   // px number, "full", or css length
  theme: { type: String, default: "auto" }, // auto | light | dark
  grid: { type: Boolean, default: false }, // keep each card's own grid_options width instead of full width
});

const host = ref<HTMLDivElement | null>(null);
const error = ref("");
const mode = ref(props.theme);
let handle: MountHandle | null = null;

const source = computed(() => props.config ?? (props.b64 ? decode(props.b64) : props.yaml));
function decode(b: string) { try { return decodeURIComponent(escape(atob(b))); } catch { return atob(b); } }

const parse = (src: unknown): unknown => {
  if (src && typeof src === "object") return src;
  const doc = yamlLib.load(String(src || ""));
  if (!doc) throw new Error("empty config");
  return doc;
};

const frameWidth = computed(() => {
  if (props.width === "full") return "100%";
  if (props.width) return /^\d+$/.test(props.width) ? `${props.width}px` : props.width;
  try {
    const doc = parse(source.value);
    const first = (Array.isArray(doc) ? doc[0] : doc) as CardConfigBase | undefined;
    const cols = Number(first?.grid_options?.columns);
    if (Array.isArray(doc)) return "400px";
    if (cols && cols < 12) return `${Math.round(400 * cols / 12)}px`;
  } catch {}
  return "400px";
});

const render = async () => {
  if (!host.value) return;
  error.value = "";
  handle?.dispose?.();
  try {
    const doc = parse(source.value);
    const cards = Array.isArray(doc) ? doc : [doc];
    handle = await mountGrid(host.value, cards, { fullWidth: !props.grid && !Array.isArray(doc) });
  } catch (err) {
    host.value.textContent = "";
    error.value = err instanceof Error ? err.message : String(err);
  }
};

onMounted(() => { loadRuntime().then(render); });
onBeforeUnmount(() => handle?.dispose?.());
watch(source, () => { render(); });
const cycle = () => { mode.value = mode.value === "auto" ? "light" : mode.value === "light" ? "dark" : "auto"; };
</script>

<template>
  <div class="live">
    <div class="frame-wrap ha-theme" :class="mode === 'auto' ? '' : mode">
      <div class="frame" :style="{ width: frameWidth }"><div ref="host" class="ha-grid"></div></div>
      <div class="tools">
        <button
          type="button"
          :class="{ on: mode !== 'auto' }"
          @click="cycle"
          :title="'Theme: ' + mode"
        >
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
