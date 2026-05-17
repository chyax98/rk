// ─── rk-grid ──────────────────────────────────────────────────
class RkGrid extends HTMLElement {
  private _cols: string[] = [];
  private _rendered = false;

  static get observedAttributes() {
    return ['cols', 'gap'];
  }

  connectedCallback(): void {
    if (this._rendered) return;
    // Capture child content BEFORE browser upgrades child Web Components
    const cols = Array.from(this.querySelectorAll('rk-col'));
    if (cols.length > 0) {
      this._cols = cols.map((c) => c.innerHTML);
    } else {
      // No rk-col wrapper — treat entire innerHTML as single cell
      this._cols = [this.innerHTML];
    }
    this._rendered = true;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._rendered) this._render();
  }

  _render(): void {
    const cols = this.getAttribute('cols') || '2';
    const gap = this.getAttribute('gap') || 'md';
    const colCount = ['2', '3', '4'].includes(cols) ? cols : '2';

    const content = this._cols
      .map((html) => `<div class="rk-grid__cell">${html}</div>`)
      .join('');

    this.innerHTML = /* html */ `
      <div class="rk-grid rk-grid--cols-${colCount} rk-grid--gap-${gap}">
        ${content}
      </div>
    `;
  }
}

customElements.define('rk-grid', RkGrid);

export { RkGrid };
