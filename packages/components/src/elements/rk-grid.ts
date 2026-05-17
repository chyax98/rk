// ─── rk-grid ──────────────────────────────────────────────────
class RkGrid extends HTMLElement {
  private _rendered = false;

  static get observedAttributes() {
    return ['cols', 'gap'];
  }

  connectedCallback(): void {
    if (this._rendered) return;
    this._rendered = true;
    this._build();
  }

  private _build(): void {
    const cols = this.getAttribute('cols') || '2';
    const gap = this.getAttribute('gap') || 'md';
    const colCount = ['2', '3', '4'].includes(cols) ? cols : '2';

    // Collect direct children BEFORE modifying DOM
    const children = Array.from(this.children);
    const isColBased = children.some((c) => c.tagName.toLowerCase() === 'rk-col');
    const cells = isColBased
      ? children.filter((c) => c.tagName.toLowerCase() === 'rk-col')
      : children;

    // Create grid container
    const grid = document.createElement('div');
    grid.className = `rk-grid rk-grid--cols-${colCount} rk-grid--gap-${gap}`;

    // Move child nodes (not serialize) → no duplicate connectedCallback
    for (const cell of cells) {
      const wrapper = document.createElement('div');
      wrapper.className = 'rk-grid__cell';
      wrapper.appendChild(cell); // DOM move, not clone
      grid.appendChild(wrapper);
    }

    this.innerHTML = '';
    this.appendChild(grid);
  }
}

customElements.define('rk-grid', RkGrid);

export { RkGrid };
