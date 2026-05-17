// ─── rk-chart ────────────────────────────────────────────────────

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

class RkChart extends HTMLElement {
  _raw = '';
  _chartInstance: any = null;

  static get observedAttributes() {
    return ['type', 'title', 'caption', 'xfield', 'yfield'];
  }

  connectedCallback(): void {
    this._raw = this.textContent || '';
    this._render();
  }

  disconnectedCallback(): void {
    if (this._chartInstance) {
      this._chartInstance.dispose?.();
      this._chartInstance = null;
    }
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const type = this.getAttribute('type') || 'bar';
    const title = this.getAttribute('title') || '';
    const caption = this.getAttribute('caption') || '';

    if (type === 'kpi') {
      this._renderKpi(title, caption);
      return;
    }

    this._renderEcharts(type, title, caption);
  }

  _renderKpi(title: string, caption: string): void {
    const rows = parsePipeTable(this._raw);
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

    this.innerHTML = /* html */ `
      <div class="rk-chart rk-chart-kpi">
        ${title ? `<div class="rk-chart__title">${this._escape(title)}</div>` : ''}
        <div class="rk-chart-kpi__grid">${items}</div>
        ${caption ? `<div class="rk-chart__caption">${this._escape(caption)}</div>` : ''}
      </div>
    `;
  }

  async _renderEcharts(type: string, title: string, caption: string): Promise<void> {
    const rows = parsePipeTable(this._raw);
    if (rows.length < 2) {
      this.innerHTML = `<div class="rk-chart"><div class="rk-chart__title">${this._escape(title)}</div><p style="color:var(--rk-muted)">Insufficient data for chart</p></div>`;
      return;
    }

    // Build structure first, then async load echarts
    this.innerHTML = /* html */ `
      <div class="rk-chart">
        ${title ? `<div class="rk-chart__title">${this._escape(title)}</div>` : ''}
        <div class="rk-chart__canvas" id="echarts-${this._uid()}"></div>
        ${caption ? `<div class="rk-chart__caption">${this._escape(caption)}</div>` : ''}
      </div>
    `;

    const container = this.querySelector('.rk-chart__canvas') as HTMLElement;
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

      const option: Record<string, any> = {
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

      // Responsive resize
      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(container);
    } catch (err: any) {
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">ECharts load failed: ${this._escape(err?.message || String(err))}</div>`;
    }
  }

  _uid(): string {
    return Math.random().toString(36).slice(2, 9);
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-chart', RkChart);

export { RkChart };
