// ─── rk-card ──────────────────────────────────────────────────────

class RkCard extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['title', 'subtitle', 'variant', 'accent'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const title = this.getAttribute('title') || '';
    const subtitle = this.getAttribute('subtitle') || '';
    // variant: default | outlined | elevated | filled
    const variant = this.getAttribute('variant') || 'default';
    // accent: none | info | success | warning | danger
    const accent = this.getAttribute('accent') || '';

    const variantClass = variant !== 'default' ? ` rk-card--${variant}` : '';
    const accentClass = accent ? ` rk-card--accent-${accent}` : '';

    this.innerHTML = /* html */ `
      <div class="rk-card${variantClass}${accentClass}">
        ${title || subtitle ? `
        <div class="rk-card__header">
          ${title ? `<div class="rk-card__title">${this._escape(title)}</div>` : ''}
          ${subtitle ? `<div class="rk-card__subtitle">${this._escape(subtitle)}</div>` : ''}
        </div>` : ''}
        <div class="rk-card__body">${this._raw}</div>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-card', RkCard);

export { RkCard };
