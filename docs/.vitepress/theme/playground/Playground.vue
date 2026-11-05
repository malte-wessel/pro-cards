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
import { undoStack } from "./undo.ts";
import {
  decodeShare,
  isUnsaved,
  keepUnsaved,
  deleteSaved,
  encodeShare,
  listSaved,
  loadDraft,
  putSaved,
  saveDraft,
  type Draft,
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
const warnings = ref<string[]>([]);
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
// ----- undo and redo: one history of the YAML, whatever changed it -----
// (Material Design Icons' undo and redo)
const UNDO_PATH =
  "M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z";
const REDO_PATH =
  "M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03 1.54,15.22L3.9,16C4.95,12.81 7.95,10.5 11.5,10.5C13.45,10.5 15.23,11.22 16.62,12.38L13,16H22V7L18.4,10.6Z";
// (a step carries the card's name too: an example undone takes its name back with it)
const steps = undoStack<{ text: string; name: string }>({ text: "", name: "" }, {
  key: (v) => v.text,
});
// what the history allows now (its buttons)
const canUndo = ref(false);
const canRedo = ref(false);
// the next change: typed in the YAML (joins the step being typed), or an undo or a redo (none)
let typing = false;
let stepping = false;
const typed = (t: string) => {
  if (t === text.value) return;
  typing = true;
  text.value = t;
};
const step = (to: { text: string; name: string } | null) => {
  if (to === null || to.text === text.value) return;
  stepping = true;
  text.value = to.text;
  name.value = to.name;
};
const undo = () => step(steps.undo());
const redo = () => step(steps.redo());
watch(text, (t) => {
  clearTimeout(timer);
  if (stepping) stepping = false;
  else steps.record({ text: t, name: name.value }, typing);
  typing = false;
  [canUndo.value, canRedo.value] = [steps.canUndo(), steps.canRedo()];
  if (fromEditor) {
    fromEditor = false;
    live.value = t;
  } else {
    timer = setTimeout(() => (live.value = t), 300);
    void syncEditor();
  }
  scheduleDraft();
});
// the keys anywhere on the page (CodeMirror hands its own over): a field being typed in keeps the
// browser's undo of its text
const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const KEYS = IS_MAC ? { undo: "⌘Z", redo: "⇧⌘Z" } : { undo: "Ctrl+Z", redo: "Ctrl+Y" };
const onKey = (ev: KeyboardEvent) => {
  if (ev.defaultPrevented || !(IS_MAC ? ev.metaKey : ev.ctrlKey) || ev.altKey) return;
  const key = ev.key.toLowerCase();
  const back = key === "z" && !ev.shiftKey;
  const forth = (key === "z" && ev.shiftKey) || (key === "y" && !IS_MAC);
  if (!back && !forth) return;
  const target = ev.composedPath()[0] as HTMLElement | undefined;
  if (target?.closest?.(".cm-editor")) return;
  if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable))
    return;
  ev.preventDefault();
  if (back) undo();
  else redo();
};
watch(name, scheduleDraft);

// another card in its place: one with unsaved changes is kept among the saved ones first (an
// example, New or a link never loses your work)
const KNOWN = [NEW_CARD, ...Object.values(PRESETS)];
const keep = (d: Draft) => {
  if (!isUnsaved(d, KNOWN)) return;
  let doc: unknown = null;
  try {
    doc = yamlLib.load(d.yaml);
  } catch {
    // text that fails: named as a card
  }
  const entry = keepUnsaved(d, typeName(listOf(doc)[0]));
  saved.value = listSaved();
  say(`Your changes are kept in Saved as “${entry.name}”`);
};
const load = (yaml: string, as: string, savedId?: string) => {
  if (ready.value && yaml !== text.value) keep({ name: name.value, yaml: text.value, id: id.value });
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
      const yaml = dumpYaml(Array.isArray(parsed.value.doc) ? next : next[0]);
      // (the same text changes nothing, and must leave no flag for the next change)
      if (yaml === text.value) return;
      fromEditor = true;
      text.value = yaml;
    });
    editorHost.value.replaceChildren(editor);
  }
  editor.setConfig(JSON.parse(JSON.stringify(card)));
};
watch([pick, editorHost, () => editable.value.length], () => void syncEditor());

