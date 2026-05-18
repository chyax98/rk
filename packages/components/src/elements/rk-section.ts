// ─── rk-section ──────────────────────────────────────────────────

class RkSection extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['title', 'subtitle', 'level', 'divider'];
  }

  connectedCallback(): void {
    this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const title = this.getAttribute('title') || '';
    const subtitle = this.getAttribute('subtitle') || '';
    // level: h2 | h3 | h4 (default h2)
    const level = this.getAttribute('level') || 'h2';
    const hasDivider = this.hasAttribute('divider');

    const safeLevel = ['h2', 'h3', 'h4'].includes(level) ? level : 'h2';
    const dividerClass = hasDivider ? ' rk-section--divider' : '';

    this.innerHTML = /* html */ `
      <section class="rk-section${dividerClass}">
        ${title ? `
        <div class="rk-section__header">
          <${safeLevel} class="rk-section__title">${this._escape(title)}</${safeLevel}>
          ${subtitle ? `<p class="rk-section__subtitle">${this._escape(subtitle)}</p>` : ''}
        </div>` : ''}
        <div class="rk-section__body">${this._raw}</div>
      </section>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-section', RkSection);

export { RkSection };
