// ─── rk-grid ──────────────────────────────────────────────────
class RkGrid extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['cols', 'gap'];
  }

  connectedCallback(): void {
    this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const cols = this.getAttribute('cols') || '2';
    const gap = this.getAttribute('gap') || 'md';
    const colCount = ['2', '3', '4'].includes(cols) ? cols : '2';

    const cells = Array.from(this.querySelectorAll('rk-col'));
    const content = cells.length > 0
      ? cells.map((c) => `<div class="rk-grid__cell">${c.innerHTML}</div>`).join('')
      : this._raw;

    this.innerHTML = /* html */ `
      <div class="rk-grid rk-grid--cols-${colCount} rk-grid--gap-${gap}">
        ${content}
      </div>
    `;
  }
}

customElements.define('rk-grid', RkGrid);

export { RkGrid };
