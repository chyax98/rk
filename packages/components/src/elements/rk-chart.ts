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
        const label = row[0] || header[0] || '';
        const value = row[1] || '—';
        const delta = row[2] || '';
        const deltaHtml = delta
          ? `<span class="rk-chart-kpi__delta">${this._escape(delta)}</span>`
          : '';
        return `<div class="rk-chart-kpi__item">
          <div class="rk-chart-kpi__value">${this._escape(value)}</div>
          <div class="rk-chart-kpi__label">${this._escape(label)}</div>
          ${deltaHtml}
        </div>`;
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

  /** Parse data: try JSON array first, then pipe table */
  _parseData(): { header: string[]; body: string[][] } | null {
    const raw = this._raw.trim();
    // Try JSON
    if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        const json = JSON.parse(raw);
        const arr: Record<string, unknown>[] = Array.isArray(json) ? json : [json];
        if (arr.length === 0) return null;
        const header = Object.keys(arr[0]);
        const body = arr.map(row => header.map(k => String(row[k] ?? '')));
        return { header, body };
      } catch { /* fall through to pipe table */ }
    }
    // Pipe table
    const rows = parsePipeTable(raw);
    if (rows.length < 2) return null;
    return { header: rows[0], body: rows.slice(1) };
  }

  async _renderEcharts(type: string, title: string, caption: string): Promise<void> {
    const parsed = this._parseData();
    if (!parsed) {
      this.innerHTML = `<div class="rk-chart"><div class="rk-chart__title">${this._escape(title)}</div><p style="color:var(--rk-muted)">Insufficient data for chart</p></div>`;
      return;
    }
    const { header, body } = parsed;

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
      const echarts = await import('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.esm.min.js');
      const chart = echarts.init(container);
      this._chartInstance = chart;

      const xField = this.getAttribute('xfield') || header[0] || 'x';
      const yField = this.getAttribute('yfield') || header[1] || 'y';
      const xIdx = header.indexOf(xField);
      const yIdx = header.indexOf(yField);
      const xi = xIdx >= 0 ? xIdx : 0;
      const yi = yIdx >= 0 ? yIdx : 1;

      const xData = body.map((r) => r[xi] || '');
      const seriesType = type === 'scatter' ? 'scatter' : type === 'pie' ? 'pie' : type === 'area' ? 'line' : type;

      // Detect all numeric columns for multi-series
      const numericCols = header
        .map((h, i) => ({ h, i }))
        .filter(({ i }) => i !== xi && body.some(r => !isNaN(parseFloat(r[i]))));

      // If yfield specified, use only that; otherwise use all numeric cols
      const seriesCols = yField !== header[0] && header.includes(yField)
        ? [{ h: yField, i: yi }]
        : numericCols.length > 0 ? numericCols : [{ h: header[yi] || 'value', i: yi }];

      const option: Record<string, any> = {
        tooltip: { trigger: seriesType === 'pie' ? 'item' : 'axis' },
        legend: seriesCols.length > 1 ? { show: true } : { show: false },
      };

      if (seriesType === 'pie') {
        option.series = [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: body.map((r, i) => ({
            name: r[xi] || `Item ${i + 1}`,
            value: parseFloat(r[seriesCols[0]?.i ?? yi] || '0'),
          })),
        }];
      } else {
        option.xAxis = { type: 'category', data: xData };
        option.yAxis = { type: 'value' };
        option.series = seriesCols.map(({ h, i: si }) => ({
          name: h,
          type: seriesType,
          data: body.map(r => parseFloat(r[si] || '0')),
          ...(type === 'area' ? { areaStyle: {} } : {}),
          smooth: type === 'line' || type === 'area',
        }));
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
