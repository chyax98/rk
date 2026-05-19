// ─── rk-diff ─────────────────────────────────────────────────────

/**
 * rk-diff — unified diff viewer
 *
 * Accepts unified diff format (from `git diff` or similar) as text content.
 * Lines starting with + are additions, - are deletions, @@ are hunks.
 *
 * Attributes:
 *   lang     — syntax hint shown in header (e.g. "typescript")
 *   title    — optional header title
 *   from     — original file name (shown in header)
 *   to       — modified file name (shown in header)
 *   compact  — if present, hide unchanged context lines
 */

class RkDiff extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['lang', 'title', 'from', 'to', 'compact'];
  }

  connectedCallback(): void {
    this._raw = this.textContent || '';
    this._render();
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
    if (this._raw) this._render();
  }

  _render(): void {
    const lang = this.getAttribute('lang') || '';
    const title = this.getAttribute('title') || '';
    const from = this.getAttribute('from') || '';
    const to = this.getAttribute('to') || '';

    const lines = this._raw.split('\n');
    const parsed = this._parseLines(lines);
    const stats = this._stats(parsed);

    // Build header
    let headerTitle = title;
    if (!headerTitle && (from || to)) {
      headerTitle = from && to ? `${from} → ${to}` : from || to;
    }

    const langBadge = lang
      ? `<span class="rk-diff__lang">${this._escape(lang)}</span>`
      : '';
    const statsBadge = `
      ${stats.added > 0 ? `<span class="rk-diff__stat rk-diff__stat--add">+${stats.added}</span>` : ''}
      ${stats.removed > 0 ? `<span class="rk-diff__stat rk-diff__stat--del">-${stats.removed}</span>` : ''}
    `;

    const headerHtml = /* html */ `
      <div class="rk-diff__header">
        <div class="rk-diff__header-left">
          <svg class="rk-diff__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
          ${headerTitle ? `<span class="rk-diff__title">${this._escape(headerTitle)}</span>` : ''}
          ${langBadge}
        </div>
        <div class="rk-diff__header-right">${statsBadge}</div>
      </div>
    `;

    const bodyHtml = this._renderLines(parsed);

    this.innerHTML = /* html */ `
      <div class="rk-diff">
        ${headerHtml}
        <div class="rk-diff__body">
          <table class="rk-diff__table" aria-label="Code diff">
            <tbody>${bodyHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  _parseLines(lines: string[]): Array<{ type: 'add' | 'del' | 'ctx' | 'hunk' | 'meta'; text: string; lineOld?: number; lineNew?: number }> {
    const result: Array<{ type: 'add' | 'del' | 'ctx' | 'hunk' | 'meta'; text: string; lineOld?: number; lineNew?: number }> = [];
    let lineOld = 0;
    let lineNew = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // Parse hunk header: @@ -old,count +new,count @@
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          lineOld = parseInt(match[1], 10);
          lineNew = parseInt(match[2], 10);
        }
        result.push({ type: 'hunk', text: line });
      } else if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff ') || line.startsWith('index ')) {
        result.push({ type: 'meta', text: line });
      } else if (line.startsWith('+')) {
        result.push({ type: 'add', text: line.slice(1), lineOld: undefined, lineNew: lineNew++ });
      } else if (line.startsWith('-')) {
        result.push({ type: 'del', text: line.slice(1), lineOld: lineOld++, lineNew: undefined });
      } else if (line.startsWith(' ') || line === '') {
        const txt = line.startsWith(' ') ? line.slice(1) : line;
        result.push({ type: 'ctx', text: txt, lineOld: lineOld++, lineNew: lineNew++ });
      } else {
        // bare line (no prefix) — treat as context for simple diffs
        result.push({ type: 'ctx', text: line, lineOld: lineOld++, lineNew: lineNew++ });
      }
    }
    return result;
  }

  _stats(parsed: Array<{ type: string }>): { added: number; removed: number } {
    let added = 0;
    let removed = 0;
    for (const l of parsed) {
      if (l.type === 'add') added++;
      else if (l.type === 'del') removed++;
    }
    return { added, removed };
  }

  _renderLines(parsed: Array<{ type: 'add' | 'del' | 'ctx' | 'hunk' | 'meta'; text: string; lineOld?: number; lineNew?: number }>): string {
    // Skip leading meta lines (--- +++ diff index)
    const rows: string[] = [];

    for (const line of parsed) {
      if (line.type === 'meta') continue;

      if (line.type === 'hunk') {
        rows.push(`
          <tr class="rk-diff__row rk-diff__row--hunk">
            <td class="rk-diff__gutter rk-diff__gutter--hunk" colspan="2"></td>
            <td class="rk-diff__code rk-diff__code--hunk">${this._escape(line.text)}</td>
          </tr>
        `);
        continue;
      }

      const typeClass = `rk-diff__row--${line.type}`;
      const oldNum = line.lineOld !== undefined ? String(line.lineOld) : '';
      const newNum = line.lineNew !== undefined ? String(line.lineNew) : '';
      const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' ';

      rows.push(`
        <tr class="rk-diff__row ${typeClass}">
          <td class="rk-diff__gutter rk-diff__gutter--old">${oldNum}</td>
          <td class="rk-diff__gutter rk-diff__gutter--new">${newNum}</td>
          <td class="rk-diff__code"><span class="rk-diff__prefix">${prefix}</span><span class="rk-diff__text">${this._escape(line.text)}</span></td>
        </tr>
      `);
    }

    return rows.join('');
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-diff', RkDiff);

export { RkDiff };
