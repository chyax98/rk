// ─── rk-badge & rk-badge-group ───────────────────────────────────────────────
// Usage:
//   <rk-badge-group>
//     <rk-badge color="blue">TypeScript</rk-badge>
//     <rk-badge color="green" icon="✓">Done</rk-badge>
//   </rk-badge-group>
//
//   <rk-badge color="orange">实验性</rk-badge>  (standalone)
//
// color: blue | green | red | orange | purple | gray | accent (default)

class RkBadge extends HTMLElement {
  static get observedAttributes() {
    return ['color', 'icon'];
  }

  connectedCallback(): void { this._render(); }
  attributeChangedCallback(): void { this._render(); }

  _render(): void {
    const color = this.getAttribute('color') || 'accent';
    const icon = this.getAttribute('icon') || '';
    const text = this.textContent?.trim() || '';

    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      blue:   { bg: 'var(--rk-tone-info-bg, #eff6ff)',     text: 'var(--rk-tone-info-border, #2563eb)',    border: 'var(--rk-tone-info-border, #2563eb)' },
      green:  { bg: 'var(--rk-tone-success-bg, #f0fdf4)',  text: 'var(--rk-tone-success-border, #16a34a)', border: 'var(--rk-tone-success-border, #16a34a)' },
      red:    { bg: 'var(--rk-tone-danger-bg, #fef2f2)',   text: 'var(--rk-tone-danger-border, #dc2626)',  border: 'var(--rk-tone-danger-border, #dc2626)' },
      orange: { bg: 'var(--rk-tone-warning-bg, #fffbeb)',  text: 'var(--rk-tone-warning-border, #d97706)', border: 'var(--rk-tone-warning-border, #d97706)' },
      purple: { bg: 'rgba(139,92,246,0.1)',                text: '#7c3aed',                                border: '#7c3aed' },
      gray:   { bg: 'var(--rk-surface, #f5f5f4)',          text: 'var(--rk-text-tertiary, #6b6b66)',       border: 'var(--rk-border, #e5e4dc)' },
      accent: { bg: 'var(--rk-accent-muted, rgba(2,103,165,0.1))', text: 'var(--rk-accent, #0267a5)',  border: 'var(--rk-accent, #0267a5)' },
    };
    const c = colorMap[color] || colorMap.accent;

    this.innerHTML = `<span class="rk-badge rk-badge--${color}" style="
      display:inline-flex;align-items:center;gap:4px;
      padding:2px 8px;border-radius:var(--rk-radius-full,9999px);
      font:var(--rk-weight-medium,500) var(--rk-text-xs,11px)/1.6 var(--rk-font-sans,sans-serif);
      letter-spacing:var(--rk-tracking-wide,0.02em);
      background:${c.bg};color:${c.text};
      border:1px solid ${c.border};
      white-space:nowrap;
    ">${icon ? `<span>${icon}</span>` : ''}<span>${this._escape(text)}</span></span>`;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

class RkBadgeGroup extends HTMLElement {
  connectedCallback(): void {
    if (!this.style.display) {
      this.style.cssText = `
        display:flex;flex-wrap:wrap;gap:var(--rk-space-2,8px);
        align-items:center;
      `;
    }
  }
}

customElements.define('rk-badge', RkBadge);
customElements.define('rk-badge-group', RkBadgeGroup);
