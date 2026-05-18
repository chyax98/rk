// ─── rk-quote ──────────────────────────────────────────────────
class RkQuote extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['attribution', 'source', 'source-url'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const attribution = this.getAttribute('attribution') || '';
    const source = this.getAttribute('source') || '';
    const sourceUrl = this.getAttribute('source-url') || '';

    const sourceHtml = source
      ? sourceUrl
        ? ` <cite><a href="${this._escapeAttr(sourceUrl)}" target="_blank" rel="noopener">${this._escape(source)}</a></cite>`
        : ` <cite>${this._escape(source)}</cite>`
      : '';

    const figcaption =
      attribution || source
        ? `<figcaption class="rk-quote__attribution">
          ${attribution ? `— ${this._escape(attribution)}` : ''}${sourceHtml}
        </figcaption>`
        : '';

    this.innerHTML = /* html */ `
      <figure class="rk-quote">
        <blockquote class="rk-quote__body">${this._raw}</blockquote>
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

customElements.define('rk-quote', RkQuote);

export { RkQuote };
