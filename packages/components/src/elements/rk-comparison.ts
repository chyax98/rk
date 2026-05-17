// ─── rk-comparison ──────────────────────────────────────────────────

function parsePipeTable(raw: string): string[][] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: string[][] = [];
  for (const line of lines) {
    if (/^\|?\s*[-:]+[\s|:-]*$/.test(line)) continue;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

class RkComparison extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['title', 'variant'];
  }

  connectedCallback(): void {
    this._raw = this.textContent || '';
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const title = this.getAttribute('title') || '';
    const variant = this.getAttribute('variant') || 'proscons';

    const rows = parsePipeTable(this._raw);
    if (rows.length === 0) {
      this.innerHTML = `<div class="rk-comparison"><div class="rk-comparison__title">${this._escape(title)}</div><p style="color:var(--rk-muted)">No comparison data</p></div>`;
      return;
    }

    if (variant === 'matrix') {
      this._renderMatrix(title, rows);
    } else {
      this._renderProsCons(title, rows);
    }
  }

  _renderProsCons(title: string, rows: string[][]): void {
    // First column header + items = pros, second = cons
    const header = rows[0];
    const prosTitle = header[0] || 'Pros';
    const consTitle = header[1] || 'Cons';
    const body = rows.slice(1);

    const pros = body.map((r) => r[0] || '').filter(Boolean);
    const cons = body.map((r) => r[1] || '').filter(Boolean);

    this.innerHTML = /* html */ `
      <div class="rk-comparison rk-comparison--proscons">
        ${title ? `<div class="rk-comparison__title">${this._escape(title)}</div>` : ''}
        <div class="rk-comparison__table">
          <div class="rk-comparison__column">
            <div class="rk-comparison__column-title">${this._escape(prosTitle)}</div>
            <ul>${pros.map((p) => `<li>${this._escape(p)}</li>`).join('')}</ul>
          </div>
          <div class="rk-comparison__column">
            <div class="rk-comparison__column-title">${this._escape(consTitle)}</div>
            <ul>${cons.map((c) => `<li>${this._escape(c)}</li>`).join('')}</ul>
          </div>
        </div>
      </div>
    `;
  }

  _renderMatrix(title: string, rows: string[][]): void {
    const header = rows[0];
    const body = rows.slice(1);

    const headerHtml = header.map((h) => `<th>${this._escape(h)}</th>`).join('');
    const bodyHtml = body
      .map((row) => {
        const cells = row.map((c) => `<td>${this._escape(c)}</td>`).join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    this.innerHTML = /* html */ `
      <div class="rk-comparison rk-comparison--matrix">
        ${title ? `<div class="rk-comparison__title">${this._escape(title)}</div>` : ''}
        <div class="rk-comparison__table">
          <table>
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-comparison', RkComparison);

export { RkComparison };
