<script setup lang="ts">
// The Playground: one card at a time, edited visually (the card's own editor) or as YAML, beside
// its preview. The card is kept in the browser as you type (the draft), can be saved under a
// name, and shared as a link that carries it. On a narrow screen the panes become view tabs.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import yamlLib from "js-yaml";
import { PRESETS } from "../presets.ts";
import { loadRuntime } from "../mount.ts";
import { dumpYaml, isEditable } from "../editable.ts";
import type { CardConfigBase } from "../../../../src/shared/ha.ts";
import Menu from "./Menu.vue";
import PreviewPane from "./PreviewPane.vue";
import YamlEditor from "./YamlEditor.vue";
import {
  decodeShare,
  deleteSaved,
  encodeShare,
  listSaved,
  loadDraft,
  putSaved,
  saveDraft,
  type Saved,
} from "./store.ts";
import "./playground.css";

interface Editor extends HTMLElement {
  setConfig(c: CardConfigBase): void;
  hass: unknown;
}

// ----- the card -----

const NEW_CARD = "type: custom:tile-card-pro\nentity: light.living_room\n";
const name = ref("");
const id = ref<string | undefined>(undefined);
const text = ref("");
// what the preview shows: the text a moment after typing stops, at once after the visual editor
const live = ref("");
const view = ref<"visual" | "yaml" | "preview">("visual");
const pick = ref(0);
const ready = ref(false);

// the text as YAML: its cards, or where it fails
const parsed = computed<{ doc: unknown; error: { message: string; line?: number } | null }>(() => {
  try {
    return { doc: yamlLib.load(text.value), error: null };
  } catch (e) {
    const err = e as { reason?: string; message: string; mark?: { line: number } };
    return {
      doc: null,
      error: { message: err.reason ?? err.message, line: err.mark ? err.mark.line + 1 : undefined },
    };
  }
});
const listOf = (doc: unknown): CardConfigBase[] =>
  Array.isArray(doc) ? (doc as CardConfigBase[]) : doc && typeof doc === "object" ? [doc as CardConfigBase] : [];
const cards = computed(() => listOf(parsed.value.doc));
const liveCards = ref<CardConfigBase[]>([]);
watch(live, (t) => {
  try {
    liveCards.value = listOf(yamlLib.load(t));
  } catch {
    // the text fails: the preview keeps the last cards that parsed
  }
});
const editable = computed(() => cards.value.map((c, i) => (isEditable(c) ? i : -1)).filter((i) => i >= 0));
const configError = ref<string | null>(null);
const error = computed(() =>
  parsed.value.error ?? (configError.value ? { message: configError.value } : null),
);
const typeName = (c: CardConfigBase | undefined) =>
  String(c?.type ?? "card")
    .replace(/^custom:/, "")
    .replace(/-card(-pro)?$/, "")
    .replace(/-/g, " ")
    .replace(/^./, (x) => x.toUpperCase());
const cardLabel = (c: CardConfigBase, i: number) =>
  `${i + 1}: ${typeName(c)}${c.entity ? ` · ${c.entity}` : ""}`;

let timer: ReturnType<typeof setTimeout> | undefined;
let fromEditor = false;
watch(text, (t) => {
  clearTimeout(timer);
  if (fromEditor) {
    fromEditor = false;
    live.value = t;
  } else {
    timer = setTimeout(() => (live.value = t), 300);
    void syncEditor();
  }
  scheduleDraft();
});
watch(name, scheduleDraft);

const load = (yaml: string, as: string, savedId?: string) => {
  name.value = as;
  id.value = savedId;
  text.value = yaml;
  live.value = yaml;
  pick.value = 0;
  if (!editable.value.length && view.value === "visual") view.value = "yaml";
};

// ----- the visual editor: the picked card's own -----

const editorHost = ref<HTMLDivElement | null>(null);
let editor: Editor | null = null;
let editorType = "";
let unsubscribe: (() => void) | null = null;
const syncEditor = async () => {
  if (!editorHost.value || !editable.value.length) return;
  if (!editable.value.includes(pick.value)) pick.value = editable.value[0];
  const card = cards.value[pick.value];
  const hass = await loadRuntime();
  if (!editor || editorType !== card.type) {
    const cls = customElements.get(String(card.type).replace(/^custom:/, "")) as unknown as {
      getConfigElement(): Editor;
    };
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
      text.value = dumpYaml(Array.isArray(parsed.value.doc) ? next : next[0]);
    });
    editorHost.value.replaceChildren(editor);
  }
  editor.setConfig(JSON.parse(JSON.stringify(card)));
};
watch([pick, editorHost, () => editable.value.length], () => void syncEditor());

