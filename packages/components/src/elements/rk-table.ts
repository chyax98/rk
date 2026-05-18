// ─── rk-table ────────────────────────────────────────────────────

/**
 * Parse a markdown pipe table into rows of cells.
 * Lines starting with | are data rows.
 * Separator lines (---) are skipped.
 */
function parsePipeTable(raw: string): string[][] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: string[][] = [];
  for (const line of lines) {
    // Skip separator lines like | --- | --- |
    if (
      /^\|[\s\-:]+\|$/.test(line) ||
      /^[\s\-:|]+$/.test(line.replace(/\|/g, '').trim() === '' ? '' : 'x')
    ) {
      // Better separator detection
      const cells = line.split('|').map((c) => c.trim());
      const isSep = cells.every((c) => /^[\s\-:]*$/.test(c));
      if (isSep) continue;
    }
    // Also check simpler separator pattern
    if (/^\|?\s*[-:]+[\s|:-]*$/.test(line)) continue;

    // Parse cells
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

class RkTable extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['title', 'profile'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.textContent || '';
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const title = this.getAttribute('title') || '';
    const profile = this.getAttribute('profile') || '';

    const rows = parsePipeTable(this._raw);
    if (rows.length === 0) {
      this.innerHTML = `<div class="rk-table"><div class="rk-table__title">${this._escape(title)}</div><p style="color:var(--rk-muted)">No table data</p></div>`;
      return;
    }

    const header = rows[0];
    const body = rows.slice(1);

    const profileClass = profile ? `rk-table--${profile}` : '';

    // Status profile: add colored dots
    const headerHtml = header.map((h) => `<th>${this._escape(h)}</th>`).join('');
    const bodyHtml = body
      .map((row) => {
        const cells = row
          .map((cell, ci) => {
            let content = this._escape(cell);
            // Status profile: first column gets colored dot
            if (profile === 'status' && ci === 0) {
              const lower = cell.toLowerCase().trim();
              let dotClass = '';
              if (
                lower.includes('healthy') ||
                lower.includes('ok') ||
                lower.includes('green') ||
                lower.includes('pass')
              ) {
                dotClass = 'healthy';
              } else if (
                lower.includes('degraded') ||
                lower.includes('warn') ||
                lower.includes('warning') ||
                lower.includes('yellow')
              ) {
                dotClass = 'degraded';
              } else if (
                lower.includes('critical') ||
                lower.includes('error') ||
                lower.includes('fail') ||
                lower.includes('red') ||
                lower.includes('down')
              ) {
                dotClass = 'critical';
              }
              if (dotClass) {
                content = `<span class="rk-status-dot rk-status-dot--${dotClass}"></span>${content}`;
              }
            }
            return `<td>${content}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    this.innerHTML = /* html */ `
      <div class="rk-table ${profileClass}">
        ${title ? `<div class="rk-table__title">${this._escape(title)}</div>` : ''}
        <div class="rk-table__wrap">
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

customElements.define('rk-table', RkTable);

export { parsePipeTable, RkTable };
