// ─── rk-steps ──────────────────────────────────────────────────
class RkSteps extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['current'];
  }

  connectedCallback(): void {
    this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const current = parseInt(this.getAttribute('current') || '1', 10);
    const steps = Array.from(this.querySelectorAll('rk-step'));

    if (steps.length === 0) {
      this.innerHTML = `<div class="rk-steps"><p style="color:var(--rk-muted)">No steps found. Use &lt;rk-step&gt; inside.</p></div>`;
      return;
    }

    const items = steps
      .map((step, i) => {
        const n = i + 1;
        const label = step.getAttribute('label') || step.textContent?.trim() || `Step ${n}`;
        let status = 'next';
        if (n < current) status = 'done';
        else if (n === current) status = 'active';

        const circle = status === 'done' ? '✓' : `${n}`;
        const itemHtml = `
          <div class="rk-steps__item rk-steps__item--${status}">
            <div class="rk-steps__circle">${circle}</div>
            <div class="rk-steps__label">${this._escape(label)}</div>
          </div>`;
        const connector = i < steps.length - 1
          ? '<div class="rk-steps__connector"></div>'
          : '';
        return itemHtml + connector;
      })
      .join('');

    this.innerHTML = /* html */ `
      <div class="rk-steps">
        <div class="rk-steps__track">${items}</div>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-steps', RkSteps);

export { RkSteps };