// the picked card's grid size from the preview, into its YAML
const setGrid = (g: { columns?: number; rows?: number | "auto" }) => {
  const next = cards.value.map((c) => ({ ...c }));
  const c = next[pick.value] as CardConfigBase & { grid_options?: Record<string, unknown> };
  if (!c) return;
  const go = { ...(c.grid_options ?? {}) };
  for (const [k, v] of Object.entries(g)) {
    if (v === undefined) delete go[k];
    else go[k] = v;
  }
  if (Object.keys(go).length) c.grid_options = go;
  else delete c.grid_options;
  text.value = dumpYaml(Array.isArray(parsed.value.doc) ? next : next[0]);
};

// ----- saving and sharing -----

const saved = ref<Saved[]>([]);
const confirmDelete = ref<string | null>(null);
let draftTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleDraft() {
  if (!ready.value) return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => saveDraft({ name: name.value, yaml: text.value, id: id.value }), 500);
}
const toast = ref("");
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const say = (msg: string) => {
  toast.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = ""), 2200);
};
const save = () => {
  const entry = putSaved({ name: name.value.trim() || typeName(cards.value[0]), yaml: text.value, id: id.value });
  name.value = entry.name;
  id.value = entry.id;
  saved.value = listSaved();
  say(`Saved “${entry.name}”`);
};
const open = (s: Saved, close: () => void) => {
  load(s.yaml, s.name, s.id);
  close();
};
const remove = (s: Saved) => {
  if (confirmDelete.value !== s.id) {
    confirmDelete.value = s.id;
    return;
  }
  deleteSaved(s.id);
  if (id.value === s.id) id.value = undefined;
  confirmDelete.value = null;
  saved.value = listSaved();
};
const fresh = () => load(NEW_CARD, "");
const copy = async (value: string, msg: string) => {
  try {
    await navigator.clipboard.writeText(value);
    say(msg);
  } catch {
    say("Copying is not allowed here");
  }
};
const copyYaml = () => copy(text.value, "YAML copied");
const share = async () => {
  const hash = await encodeShare({ name: name.value, yaml: text.value });
  await copy(`${location.origin}${location.pathname}${hash}`, "Link copied: anyone with it sees this card");
};
const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(t).toLocaleDateString();
};

// the examples, by card family
const GROUPS: [string, RegExp][] = [
  ["Tiles & Poster", /(tile|poster)-card-pro/],
  ["Layout", /(layout|swipe|heading)-card-pro/],
  ["Energy", /(power|energy)-flow/],
  ["Weather", /(weather|wind|rain|sun|illuminance)/],
  ["Entities", /./],
];
const examples = computed(() => {
  const out = new Map<string, string[]>();
  for (const [key, yaml] of Object.entries(PRESETS)) {
    const type = /type:\s*(\S+)/.exec(yaml)?.[1] ?? "";
    const group = GROUPS.find(([, re]) => re.test(type))![0];
    out.set(group, [...(out.get(group) ?? []), key]);
  }
  return GROUPS.map(([g]) => [g, out.get(g) ?? []] as const).filter(([, l]) => l.length);
});
const openExample = (key: string, close: () => void) => {
  load(PRESETS[key], key);
  close();
};

// ----- the panes -----

