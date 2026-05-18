// ─── rk-timeline ──────────────────────────────────────────────────
class RkTimeline extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['title'];
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
    const title = this.getAttribute('title') || '';

    // Read steps from <rk-step> child elements
    const steps = this.querySelectorAll('rk-step');
    const stepHtml = Array.from(steps)
      .map((step, i) => {
        const status = step.getAttribute('status') || 'next';
        const tags = step.getAttribute('tags') || '';
        const text = step.textContent || '';

        let statusClass = 'next';
        if (['done', 'active', 'next'].includes(status)) {
          statusClass = status;
        }

        const tagHtml = tags
          ? `<div class="rk-timeline__tags">${tags
              .split(',')
              .map((t) => `<span>${this._escape(t.trim())}</span>`)
              .join('')}</div>`
          : '';

        return /* html */ `
          <li class="rk-timeline__step rk-timeline__step--${statusClass}">
            <span class="rk-timeline__num">${i + 1}</span>
            <div class="rk-timeline__body">
              <div class="rk-timeline__body-label">${this._escape(`Step ${i + 1}`)}</div>
              <p class="rk-timeline__body-desc">${this._escape(text)}</p>
              ${tagHtml}
            </div>
          </li>
        `;
      })
      .join('');

    this.innerHTML = /* html */ `
      <div class="rk-timeline">
        ${title ? `<div class="rk-timeline__title">${this._escape(title)}</div>` : ''}
        <ol class="rk-timeline__steps">${stepHtml}</ol>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-timeline', RkTimeline);

export { RkTimeline };
