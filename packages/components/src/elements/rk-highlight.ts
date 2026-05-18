// ─── rk-highlight ──────────────────────────────────────────────────
class RkHighlight extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['label'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const label = this.getAttribute('label') || '要点';

    this.innerHTML = /* html */ `
      <div class="rk-highlight">
        <span class="rk-highlight__label">${this._escape(label)}</span>
        <div class="rk-highlight__body">${this._raw}</div>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-highlight', RkHighlight);

export { RkHighlight };