// the picked card's grid size from the preview, into its YAML
const setGrid = (g: { columns?: number | "full"; rows?: number | "auto" }) => {
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
    keepSplit();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  ev.preventDefault();
};
const keepSplit = () => {
  try {
    localStorage.setItem(SPLIT, String(Math.round(split.value)));
  } catch {
    // refused: not remembered
  }
};
// the splitter by the keyboard: the arrows by 5 %, Home and End to its ends
const splitKey = (ev: KeyboardEvent) => {
  const to =
    ev.key === "ArrowLeft"
      ? split.value - 5
      : ev.key === "ArrowRight"
        ? split.value + 5
        : ev.key === "Home"
          ? 25
          : ev.key === "End"
            ? 75
            : null;
  if (to === null) return;
  ev.preventDefault();
  split.value = Math.min(75, Math.max(25, to));
  keepSplit();
};

// the card a link carries in the hash, opened and the hash cleared (a reload keeps your edits)
const openLink = async () => {
  const linked = location.hash ? await decodeShare(location.hash) : null;
  if (!linked) return false;
  // opened with the page: the draft it replaces is the one in the browser
  const draft = ready.value ? null : loadDraft();
  if (draft && draft.yaml !== linked.yaml) keep(draft);
  load(linked.yaml, linked.name);
  history.replaceState(null, "", location.pathname + location.search);
  return true;
};
// a link pasted into the address bar of an open Playground
const onHash = () => void openLink();

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
  if (!(await openLink())) {
    const draft = loadDraft();
    if (draft) load(draft.yaml, draft.name, draft.id);
    else load(PRESETS[Object.keys(PRESETS)[0]], Object.keys(PRESETS)[0]);
  }
  window.addEventListener("hashchange", onHash);
  window.addEventListener("keydown", onKey);
  // the history starts at the card the page opened with
  steps.reset({ text: text.value, name: name.value });
  [canUndo.value, canRedo.value] = [false, false];
  ready.value = true;
  await nextTick();
  void syncEditor();
});
onBeforeUnmount(() => {
  unsubscribe?.();
  mq?.removeEventListener("change", onMq);
  window.removeEventListener("hashchange", onHash);
  window.removeEventListener("keydown", onKey);
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
        <span class="pg-steps">
          <button
            type="button"
            class="tb-btn icon"
            :title="`Undo (${KEYS.undo})`"
            aria-label="Undo"
            :disabled="!canUndo"
            @click="undo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="UNDO_PATH" /></svg>
          </button>
          <button
            type="button"
            class="tb-btn icon"
            :title="`Redo (${KEYS.redo})`"
            aria-label="Redo"
            :disabled="!canRedo"
            @click="redo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="REDO_PATH" /></svg>
          </button>
        </span>
      </template>
      <span class="grow"></span>
      <button v-if="!narrow" type="button" class="tb-btn" title="Copy the YAML" @click="copyYaml">
        Copy YAML
      </button>
      <!-- a phone: one row, the rest in ⋯ -->
      <Menu v-else label="⋯" title="More" align="right">
        <template #default="{ close }">
          <button type="button" class="pg-item" :disabled="!canUndo" @click="(undo(), close())">
            Undo
          </button>
          <button type="button" class="pg-item" :disabled="!canRedo" @click="(redo(), close())">
            Redo
          </button>
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
            :title="editable.length ? 'Edit with the card\'s own form' : 'The visual editor edits tiles, posters, tile groups, headings, layout, swipe, sun path, sun azimuth and multi trend cards'"
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
          <YamlEditor :model-value="text" @update:model-value="typed" @undo="undo" @redo="redo" />
        </div>
        <div v-if="error" class="pg-error" role="status">
          <b>{{ error.line ? `Line ${error.line}:` : "Error:" }}</b> {{ error.message }}
        </div>
        <!-- what the card warns of: it draws, leaving something out -->
        <div v-else-if="warnings.length" class="pg-warnings" role="status">
          <p v-for="w in warnings" :key="w"><b>Warning:</b> {{ w }}</p>
        </div>
      </section>
      <div
        v-if="!narrow"
        class="pg-split"
        role="separator"
        tabindex="0"
        aria-orientation="vertical"
        aria-label="Resize the panes"
        aria-valuemin="25"
        aria-valuemax="75"
        :aria-valuenow="Math.round(split)"
        @pointerdown="drag"
        @keydown="splitKey"
      ></div>
      <section v-show="!narrow || view === 'preview'" class="pg-pane">
        <PreviewPane
          :cards="liveCards"
          :pick="pick"
          @grid="setGrid"
          @error="configError = $event"
          @warnings="warnings = $event"
        />
      </section>
    </div>
    <div v-if="toast" class="pg-toast" role="status">{{ toast }}</div>
  </div>
</template>