const narrow = ref(false);
let mq: MediaQueryList | null = null;
const onMq = () => {
  narrow.value = !!mq?.matches;
  if (!narrow.value && view.value === "preview") view.value = editable.value.length ? "visual" : "yaml";
};
const split = ref(50);
const SPLIT = "pro-cards:playground:split";
const app = ref<HTMLElement | null>(null);
const drag = (ev: PointerEvent) => {
  const el = app.value;
  if (!el) return;
  const box = el.getBoundingClientRect();
  const move = (e: PointerEvent) => {
    split.value = Math.min(75, Math.max(25, ((e.clientX - box.left) / box.width) * 100));
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    try {
      localStorage.setItem(SPLIT, String(Math.round(split.value)));
    } catch {
      // refused: not remembered
    }
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  ev.preventDefault();
};

onMounted(async () => {
  mq = window.matchMedia("(max-width: 860px)");
  mq.addEventListener("change", onMq);
  onMq();
  try {
    const s = Number(localStorage.getItem(SPLIT));
    if (s >= 25 && s <= 75) split.value = s;
  } catch {
    // refused: the middle
  }
  saved.value = listSaved();
  // a link's card, else the draft, else the first example
  const linked = location.hash ? await decodeShare(location.hash) : null;
  if (linked) {
    load(linked.yaml, linked.name);
    history.replaceState(null, "", location.pathname + location.search);
  } else {
    const draft = loadDraft();
    if (draft) load(draft.yaml, draft.name, draft.id);
    else load(PRESETS[Object.keys(PRESETS)[0]], Object.keys(PRESETS)[0]);
  }
  ready.value = true;
  await nextTick();
  void syncEditor();
});
onBeforeUnmount(() => {
  unsubscribe?.();
  mq?.removeEventListener("change", onMq);
});
</script>

<template>
  <div ref="app" class="pg" :class="{ narrow }">
    <header class="pg-bar">
      <input
        v-model="name"
        class="pg-name"
        type="text"
        spellcheck="false"
        :placeholder="typeName(cards[0])"
        aria-label="Name of this card"
      />
      <Menu label="Examples" title="Start from an example">
        <template #default="{ close }">
          <div v-for="[group, keys] in examples" :key="group" class="pg-group">
            <div class="pg-group-title">{{ group }}</div>
            <button
              v-for="k in keys"
              :key="k"
              type="button"
              class="pg-item"
              @click="openExample(k, close)"
            >
              {{ k }}
            </button>
          </div>
        </template>
      </Menu>
      <Menu label="Saved" title="Cards saved in this browser" @click="saved = listSaved()">
        <template #default="{ close }">
          <p v-if="!saved.length" class="pg-empty">
            Nothing saved yet. Save keeps the card in this browser.
          </p>
          <div v-for="s in saved" :key="s.id" class="pg-saved" :class="{ current: s.id === id }">
            <button type="button" class="pg-item grow" @click="open(s, close)">
              <span>{{ s.name }}</span>
              <small>{{ ago(s.updated) }}</small>
            </button>
            <button
              type="button"
              class="pg-del"
              :class="{ confirm: confirmDelete === s.id }"
              :title="confirmDelete === s.id ? 'Click again to delete' : 'Delete'"
              @click="remove(s)"
            >
              {{ confirmDelete === s.id ? "Delete?" : "✕" }}
            </button>
          </div>
        </template>
      </Menu>
      <template v-if="!narrow">
        <button type="button" class="tb-btn" title="Save in this browser" @click="save">
          Save
        </button>
        <button type="button" class="tb-btn" title="Start a new card" @click="fresh">New</button>
      </template>
      <span class="grow"></span>
      <button v-if="!narrow" type="button" class="tb-btn" title="Copy the YAML" @click="copyYaml">
        Copy YAML
      </button>
      <!-- a phone: one row, the rest in ⋯ -->
      <Menu v-else label="⋯" title="More" align="right">
        <template #default="{ close }">
          <button type="button" class="pg-item" @click="(save(), close())">Save</button>
          <button type="button" class="pg-item" @click="(fresh(), close())">New</button>
          <button type="button" class="pg-item" @click="(copyYaml(), close())">Copy YAML</button>
        </template>
      </Menu>
      <button type="button" class="tb-btn primary" title="Copy a link to this card" @click="share">
        Share
      </button>
    </header>

    <div class="pg-body" :style="narrow ? undefined : { gridTemplateColumns: `${split}% 6px 1fr` }">
      <!-- on a phone the preview keeps this pane's tabs, so the way back stays -->
      <section class="pg-pane" :class="{ collapsed: narrow && view === 'preview' }">
        <div class="pg-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="view === 'visual'"
            :disabled="!editable.length"
            :title="editable.length ? 'Edit with the card\'s own form' : 'The visual editor edits tiles, posters, layout and swipe cards'"
            @click="view = 'visual'"
          >
            Visual
          </button>
          <button type="button" role="tab" :aria-selected="view === 'yaml'" @click="view = 'yaml'">
            YAML
          </button>
          <button
            v-if="narrow"
            type="button"
            role="tab"
            :aria-selected="view === 'preview'"
            @click="view = 'preview'"
          >
            Preview
          </button>
          <span class="grow"></span>
          <select
            v-if="view === 'visual' && editable.length > 1"
            v-model="pick"
            class="pg-pick"
            title="The card to edit"
          >
            <option v-for="i in editable" :key="i" :value="i">{{ cardLabel(cards[i], i) }}</option>
          </select>
        </div>
        <div v-show="view === 'visual' && editable.length" class="pg-visual ha-theme">
          <div ref="editorHost"></div>
        </div>
        <div v-show="view === 'yaml'" class="pg-yaml">
          <YamlEditor v-model="text" :error="error" />
        </div>
        <div v-if="error" class="pg-error" role="status">
          <b>{{ error.line ? `Line ${error.line}:` : "Error:" }}</b> {{ error.message }}
        </div>
      </section>
      <div
        v-if="!narrow"
        class="pg-split"
        role="separator"
        aria-orientation="vertical"
        @pointerdown="drag"
      ></div>
      <section v-show="!narrow || view === 'preview'" class="pg-pane">
        <PreviewPane
          :cards="liveCards"
          :pick="pick"
          @grid="setGrid"
          @error="configError = $event"
        />
      </section>
    </div>
    <div v-if="toast" class="pg-toast" role="status">{{ toast }}</div>
  </div>
</template>
