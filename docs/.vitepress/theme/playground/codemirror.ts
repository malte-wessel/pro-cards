// CodeMirror for the Playground's YAML, in one module so the page loads it lazily: the editor
// (line numbers, folding, search, brackets; undo and redo are the Playground's), YAML, and a theme
// from VitePress's colours.
import { basicSetup } from "codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { HighlightStyle, syntaxHighlighting, indentUnit } from "@codemirror/language";
import { linter, lintGutter } from "@codemirror/lint";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { tags as t } from "@lezer/highlight";

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

// what the Playground checks and completes in the YAML (schema-check.ts): problems with their
// place, and what fits at the cursor
export interface Check {
  problems(text: string): { from: number; to: number; message: string }[];
  complete(
    text: string,
    pos: number,
  ): {
    from: number;
    options: { label: string; detail?: string; apply?: string; type: string }[];
  } | null;
}
// (the completion's context as CodeMirror hands it over)
interface CompletionContext {
  state: EditorState;
  pos: number;
  explicit: boolean;
  matchBefore(re: RegExp): { from: number; to: number; text: string } | null;
}

// `history`: the Playground's undo and redo, which take the keys before CodeMirror's own (one
// history for the YAML and the visual editor); `check`: the schema's errors marked where they are,
// and its keys and values offered as you type
export const createEditor = (
  parent: HTMLElement,
  doc: string,
  onChange: (text: string) => void,
  history: { undo(): void; redo(): void },
  check: Check,
) => {
  // the completion source, one for the editor's life (a new one per call would restart it)
  const complete = (ctx: CompletionContext) => {
    // a word being typed, or asked for (Ctrl+Space)
    const word = ctx.matchBefore(/[\w$.-]*/);
    if (!ctx.explicit && (!word || word.from === word.to)) return null;
    const r = check.complete(ctx.state.doc.toString(), ctx.pos);
    return r ? { from: r.from, options: r.options, validFor: /^[\w$.-]*$/ } : null;
  };
  return new EditorView({
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
        linter(
          (view) =>
            check
              .problems(view.state.doc.toString())
              .map((p) => ({ ...p, severity: "error" as const })),
          { delay: 400 },
        ),
        EditorState.languageData.of(() => [{ autocomplete: complete }]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
};
