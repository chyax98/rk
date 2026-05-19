// ─── rk-callout ──────────────────────────────────────────────────
const ICONS: Record<string, string> = {
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  danger: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
  tip: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  decision: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 17-3.5-2"/><path d="M6 12l-2-1"/><path d="m18 11-2 1"/><circle cx="12" cy="12" r="3"/></svg>`,
  note: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
};

class RkCallout extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['tone', 'type', 'title'];
  }

  connectedCallback(): void {
    // Prevent double-render when nested inside another callout's content
    // (caused by agent writing self-closing <rk-callout /> which the HTML5 parser treats as an open tag)
    if (this.parentElement?.closest('.rk-callout__content')) return;
    this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
    if (this._raw) this._render();
  }

  _render(): void {
    // Accept both `tone` and `type` attributes (agents often use `type`)
    const tone = this.getAttribute('tone') || this.getAttribute('type') || 'info';
    const title = this.getAttribute('title') || '';
    const icon = ICONS[tone] || ICONS.info;

    this.innerHTML = /* html */ `
      <div class="rk-callout rk-callout--${tone}">
        <span class="rk-callout__icon">${icon}</span>
        <div class="rk-callout__body">
          ${title ? `<div class="rk-callout__title">${this._escape(title)}</div>` : ''}
          <div class="rk-callout__content">${this._raw}</div>
        </div>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-callout', RkCallout);

export { RkCallout };
