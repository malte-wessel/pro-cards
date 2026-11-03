<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import yamlLib from "js-yaml";
import LiveCard from "./LiveCard.vue";
import { PRESETS } from "./presets.ts";
import { loadRuntime } from "./mount.ts";
import { decodeEdit, dumpYaml, isEditable } from "./editable.ts";
import type { CardConfigBase } from "../../../src/shared/ha.ts";

// a card's editor element (the Pro cards' getConfigElement)
interface Editor extends HTMLElement {
  setConfig(c: CardConfigBase): void;
  hass: unknown;
}

const FROM_LINK = "From the docs";
const presets = ref<Record<string, string>>({ ...PRESETS });
const preset = ref(Object.keys(PRESETS)[0]);
const text = ref(PRESETS[preset.value]);
const live = ref(text.value);
const mode = ref<"visual" | "yaml">("visual");
const pick = ref(0);
const editorHost = ref<HTMLDivElement | null>(null);

// the cards the text holds (null: it does not parse)
const doc = computed<unknown>(() => {
  try {
    return yamlLib.load(text.value);
  } catch {
    return null;
  }
});
const cards = computed<CardConfigBase[]>(() =>
  Array.isArray(doc.value) ? (doc.value as CardConfigBase[]) : doc.value ? [doc.value as CardConfigBase] : [],
);
const editable = computed(() => cards.value.map((c, i) => (isEditable(c) ? i : -1)).filter((i) => i >= 0));
const visual = computed(() => mode.value === "visual" && editable.value.length > 0);
const cardLabel = (c: CardConfigBase, i: number) =>
  `${i + 1}: ${String(c.type).replace(/^custom:/, "").replace(/-card-pro$/, "")}${c.entity ? ` · ${c.entity}` : ""}`;

let t: ReturnType<typeof setTimeout> | undefined;
// the text changed by the editor: the card shows it at once and the editor keeps its own state
let fromEditor = false;
watch(text, (v) => {
  clearTimeout(t);
  if (fromEditor) {
    fromEditor = false;
    live.value = v;
    return;
  }
  t = setTimeout(() => {
    live.value = v;
  }, 350);
  syncEditor();
});
watch(preset, (k) => {
  if (presets.value[k] !== undefined) text.value = presets.value[k];
});

// the editor of the picked card: built for its type, configured from the text
let editor: Editor | null = null;
let editorType = "";
let unsubscribe: (() => void) | null = null;
const syncEditor = async () => {
  if (!visual.value || !editorHost.value) return;
  if (!editable.value.includes(pick.value)) pick.value = editable.value[0];
  const card = cards.value[pick.value];
  const hass = await loadRuntime();
  if (!editor || editorType !== card.type) {
    const tag = String(card.type).replace(/^custom:/, "");
    const cls = customElements.get(tag) as unknown as { getConfigElement(): Editor };
    editor = cls.getConfigElement();
    editorType = String(card.type);
    editor.hass = hass.snapshot();
    unsubscribe?.();
    unsubscribe = hass.subscribe(() => {
      if (editor) editor.hass = hass.snapshot();
    });
    editor.addEventListener("config-changed", (ev) => {
      const config = (ev as CustomEvent).detail.config as CardConfigBase;
      const next = cards.value.slice();
      next[pick.value] = config;
      fromEditor = true;
      text.value = dumpYaml(Array.isArray(doc.value) ? next : next[0]);
    });
    editorHost.value.replaceChildren(editor);
  }
  editor.setConfig(JSON.parse(JSON.stringify(card)));
};
watch([visual, pick, editorHost], () => {
  if (visual.value) void syncEditor();
});

onMounted(() => {
  const linked = decodeEdit(location.hash);
  if (linked) {
    presets.value = { [FROM_LINK]: linked, ...PRESETS };
    preset.value = FROM_LINK;
    text.value = linked;
  }
  void syncEditor();
});
onBeforeUnmount(() => unsubscribe?.());
</script>

<template>
  <div class="playground">
    <div>
      <div class="bar">
        <label
          >Preset
          <select v-model="preset">
            <option v-for="k in Object.keys(presets)" :key="k" :value="k">{{ k }}</option>
          </select></label
        >
        <div class="switch" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="visual"
            :disabled="!editable.length"
            :title="editable.length ? '' : 'The visual editor edits tiles, posters, layout and swipe cards'"
            @click="mode = 'visual'"
          >
            Visual editor
          </button>
          <button type="button" role="tab" :aria-selected="!visual" @click="mode = 'yaml'">
            YAML
          </button>
        </div>
        <label v-if="visual && editable.length > 1"
          >Card
          <select v-model="pick">
            <option v-for="i in editable" :key="i" :value="i">{{ cardLabel(cards[i], i) }}</option>
          </select></label
        >
      </div>
      <div v-show="visual" class="editor ha-theme">
        <div ref="editorHost"></div>
      </div>
      <textarea v-show="!visual" v-model="text" spellcheck="false"></textarea>
      <details v-if="visual" class="written">
        <summary>The YAML it writes</summary>
        <pre>{{ text }}</pre>
      </details>
    </div>
    <LiveCard :yaml="live" width="full" :edit="false" />
  </div>
</template>
