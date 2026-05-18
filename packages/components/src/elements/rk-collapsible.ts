// ─── rk-collapsible ──────────────────────────────────────────────
class RkCollapsible extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['summary', 'open'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
    if (this._raw) this._render();
  }

  _render(): void {
    const summary = this.getAttribute('summary') || 'Details';
    const isOpen = this.hasAttribute('open');

    this.innerHTML = /* html */ `
      <details class="rk-collapsible"${isOpen ? ' open' : ''}>
        <summary class="rk-collapsible__summary">
          <span class="rk-collapsible__icon">▶</span>
          <span>${this._escape(summary)}</span>
        </summary>
        <div class="rk-collapsible__body">${this._raw}</div>
      </details>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-collapsible', RkCollapsible);

export { RkCollapsible };
