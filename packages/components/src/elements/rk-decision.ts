// ─── rk-decision ──────────────────────────────────────────────────
class RkDecision extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['question', 'chosen', 'status'];
  }

  connectedCallback(): void {
    this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const question = this.getAttribute('question') || '';
    const chosen = this.getAttribute('chosen') || '';
    const status = this.getAttribute('status') || 'proposed';

    // Read rationale from <rk-reason> child elements
    const reasons = this.querySelectorAll('rk-reason li');
    const rationaleItems = Array.from(reasons)
      .map((li) => `<li>${li.textContent || ''}</li>`)
      .join('');

    // Read alternatives from <rk-alternative> child elements
    const alternatives = this.querySelectorAll('rk-alternative');
    const altItems = Array.from(alternatives)
      .map((alt) => `<li>${alt.textContent || ''}</li>`)
      .join('');

    let statusClass = 'proposed';
    if (['approved', 'draft', 'blocked', 'resolved'].includes(status)) {
      statusClass = status;
    }

    this.innerHTML = /* html */ `
      <div class="rk-decision">
        <div class="rk-decision__eyebrow">Decision</div>
        ${question ? `<h3 class="rk-decision__question">${this._escape(question)}</h3>` : ''}
        ${
          chosen
            ? `
          <div class="rk-decision__chosen">
            <span>Chosen: <strong>${this._escape(chosen)}</strong></span>
            <span class="rk-decision__status rk-decision__status--${statusClass}">${this._escape(status)}</span>
          </div>
        `
            : ''
        }
        ${
          rationaleItems
            ? `
          <div class="rk-decision__rationale">
            <h4>Rationale</h4>
            <ul>${rationaleItems}</ul>
          </div>
        `
            : ''
        }
        ${
          altItems
            ? `
          <div class="rk-decision__alternatives">
            <h4>Alternatives Considered</h4>
            <ul>${altItems}</ul>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-decision', RkDecision);

export { RkDecision };
