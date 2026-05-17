// ─── rk-checklist ──────────────────────────────────────────────────
class RkChecklist extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['title'];
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

    // Read items from <rk-item> child elements
    const items = this.querySelectorAll('rk-item');
    const itemHtml = Array.from(items)
      .map((item) => {
        const checked = item.hasAttribute('checked');
        const note = item.getAttribute('note') || '';
        const text = item.textContent || '';
        const checkedClass = checked ? ' is-checked' : '';
        const checkMark = checked ? '✓' : '';

        return /* html */ `
          <li class="rk-checklist__item${checkedClass}">
            <span class="rk-checklist__check">${checkMark}</span>
            <span class="rk-checklist__text">
              ${this._escape(text)}
              ${note ? `<span class="rk-checklist__note">${this._escape(note)}</span>` : ''}
            </span>
          </li>
        `;
      })
      .join('');

    this.innerHTML = /* html */ `
      <div class="rk-checklist">
        ${title ? `<div class="rk-checklist__title">${this._escape(title)}</div>` : ''}
        <ul class="rk-checklist__list">${itemHtml}</ul>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-checklist', RkChecklist);

export { RkChecklist };
