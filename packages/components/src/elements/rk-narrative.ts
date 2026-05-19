// ─── rk-narrative ────────────────────────────────────────────────
// Inline text with embedded mini-sparklines, value highlights, badges.
// No external CDN needed — pure vanilla SVG/HTML.
//
// Usage:
//   <rk-narrative>
//   {
//     "phrases": [
//       {"text": "Revenue reached "},
//       {"value": "¥2.4M", "trend": "up", "delta": "+23%"},
//       {"text": " this quarter, with "},
//       {"sparkline": [120,145,132,178,210,198,240], "color": "green"},
//       {"text": " showing growth."}
//     ]
//   }
//   </rk-narrative>

type Phrase =
  | { text: string }
  | { value: string; trend?: 'up' | 'down' | 'flat'; delta?: string; color?: string }
  | { sparkline: number[]; color?: string; height?: number }
  | { bar: number; max: number; color?: string }
  | { badge: string; color?: string };

class RkNarrative extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['title'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.textContent?.trim() || '';
    this._render();
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
    if (this._raw) this._render();
  }

  _render(): void {
    const title = this.getAttribute('title') || '';
    let phrases: Phrase[];
    try {
      phrases = JSON.parse(this._raw).phrases;
      if (!Array.isArray(phrases)) throw new Error('phrases must be an array');
    } catch (e: any) {
      this.innerHTML = `<div class="rk-narrative"><div class="rk-narrative__error">Invalid JSON: ${this._esc(e.message)}</div></div>`;
      return;
    }

    const titleHtml = title ? `<div class="rk-narrative__title">${this._esc(title)}</div>` : '';
    const body = phrases.map((p) => this._renderPhrase(p)).join('');

    this.innerHTML = /* html */ `
      <div class="rk-narrative">
        ${titleHtml}
        <div class="rk-narrative__body">${body}</div>
      </div>
    `;
  }

  _renderPhrase(p: Phrase): string {
    if ('text' in p) {
      return this._esc((p as { text: string }).text);
    }

    if ('value' in p) {
      const v = p as { value: string; trend?: string; delta?: string; color?: string };
      const arrow = v.trend === 'up' ? '↑' : v.trend === 'down' ? '↓' : v.trend === 'flat' ? '→' : '';
      const colorCls = v.color ? ` rk-narrative__value--${v.color}` : '';
      const deltaHtml = v.delta
        ? `<span class="rk-narrative__delta${v.trend === 'up' ? ' rk-narrative__delta--up' : v.trend === 'down' ? ' rk-narrative__delta--down' : ''}">${this._esc(v.delta)}</span>`
        : '';
      const arrowHtml = arrow ? `<span class="rk-narrative__arrow${v.trend === 'up' ? ' rk-narrative__arrow--up' : v.trend === 'down' ? ' rk-narrative__arrow--down' : ''}">${arrow}</span>` : '';
      return `<span class="rk-narrative__value${colorCls}">${arrowHtml}${this._esc(v.value)}</span>${deltaHtml}`;
    }

    if ('sparkline' in p) {
      const s = p as { sparkline: number[]; color?: string; height?: number };
      return this._renderSparkline(s.sparkline, s.color || 'accent', s.height || 20);
    }

    if ('bar' in p) {
      const b = p as { bar: number; max: number; color?: string };
      const pct = Math.min(100, Math.max(0, (b.bar / b.max) * 100));
      const colorCls = b.color ? ` rk-narrative__minibar--${b.color}` : '';
      return `<span class="rk-narrative__minibar${colorCls}"><span class="rk-narrative__minibar-fill" style="width:${pct}%"></span></span>`;
    }

    if ('badge' in p) {
      const bd = p as { badge: string; color?: string };
      const colorCls = bd.color ? ` rk-narrative__badge--${bd.color}` : '';
      return `<span class="rk-narrative__badge${colorCls}">${this._esc(bd.badge)}</span>`;
    }

    return '';
  }

  _renderSparkline(data: number[], color: string, height: number): string {
    if (!data || data.length < 2) return '';
    const width = 60;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2;
    const h = height - pad * 2;

    const points = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = pad + h - ((v - min) / range) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const colorVar = color === 'accent' ? 'var(--rk-accent)' : `var(--rk-tone-${color}-border, var(--rk-accent))`;

    return `<span class="rk-narrative__sparkline"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><polyline points="${points}" fill="none" stroke="${colorVar}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  }

  _esc(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-narrative', RkNarrative);

export { RkNarrative };
