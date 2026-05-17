// packages/components/src/elements/rk-callout.ts
var ICONS = {
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  danger: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
  tip: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  decision: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 17-3.5-2"/><path d="M6 12l-2-1"/><path d="m18 11-2 1"/><circle cx="12" cy="12" r="3"/></svg>`,
  note: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
};
var RkCallout = class extends HTMLElement {
  _raw = '';
  static get observedAttributes() {
    return ['tone', 'title'];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const tone = this.getAttribute('tone') || 'info';
    const title = this.getAttribute('title') || '';
    const icon = ICONS[tone] || ICONS['info'];
    this.innerHTML =
      /* html */
      `
      <div class="rk-callout rk-callout--${tone}">
        <span class="rk-callout__icon">${icon}</span>
        <div class="rk-callout__body">
          ${title ? `<div class="rk-callout__title">${this._escape(title)}</div>` : ''}
          <div class="rk-callout__content">${this._raw}</div>
        </div>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-callout', RkCallout);

// packages/components/src/elements/rk-stat.ts
var RkStat = class extends HTMLElement {
  _raw = '';
  static get observedAttributes() {
    return ['value', 'unit', 'label', 'delta', 'tone'];
  }
  connectedCallback() {
    this._raw = this.innerHTML.trim();
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw !== '' || this.hasAttribute('value')) this._render();
  }
  _render() {
    const value = this.getAttribute('value') || '';
    const unit = this.getAttribute('unit') || '';
    const label = this.getAttribute('label') || '';
    const delta = this.getAttribute('delta') || '';
    const tone = this.getAttribute('tone') || '';
    let toneClass = '';
    if (tone === 'positive' || tone === 'success') toneClass = 'rk-stat--positive';
    else if (tone === 'negative' || tone === 'danger') toneClass = 'rk-stat--negative';
    else if (tone === 'neutral') toneClass = 'rk-stat--neutral';
    let deltaHtml = '';
    if (delta) {
      const parsed = parseFloat(delta);
      let direction = 'neutral';
      let arrow = '';
      if (!isNaN(parsed) && parsed > 0) {
        direction = 'up';
        arrow = '\u2191';
      } else if (!isNaN(parsed) && parsed < 0) {
        direction = 'down';
        arrow = '\u2193';
      } else if (delta.startsWith('+') || delta.startsWith('\u2191')) {
        direction = 'up';
        arrow = '\u2191';
      } else if (delta.startsWith('-') || delta.startsWith('\u2193')) {
        direction = 'down';
        arrow = '\u2193';
      }
      deltaHtml = `<span class="rk-stat__delta rk-stat__delta--${direction}">${arrow} ${this._escape(delta.replace(/^[↑↓+-]/, ''))}</span>`;
    }
    this.innerHTML =
      /* html */
      `
      <div class="rk-stat ${toneClass}">
        <div class="rk-stat__label">${this._escape(label)}</div>
        <div>
          <span class="rk-stat__value">${this._escape(value)}</span>${unit ? `<span class="rk-stat__unit">${this._escape(unit)}</span>` : ''}
        </div>
        ${deltaHtml}
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-stat', RkStat);

// packages/components/src/elements/rk-summary.ts
var RkSummary = class extends HTMLElement {
  _raw = '';
  static get observedAttributes() {
    return ['title'];
  }
  connectedCallback() {
    this._raw = this.innerHTML.trim();
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute('title') || 'Summary';
    this.innerHTML =
      /* html */
      `
      <div class="rk-summary">
        <div class="rk-summary__title">${this._escape(title)}</div>
        <div class="rk-summary__content">${this._raw}</div>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-summary', RkSummary);

// packages/components/src/elements/rk-code.ts
var RkCode = class extends HTMLElement {
  _raw = '';
  static get observedAttributes() {
    return ['lang', 'title', 'frame', 'showlinenumbers', 'data-highlighted'];
  }
  connectedCallback() {
    this._raw = this.textContent || '';
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const lang = this.getAttribute('lang') || '';
    const title = this.getAttribute('title') || '';
    const frame = this.getAttribute('frame') || 'none';
    const showLineNumbers =
      this.hasAttribute('showlinenumbers') || this.hasAttribute('showLineNumbers');
    const highlighted = this.getAttribute('data-highlighted') || '';
    let frameClass = '';
    if (frame === 'editor') frameClass = 'rk-code--frame-editor';
    else if (frame === 'terminal') frameClass = 'rk-code--frame-terminal';
    let headerHtml = '';
    const showHeader = frame === 'editor' || frame === 'terminal' || title || lang;
    if (showHeader) {
      let dotsHtml = '';
      if (frame === 'editor' || frame === 'terminal') {
        dotsHtml = `<span class="rk-code__dots"><i></i><i></i><i></i></span>`;
      }
      let promptHtml = '';
      if (frame === 'terminal') {
        promptHtml = `<span class="rk-code__title" style="color:var(--rk-muted)">$</span>`;
      }
      headerHtml =
        /* html */
        `
        <div class="rk-code__header">
          ${dotsHtml}
          ${promptHtml}
          ${title ? `<span class="rk-code__title">${this._escape(title)}</span>` : ''}
          ${lang ? `<span class="rk-code__lang">${this._escape(lang)}</span>` : ''}
        </div>
      `;
    }
    let bodyContent = '';
    if (highlighted) {
      try {
        bodyContent = atob(highlighted);
      } catch {
        bodyContent = this._escapeHtml(this._raw);
      }
    } else {
      bodyContent = this._escapeHtml(this._raw);
    }
    if (showLineNumbers) {
      const lines = bodyContent.split('\n');
      if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
      }
      const rows = lines
        .map((line, i) => `<tr><td class="rk-ln">${i + 1}</td><td class="rk-lc">${line}</td></tr>`)
        .join('');
      bodyContent = `<table><tbody>${rows}</tbody></table>`;
    }
    this.innerHTML =
      /* html */
      `
      <div class="rk-code ${frameClass}">
        ${headerHtml}
        <div class="rk-code__body"><code>${bodyContent}</code></div>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  _escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};
customElements.define('rk-code', RkCode);

// packages/components/src/elements/rk-table.ts
function parsePipeTable(raw) {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const rows = [];
  for (const line of lines) {
    if (
      /^\|[\s\-:]+\|$/.test(line) ||
      /^[\s\-:|]+$/.test(line.replace(/\|/g, '').trim() === '' ? '' : 'x')
    ) {
      const cells2 = line.split('|').map((c) => c.trim());
      const isSep = cells2.every((c) => /^[\s\-:]*$/.test(c));
      if (isSep) continue;
    }
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
var RkTable = class extends HTMLElement {
  _raw = '';
  static get observedAttributes() {
    return ['title', 'profile'];
  }
  connectedCallback() {
    this._raw = this.textContent || '';
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
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
    const headerHtml = header.map((h) => `<th>${this._escape(h)}</th>`).join('');
    const bodyHtml = body
      .map((row) => {
        const cells = row
          .map((cell, ci) => {
            let content = this._escape(cell);
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
    this.innerHTML =
      /* html */
      `
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
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-table', RkTable);

// packages/components/src/elements/rk-chart.ts
function parsePipeTable2(raw) {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const rows = [];
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
var RkChart = class extends HTMLElement {
  _raw = '';
  _chartInstance = null;
  static get observedAttributes() {
    return ['type', 'title', 'caption', 'xfield', 'yfield'];
  }
  connectedCallback() {
    this._raw = this.textContent || '';
    this._render();
  }
  disconnectedCallback() {
    if (this._chartInstance) {
      this._chartInstance.dispose?.();
      this._chartInstance = null;
    }
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const type = this.getAttribute('type') || 'bar';
    const title = this.getAttribute('title') || '';
    const caption = this.getAttribute('caption') || '';
    if (type === 'kpi') {
      this._renderKpi(title, caption);
      return;
    }
    this._renderEcharts(type, title, caption);
  }
  _renderKpi(title, caption) {
    const rows = parsePipeTable2(this._raw);
    if (rows.length === 0) {
      this.innerHTML = `<div class="rk-chart rk-chart-kpi"><div class="rk-chart__title">${this._escape(title)}</div><p style="color:var(--rk-muted)">No data</p></div>`;
      return;
    }
    const header = rows[0];
    const body = rows.slice(1);
    const items = body
      .map((row) => {
        const value = row[0] || '';
        const label = row[1] || header[1] || '';
        return `<div class="rk-chart-kpi__item"><div class="rk-kpi-value">${this._escape(value)}</div><div class="rk-kpi-label">${this._escape(label)}</div></div>`;
      })
      .join('');
    this.innerHTML =
      /* html */
      `
      <div class="rk-chart rk-chart-kpi">
        ${title ? `<div class="rk-chart__title">${this._escape(title)}</div>` : ''}
        <div class="rk-chart-kpi__grid">${items}</div>
        ${caption ? `<div class="rk-chart__caption">${this._escape(caption)}</div>` : ''}
      </div>
    `;
  }
  async _renderEcharts(type, title, caption) {
    const rows = parsePipeTable2(this._raw);
    if (rows.length < 2) {
      this.innerHTML = `<div class="rk-chart"><div class="rk-chart__title">${this._escape(title)}</div><p style="color:var(--rk-muted)">Insufficient data for chart</p></div>`;
      return;
    }
    this.innerHTML =
      /* html */
      `
      <div class="rk-chart">
        ${title ? `<div class="rk-chart__title">${this._escape(title)}</div>` : ''}
        <div class="rk-chart__canvas" id="echarts-${this._uid()}"></div>
        ${caption ? `<div class="rk-chart__caption">${this._escape(caption)}</div>` : ''}
      </div>
    `;
    const container = this.querySelector('.rk-chart__canvas');
    if (!container) return;
    try {
      const echarts = await import('echarts');
      const chart = echarts.init(container);
      this._chartInstance = chart;
      const header = rows[0];
      const body = rows.slice(1);
      const xField = this.getAttribute('xfield') || header[0] || 'x';
      const yField = this.getAttribute('yfield') || header[1] || 'y';
      const xIdx = header.indexOf(xField);
      const yIdx = header.indexOf(yField);
      const xi = xIdx >= 0 ? xIdx : 0;
      const yi = yIdx >= 0 ? yIdx : 1;
      const xData = body.map((r) => r[xi] || '');
      const yData = body.map((r) => parseFloat(r[yi] || '0'));
      const seriesType = type === 'scatter' ? 'scatter' : type === 'pie' ? 'pie' : type;
      const option = {
        tooltip: { trigger: seriesType === 'pie' ? 'item' : 'axis' },
      };
      if (seriesType === 'pie') {
        option.series = [
          {
            type: 'pie',
            data: body.map((r, i) => ({
              name: r[xi] || `Item ${i + 1}`,
              value: parseFloat(r[yi] || '0'),
            })),
          },
        ];
      } else {
        option.xAxis = { type: 'category', data: xData };
        option.yAxis = { type: 'value' };
        option.series = [{ type: seriesType, data: yData }];
      }
      chart.setOption(option);
      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(container);
    } catch (err) {
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">ECharts load failed: ${this._escape(err?.message || String(err))}</div>`;
    }
  }
  _uid() {
    return Math.random().toString(36).slice(2, 9);
  }
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-chart', RkChart);

// packages/components/src/elements/rk-diagram.ts
var RkDiagram = class extends HTMLElement {
  _raw = '';
  _observer = null;
  static get observedAttributes() {
    return ['title', 'caption', 'engine'];
  }
  connectedCallback() {
    this._raw = (this.textContent || '').trim();
    this._render();
  }
  disconnectedCallback() {
    this._observer?.disconnect();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute('title') || '';
    const caption = this.getAttribute('caption') || '';
    this.innerHTML =
      /* html */
      `
      <div class="rk-diagram">
        ${title ? `<div class="rk-diagram__title" style="margin-bottom:var(--rk-space-3);color:var(--rk-text);font:var(--rk-type-label);letter-spacing:var(--rk-tracking-wide);text-transform:uppercase">${this._escape(title)}</div>` : ''}
        <div class="rk-diagram__loading">Loading diagram\u2026</div>
        <div class="rk-diagram__canvas"></div>
        ${caption ? `<div class="rk-diagram__caption">${this._escape(caption)}</div>` : ''}
      </div>
    `;
    this._renderMermaid();
  }
  async _renderMermaid() {
    const canvas = this.querySelector('.rk-diagram__canvas');
    const loading = this.querySelector('.rk-diagram__loading');
    if (!canvas || !this._raw) return;
    try {
      const mermaid = await import('mermaid');
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      });
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      const { svg } = await mermaid.default.render(id, this._raw);
      if (loading) loading.remove();
      canvas.innerHTML = svg;
      const svgEl = canvas.querySelector('svg');
      if (svgEl) {
        svgEl.style.maxWidth = '100%';
        svgEl.style.height = 'auto';
      }
    } catch (err) {
      if (loading) loading.remove();
      canvas.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm);white-space:pre-wrap">Mermaid error: ${this._escape(err?.message || String(err))}</div>`;
    }
  }
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-diagram', RkDiagram);

// packages/components/src/elements/rk-decision.ts
var RkDecision = class extends HTMLElement {
  _raw = '';
  static get observedAttributes() {
    return ['question', 'chosen', 'status'];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const question = this.getAttribute('question') || '';
    const chosen = this.getAttribute('chosen') || '';
    const status = this.getAttribute('status') || 'proposed';
    const reasons = this.querySelectorAll('rk-reason li');
    const rationaleItems = Array.from(reasons)
      .map((li) => `<li>${li.textContent || ''}</li>`)
      .join('');
    const alternatives = this.querySelectorAll('rk-alternative');
    const altItems = Array.from(alternatives)
      .map((alt) => `<li>${alt.textContent || ''}</li>`)
      .join('');
    let statusClass = 'proposed';
    if (['approved', 'draft', 'blocked', 'resolved'].includes(status)) {
      statusClass = status;
    }
    this.innerHTML =
      /* html */
      `
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
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-decision', RkDecision);

// packages/components/src/elements/rk-checklist.ts
var RkChecklist = class extends HTMLElement {
  _raw = '';
  static get observedAttributes() {
    return ['title'];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute('title') || '';
    const items = this.querySelectorAll('rk-item');
    const itemHtml = Array.from(items)
      .map((item) => {
        const checked = item.hasAttribute('checked');
        const note = item.getAttribute('note') || '';
        const text = item.textContent || '';
        const checkedClass = checked ? ' is-checked' : '';
        const checkMark = checked ? '\u2713' : '';
        return (
          /* html */
          `
          <li class="rk-checklist__item${checkedClass}">
            <span class="rk-checklist__check">${checkMark}</span>
            <span class="rk-checklist__text">
              ${this._escape(text)}
              ${note ? `<span class="rk-checklist__note">${this._escape(note)}</span>` : ''}
            </span>
          </li>
        `
        );
      })
      .join('');
    this.innerHTML =
      /* html */
      `
      <div class="rk-checklist">
        ${title ? `<div class="rk-checklist__title">${this._escape(title)}</div>` : ''}
        <ul class="rk-checklist__list">${itemHtml}</ul>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-checklist', RkChecklist);

// packages/components/src/elements/rk-comparison.ts
function parsePipeTable3(raw) {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const rows = [];
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
var RkComparison = class extends HTMLElement {
  _raw = '';
  static get observedAttributes() {
    return ['title', 'variant'];
  }
  connectedCallback() {
    this._raw = this.textContent || '';
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute('title') || '';
    const variant = this.getAttribute('variant') || 'proscons';
    const rows = parsePipeTable3(this._raw);
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
  _renderProsCons(title, rows) {
    const header = rows[0];
    const prosTitle = header[0] || 'Pros';
    const consTitle = header[1] || 'Cons';
    const body = rows.slice(1);
    const pros = body.map((r) => r[0] || '').filter(Boolean);
    const cons = body.map((r) => r[1] || '').filter(Boolean);
    this.innerHTML =
      /* html */
      `
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
  _renderMatrix(title, rows) {
    const header = rows[0];
    const body = rows.slice(1);
    const headerHtml = header.map((h) => `<th>${this._escape(h)}</th>`).join('');
    const bodyHtml = body
      .map((row) => {
        const cells = row.map((c) => `<td>${this._escape(c)}</td>`).join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');
    this.innerHTML =
      /* html */
      `
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
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-comparison', RkComparison);

// packages/components/src/elements/rk-timeline.ts
var RkTimeline = class extends HTMLElement {
  _raw = '';
  static get observedAttributes() {
    return ['title'];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute('title') || '';
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
        return (
          /* html */
          `
          <li class="rk-timeline__step rk-timeline__step--${statusClass}">
            <span class="rk-timeline__num">${i + 1}</span>
            <div class="rk-timeline__body">
              <div class="rk-timeline__body-label">${this._escape(`Step ${i + 1}`)}</div>
              <p class="rk-timeline__body-desc">${this._escape(text)}</p>
              ${tagHtml}
            </div>
          </li>
        `
        );
      })
      .join('');
    this.innerHTML =
      /* html */
      `
      <div class="rk-timeline">
        ${title ? `<div class="rk-timeline__title">${this._escape(title)}</div>` : ''}
        <ol class="rk-timeline__steps">${stepHtml}</ol>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define('rk-timeline', RkTimeline);
