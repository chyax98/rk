// ─── rk-image ──────────────────────────────────────────────────
class RkImage extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['src', 'alt', 'caption', 'credit', 'width'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const src = this.getAttribute('src') || '';
    const alt = this.getAttribute('alt') || '';
    const caption = this.getAttribute('caption') || '';
    const credit = this.getAttribute('credit') || '';
    const width = this.getAttribute('width') || 'normal';

    if (!src) {
      this.innerHTML = `<div class="rk-image rk-image--${width}"><p style="color:var(--rk-muted)">rk-image requires a src attribute.</p></div>`;
      return;
    }

    const figcaption =
      caption || credit
        ? `<figcaption class="rk-image__caption">
          ${caption ? `<span>${this._escape(caption)}</span>` : ''}
          ${credit ? `<span class="rk-image__credit">${this._escape(credit)}</span>` : ''}
        </figcaption>`
        : '';

    this.innerHTML = /* html */ `
      <figure class="rk-image rk-image--${width}">
        <div class="rk-image__wrap">
          <img src="${this._escapeAttr(src)}" alt="${this._escapeAttr(alt)}" loading="lazy">
        </div>
        ${figcaption}
      </figure>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  _escapeAttr(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

customElements.define('rk-image', RkImage);

export { RkImage };
