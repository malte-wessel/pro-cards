<script setup lang="ts">
// The Playground's YAML: CodeMirror 6 with YAML highlighting, loaded on this page only, in the
// site's colours (VitePress's variables, so it follows light and dark). It is checked against the
// cards' schemas as you type, the problems marked where they are (a YAML error too), and offers
// the keys and values that fit where the cursor is.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{ modelValue: string }>();
// typed: the text as typed; undo and redo: the keys for them, taken from CodeMirror's own history
const emit = defineEmits<{
  "update:modelValue": [value: string];
  undo: [];
  redo: [];
}>();

const host = ref<HTMLDivElement | null>(null);
let view: import("@codemirror/view").EditorView | null = null;

onMounted(async () => {
  const [cm, check] = await Promise.all([import("./codemirror.ts"), import("./schema-check.ts")]);
  if (!host.value) return;
  view = cm.createEditor(
    host.value,
    props.modelValue,
    (text) => emit("update:modelValue", text),
    { undo: () => emit("undo"), redo: () => emit("redo") },
    { problems: check.problemsOf, complete: check.completionsAt },
  );
});
onBeforeUnmount(() => view?.destroy());

// a change from outside (the visual editor, an example): the text replaced, the cursor kept
watch(
  () => props.modelValue,
  (text) => {
    if (!view || text === view.state.doc.toString()) return;
    const head = Math.min(view.state.selection.main.head, text.length);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
      selection: { anchor: head },
    });
  },
);

defineExpose({ focus: () => view?.focus() });
</script>

<template>
  <div ref="host" class="yaml-editor"></div>
</template>

<style scoped>
.yaml-editor {
  height: 100%;
  min-height: 0;
}
.yaml-editor :deep(.cm-editor) {
  height: 100%;
}
</style>
