<script setup lang="ts">
// The Playground's YAML: CodeMirror 6 with YAML highlighting, loaded on this page only, in the
// site's colours (VitePress's variables, so it follows light and dark). An error with a line is
// marked on that line.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  modelValue: string;
  error: { message: string; line?: number } | null;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const host = ref<HTMLDivElement | null>(null);
type CM = typeof import("./codemirror.ts");
let cm: CM | null = null;
let view: import("@codemirror/view").EditorView | null = null;

// the error as a lint mark on its line (none: no marks)
const mark = () => {
  if (!view || !cm) return;
  const doc = view.state.doc;
  const e = props.error;
  const line = e?.line && e.line <= doc.lines ? doc.line(e.line) : null;
  view.dispatch(
    cm.setDiagnostics(view.state, line && e
      ? [{ from: line.from, to: line.to, severity: "error", message: e.message }]
      : []),
  );
};

onMounted(async () => {
  cm = await import("./codemirror.ts");
  if (!host.value) return;
  view = cm.createEditor(host.value, props.modelValue, (text) => emit("update:modelValue", text));
  mark();
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
watch(() => props.error, mark);

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
