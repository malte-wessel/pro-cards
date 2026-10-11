// The `render_template` subscriptions of a card: one per unique template string, their latest
// results, and a callback when one of them changes. Used by every card that renders templates.
import type { HomeAssistant } from "./ha.ts";

type Unsubscribe = () => unknown;

export class TemplateSubscriptions {
  results = new Map<string, unknown>();
  _unsub = new Map<string, Promise<Unsubscribe | null>>();
  _type: string;
  _onChange: () => void;

  constructor(type: string, onChange: () => void) {
    this._type = type;
    this._onChange = onChange;
  }

  get size() {
    return this._unsub.size;
  }

  // subscribes the templates in `wanted` that are not yet subscribed and drops the others (with
  // their results; a template still wanted keeps its result, the server only pushes changes)
  sync(conn: HomeAssistant["connection"] | undefined, wanted: Set<string> | undefined) {
    if (!wanted) return;
    for (const tpl of [...this.results.keys()]) if (!wanted.has(tpl)) this.results.delete(tpl);
    if (!conn) return;
    for (const [tpl, p] of [...this._unsub])
      if (!wanted.has(tpl)) {
        this._unsub.delete(tpl);
        p.then((u) => u && u()).catch(() => {});
      }
    for (const tpl of wanted) {
      if (this._unsub.has(tpl)) continue;
      const p: Promise<Unsubscribe | null> = conn
        .subscribeMessage<{ result?: unknown }>(
          (msg) => {
            const r = msg?.result;
            if (this.results.get(tpl) !== r) {
              this.results.set(tpl, r);
              this._onChange();
            }
          },
          { type: "render_template", template: tpl, timeout: 3, report_errors: false },
        )
        .catch((e) => {
          console.warn(`${this._type}: template failed`, tpl, e);
          return null;
        });
      this._unsub.set(tpl, p);
    }
  }

  // ends every subscription (the card left the page); the results stay for its return
  clear() {
    for (const p of this._unsub.values()) p.then((u) => u && u()).catch(() => {});
    this._unsub = new Map();
  }
}
