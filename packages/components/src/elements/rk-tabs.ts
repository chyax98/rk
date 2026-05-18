// ─── rk-tabs ──────────────────────────────────────────────────
class RkTabs extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['title'];
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
    const tabs = Array.from(this.querySelectorAll('rk-tab'));
    if (tabs.length === 0) {
      this.innerHTML = `<div class="rk-tabs"><p style="color:var(--rk-muted)">No tabs found. Use &lt;rk-tab label="…"&gt; inside.</p></div>`;
      return;
    }

    const navBtns = tabs
      .map((tab, i) => {
        const label = tab.getAttribute('label') || `Tab ${i + 1}`;
        const id = tab.getAttribute('id') || `tab-${i}`;
        const active = i === 0 ? ' is-active' : '';
        return `<button class="rk-tabs__btn${active}" data-tab="${id}" role="tab" aria-selected="${i === 0}">${this._escape(label)}</button>`;
      })
      .join('');

    const panels = tabs
      .map((tab, i) => {
        const id = tab.getAttribute('id') || `tab-${i}`;
        const active = i === 0 ? ' is-active' : '';
        return `<div class="rk-tabs__panel${active}" data-tab="${id}" role="tabpanel">${tab.innerHTML}</div>`;
      })
      .join('');

    this.innerHTML = /* html */ `
      <div class="rk-tabs">
        ${title ? `<div class="rk-tabs__title">${this._escape(title)}</div>` : ''}
        <div class="rk-tabs__nav" role="tablist">${navBtns}</div>
        <div class="rk-tabs__panels">${panels}</div>
      </div>
    `;

    // Bind click handlers
    this.querySelectorAll('.rk-tabs__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = (btn as HTMLElement).dataset.tab;
        // Deactivate all
        this.querySelectorAll('.rk-tabs__btn').forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        this.querySelectorAll('.rk-tabs__panel').forEach((p) => {
          p.classList.remove('is-active');
        });
        // Activate target
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        this.querySelector(`.rk-tabs__panel[data-tab="${targetId}"]`)?.classList.add('is-active');
      });
    });
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-tabs', RkTabs);

export { RkTabs };
