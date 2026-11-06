// A heading inside a form's section, between groups of fields (an Appearance section's Icon and
// Visual), as a selector field of our own (`selector: { pro_cards_heading: { text } }`: ha-selector
// renders `ha-selector-<type>` by its name). It holds no value and sends none.
export const HEADING = "pro_cards_heading";

const STYLE = `
  :host { display: block; }
  .heading { margin: 8px 0 0; padding: 12px 0 0; border-top: 1px solid var(--divider-color, rgba(0,0,0,.12));
    font-size: 14px; font-weight: 500; letter-spacing: .1px; color: var(--secondary-text-color); }
`;

export class HeadingSelector extends HTMLElement {
  _text = "";
  set selector(s: Record<string, { text?: string } | undefined>) {
    this._text = s?.[HEADING]?.text ?? "";
    this._draw();
  }
  // (a field's label and value: none of its own)
  set label(_v: string) {}
  set value(_v: unknown) {}
  set hass(_h: unknown) {}
  _draw() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${STYLE}</style><div class="heading" role="heading" aria-level="3"></div>`;
    root.querySelector(".heading")!.textContent = this._text;
  }
}

if (!customElements.get(`ha-selector-${HEADING}`))
  customElements.define(`ha-selector-${HEADING}`, HeadingSelector);
