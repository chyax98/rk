// ─── rk-progress ──────────────────────────────────────────────────
class RkProgress extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['label', 'value', 'max', 'tone'];
  }

  connectedCallback(): void {
    this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const label = this.getAttribute('label') || '';
    const rawValue = parseFloat(this.getAttribute('value') || '0');
    const max = parseFloat(this.getAttribute('max') || '100');
    const tone = this.getAttribute('tone') || 'default';
    const pct = Math.min(100, Math.max(0, (rawValue / max) * 100));
    const displayValue = Math.round(rawValue);

    this.innerHTML = /* html */ `
      <div class="rk-progress">
        <div class="rk-progress__header">
          ${label ? `<span class="rk-progress__label">${this._escape(label)}</span>` : ''}
          <span class="rk-progress__value">${displayValue}%</span>
        </div>
        <div class="rk-progress__track">
          <div class="rk-progress__fill rk-progress__fill--${tone}" style="width:${pct}%"></div>
        </div>
        ${this._raw ? `<div class="rk-progress__extra">${this._raw}</div>` : ''}
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-progress', RkProgress);

export { RkProgress };
