// CodeMirror for the Playground's YAML, in one module so the page loads it lazily: the editor
// (line numbers, folding, search, brackets; undo and redo are the Playground's), YAML, and a theme
// from VitePress's colours.
import { basicSetup } from "codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { HighlightStyle, syntaxHighlighting, indentUnit } from "@codemirror/language";
import { lintGutter, setDiagnostics } from "@codemirror/lint";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { tags as t } from "@lezer/highlight";

export { setDiagnostics };

// the editor in the site's look: its background, text and code colours
const theme = EditorView.theme({
  "&": {
    color: "var(--vp-c-text-1)",
    backgroundColor: "var(--vp-code-block-bg, var(--vp-c-bg-alt))",
    fontSize: "13px",
  },
  ".cm-content": { fontFamily: "var(--vp-font-family-mono)", padding: "12px 0" },
  ".cm-scroller": { fontFamily: "var(--vp-font-family-mono)", lineHeight: "1.6" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--vp-c-text-3)",
    border: "none",
  },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "var(--vp-c-default-soft)" },
  ".cm-cursor": { borderLeftColor: "var(--vp-c-text-1)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--vp-c-brand-soft)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-tooltip": {
    backgroundColor: "var(--vp-c-bg-elv)",
    border: "1px solid var(--vp-c-divider)",
    color: "var(--vp-c-text-1)",
  },
  ".cm-panels": { backgroundColor: "var(--vp-c-bg-soft)", color: "var(--vp-c-text-1)" },
  ".cm-foldPlaceholder": {
    backgroundColor: "var(--vp-c-default-soft)",
    border: "none",
    color: "var(--vp-c-text-2)",
  },
});
const highlight = HighlightStyle.define([
  { tag: [t.propertyName, t.definition(t.propertyName)], color: "var(--vp-c-brand-1)" },
  { tag: [t.string, t.special(t.string)], color: "var(--vp-c-green-1)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--vp-c-yellow-1)" },
  { tag: [t.comment, t.lineComment], color: "var(--vp-c-text-3)", fontStyle: "italic" },
  { tag: [t.punctuation, t.separator, t.bracket], color: "var(--vp-c-text-2)" },
  { tag: [t.keyword, t.meta, t.typeName, t.labelName], color: "var(--vp-c-purple-1)" },
]);

// `history`: the Playground's undo and redo, which take the keys before CodeMirror's own (one
// history for the YAML and the visual editor)
export const createEditor = (
  parent: HTMLElement,
  doc: string,
  onChange: (text: string) => void,
  history: { undo(): void; redo(): void },
) =>
  new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        Prec.highest(
          keymap.of([
            { key: "Mod-z", run: () => (history.undo(), true), preventDefault: true },
            { key: "Mod-Shift-z", run: () => (history.redo(), true), preventDefault: true },
            { key: "Mod-y", run: () => (history.redo(), true), preventDefault: true },
          ]),
        ),
        basicSetup,
        keymap.of([indentWithTab]),
        indentUnit.of("  "),
        EditorState.tabSize.of(2),
        yaml(),
        lintGutter(),
        theme,
        syntaxHighlighting(highlight),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
