// ─── rk-metric ──────────────────────────────────────────────────
class RkMetric extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['cols'];
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
    const rawCols = this.getAttribute('cols') || '4';
    const cols = ['2', '3', '4'].includes(rawCols) ? rawCols : '4';
    const items = Array.from(this.querySelectorAll('rk-metric-item'));

    if (items.length === 0) {
      this.innerHTML = `<div class="rk-metric"><p style="color:var(--rk-muted)">No metric items found. Use &lt;rk-metric-item label="…" value="…"&gt; inside.</p></div>`;
      return;
    }

    const cards = items
      .map((item) => {
        const label = item.getAttribute('label') || '';
        const value = item.getAttribute('value') || '—';
        const delta = item.getAttribute('delta') || '';
        const tone = item.getAttribute('tone') || '';

        const deltaHtml = delta
          ? `<span class="rk-metric__delta${tone ? ` rk-metric__delta--${tone}` : ''}">${this._escape(delta)}</span>`
          : '';

        return `
          <div class="rk-metric__card">
            <div class="rk-metric__value-row">
              <span class="rk-metric__value">${this._escape(value)}</span>
              ${deltaHtml}
            </div>
            <div class="rk-metric__label">${this._escape(label)}</div>
          </div>`;
      })
      .join('');

    this.innerHTML = /* html */ `
      <div class="rk-metric rk-metric--cols-${cols}">
        ${cards}
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-metric', RkMetric);

export { RkMetric };
