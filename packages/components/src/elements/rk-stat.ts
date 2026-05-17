// ─── rk-stat ────────────────────────────────────────────────────
class RkStat extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['value', 'unit', 'label', 'delta', 'tone'];
  }

  connectedCallback(): void {
    this._raw = this.innerHTML.trim();
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw !== '' || this.hasAttribute('value')) this._render();
  }

  _render(): void {
    const value = this.getAttribute('value') || '';
    const unit = this.getAttribute('unit') || '';
    const label = this.getAttribute('label') || '';
    const delta = this.getAttribute('delta') || '';
    const tone = this.getAttribute('tone') || '';

    let toneClass = '';
    if (tone === 'positive' || tone === 'success') toneClass = 'rk-stat--positive';
    else if (tone === 'negative' || tone === 'danger') toneClass = 'rk-stat--negative';
    else if (tone === 'neutral') toneClass = 'rk-stat--neutral';

    let deltaHtml = '';
    if (delta) {
      const parsed = parseFloat(delta);
      let direction = 'neutral';
      let arrow = '';
      if (!isNaN(parsed) && parsed > 0) {
        direction = 'up';
        arrow = '↑';
      } else if (!isNaN(parsed) && parsed < 0) {
        direction = 'down';
        arrow = '↓';
      } else if (delta.startsWith('+') || delta.startsWith('↑')) {
        direction = 'up';
        arrow = '↑';
      } else if (delta.startsWith('-') || delta.startsWith('↓')) {
        direction = 'down';
        arrow = '↓';
      }
      deltaHtml = `<span class="rk-stat__delta rk-stat__delta--${direction}">${arrow} ${this._escape(delta.replace(/^[↑↓+-]/, ''))}</span>`;
    }

    this.innerHTML = /* html */ `
      <div class="rk-stat ${toneClass}">
        <div class="rk-stat__label">${this._escape(label)}</div>
        <div>
          <span class="rk-stat__value">${this._escape(value)}</span>${unit ? `<span class="rk-stat__unit">${this._escape(unit)}</span>` : ''}
        </div>
        ${deltaHtml}
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-stat', RkStat);

export { RkStat };
