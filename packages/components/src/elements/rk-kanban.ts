// ─── rk-kanban & rk-kanban-col & rk-kanban-card ──────────────────────────────
// Usage:
//   <rk-kanban>
//     <rk-kanban-col title="待办">
//       <rk-kanban-card priority="high" tag="bug">修复登录问题</rk-kanban-card>
//       <rk-kanban-card>更新文档</rk-kanban-card>
//     </rk-kanban-col>
//     <rk-kanban-col title="进行中" accent="blue">
//       <rk-kanban-card assignee="张三" tag="feature">重写 CLI</rk-kanban-card>
//     </rk-kanban-col>
//     <rk-kanban-col title="完成" done>
//       <rk-kanban-card>建立 worktree</rk-kanban-card>
//     </rk-kanban-col>
//   </rk-kanban>

class RkKanbanCard extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['priority', 'tag', 'assignee', 'due'];
  }

  connectedCallback(): void {
    if (!this._raw) this._raw = (this.textContent || '').trim();
    this._render();
  }
  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const priority = this.getAttribute('priority') || '';
    const tag = this.getAttribute('tag') || '';
    const assignee = this.getAttribute('assignee') || '';
    const due = this.getAttribute('due') || '';
    const text = this._raw;

    const priorityColors: Record<string, string> = {
      high: 'var(--rk-tone-danger-border, #dc2626)',
      medium: 'var(--rk-tone-warning-border, #d97706)',
      low: 'var(--rk-tone-info-border, #2563eb)',
    };
    const priorityBg: Record<string, string> = {
      high: 'var(--rk-tone-danger-bg, #fef2f2)',
      medium: 'var(--rk-tone-warning-bg, #fffbeb)',
      low: 'var(--rk-tone-info-bg, #eff6ff)',
    };

    const borderColor = priority
      ? priorityColors[priority] || 'var(--rk-border)'
      : 'var(--rk-border)';

    this.innerHTML = `
      <div class="rk-kanban-card" style="
        background:var(--rk-surface,#fff);
        border:1px solid var(--rk-border,#e5e4dc);
        border-left:3px solid ${borderColor};
        border-radius:var(--rk-radius-md,10px);
        padding:var(--rk-space-3,12px) var(--rk-space-4,16px);
        margin-bottom:var(--rk-space-2,8px);
        box-shadow:var(--rk-shadow-xs,0 1px 2px rgba(0,0,0,0.06));
        cursor:default;
      ">
        ${
          tag || priority
            ? `
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
            ${
              tag
                ? `<span style="
              font:600 10px/1.4 var(--rk-font-sans,sans-serif);
              text-transform:uppercase;letter-spacing:0.05em;
              padding:2px 6px;border-radius:4px;
              background:var(--rk-accent-muted,rgba(2,103,165,0.1));
              color:var(--rk-accent,#0267a5);
            ">${this._escape(tag)}</span>`
                : ''
            }
            ${
              priority
                ? `<span style="
              font:600 10px/1.4 var(--rk-font-sans,sans-serif);
              text-transform:uppercase;letter-spacing:0.05em;
              padding:2px 6px;border-radius:4px;
              background:${priorityBg[priority] || 'var(--rk-surface-2)'};
              color:${priorityColors[priority] || 'var(--rk-text-muted)'};
            ">${priority === 'high' ? '↑ 高优' : priority === 'medium' ? '→ 中' : '↓ 低'}</span>`
                : ''
            }
          </div>
        `
            : ''
        }
        <div style="
          font:var(--rk-weight-normal,400) var(--rk-text-sm,13px)/1.6 var(--rk-font-sans,sans-serif);
          color:var(--rk-text,#1a1a1a);
        ">${this._escape(text)}</div>
        ${
          assignee || due
            ? `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
            ${
              assignee
                ? `<span style="
              font:500 11px/1 var(--rk-font-sans,sans-serif);
              color:var(--rk-text-tertiary,#6b6b66);
            ">@${this._escape(assignee)}</span>`
                : '<span></span>'
            }
            ${
              due
                ? `<span style="
              font:400 11px/1 var(--rk-font-sans,sans-serif);
              color:var(--rk-muted,#a0a0a0);
            ">${this._escape(due)}</span>`
                : ''
            }
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

class RkKanbanCol extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'accent', 'done'];
  }

  connectedCallback(): void {
    this._upgradeCards();
    this._renderShell();
  }
  attributeChangedCallback(): void {
    this._renderShell();
  }

  _upgradeCards(): void {
    // cards render themselves; just ensure they're slotted after shell renders
  }

  _renderShell(): void {
    const title = this.getAttribute('title') || 'Column';
    const done = this.hasAttribute('done');
    const accent = this.getAttribute('accent') || (done ? 'green' : '');

    const accentColor =
      accent === 'green'
        ? 'var(--rk-tone-success-border,#16a34a)'
        : accent === 'blue'
          ? 'var(--rk-tone-info-border,#2563eb)'
          : accent === 'orange'
            ? 'var(--rk-tone-warning-border,#d97706)'
            : accent === 'red'
              ? 'var(--rk-tone-danger-border,#dc2626)'
              : 'var(--rk-border,#e5e4dc)';

    // Collect existing cards before re-rendering
    const existingCards = Array.from(this.querySelectorAll('rk-kanban-card'));
    const cardCount = existingCards.length;

    // Apply column styles
    this.style.cssText = `
      display:flex;flex-direction:column;
      min-width:220px;flex:1;
      background:var(--rk-surface,#fafafa);
      border:1px solid var(--rk-border,#e5e4dc);
      border-top:3px solid ${accentColor};
      border-radius:var(--rk-radius-lg,14px);
      padding:var(--rk-space-4,16px);
      min-height:200px;
    `;

    // Insert header if not present
    let header = this.querySelector('.rk-kanban-col__header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'rk-kanban-col__header';
      this.insertBefore(header, this.firstChild);
    }

    (header as HTMLElement).style.cssText = `
      display:flex;justify-content:space-between;align-items:center;
      margin-bottom:var(--rk-space-3,12px);
    `;
    header.innerHTML = `
      <span style="
        font:600 13px/1.4 var(--rk-font-sans,sans-serif);
        color:var(--rk-text,#1a1a1a);
        letter-spacing:0.01em;
      ">${this._escape(title)}</span>
      <span style="
        font:600 11px/1.4 var(--rk-font-sans,sans-serif);
        color:var(--rk-text-tertiary,#6b6b66);
        background:var(--rk-surface-2,#eee);
        padding:2px 7px;border-radius:9999px;
      ">${cardCount}</span>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

class RkKanban extends HTMLElement {
  connectedCallback(): void {
    this.style.cssText = `
      display:flex;gap:var(--rk-space-4,16px);
      overflow-x:auto;
      padding-bottom:var(--rk-space-2,8px);
    `;

    // Add scroll fade hint
    if (!this.querySelector('.rk-kanban__scroll-hint')) {
      const hint = document.createElement('style');
      hint.textContent = `.rk-kanban { scrollbar-width:thin; }`;
      this.appendChild(hint);
    }
  }
}

customElements.define('rk-kanban-card', RkKanbanCard);
customElements.define('rk-kanban-col', RkKanbanCol);
customElements.define('rk-kanban', RkKanban);
