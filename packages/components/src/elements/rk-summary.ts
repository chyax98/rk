// ─── rk-summary ─────────────────────────────────────────────────
class RkSummary extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['title'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.innerHTML.trim();
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const title = this.getAttribute('title') || 'Summary';

    this.innerHTML = /* html */ `
      <div class="rk-summary">
        <div class="rk-summary__title">${this._escape(title)}</div>
        <div class="rk-summary__content">${this._raw}</div>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-summary', RkSummary);

export { RkSummary };
