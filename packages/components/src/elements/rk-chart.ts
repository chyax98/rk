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
  _chartInstance: { dispose?: () => void } | null = null;

  static get observedAttributes() {
    return ['type', 'title', 'caption', 'xfield', 'yfield'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.textContent || '';
    this._render();
  }

  disconnectedCallback(): void {
    if (this._chartInstance) {
      this._chartInstance.dispose?.();
      this._chartInstance = null;
    }
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
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
    if (type === 'radar') {
      this._renderRadar(title, caption);
      return;
    }
    if (type === 'gauge') {
      this._renderGauge(title, caption);
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
        const body = arr.map((row) => header.map((k) => String(row[k] ?? '')));
        return { header, body };
      } catch {
        /* fall through to pipe table */
      }
    }
    // Pipe table
    const rows = parsePipeTable(raw);
    if (rows.length < 2) return null;
    return { header: rows[0], body: rows.slice(1) };
  }

  // ─── Radar ───────────────────────────────────────────────
  // Data formats:
  //   Simple (header/body): col0=dimension, col1=value[, col2=value2...]
  //   Multi-series JSON: { axes: [...], series: [{name, values:[...]}, ...] }
  async _renderRadar(title: string, caption: string): Promise<void> {
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
      const echarts = await import(
        'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.esm.min.js'
      );
      const chart = echarts.init(container);
      this._chartInstance = chart;

      const raw = this._raw.trim();
      let indicator: { name: string; max?: number }[] = [];
      let series: { name: string; values: number[] }[] = [];

      // Try multi-series JSON: { axes, series }
      if (raw.startsWith('{')) {
        try {
          const json = JSON.parse(raw) as { axes: string[]; series: { name: string; values: number[] }[] };
          indicator = (json.axes || []).map((a: string) => ({ name: a }));
          series = json.series || [];
        } catch { /* fall through */ }
      }

      // Fallback: header/body (col0=dimension, col1..N=series values)
      if (indicator.length === 0) {
        const parsed = this._parseData();
        if (parsed) {
          const { header, body } = parsed;
          indicator = body.map((r) => ({ name: r[0] }));
          const seriesCount = header.length - 1;
          series = Array.from({ length: seriesCount }, (_, si) => ({
            name: header[si + 1],
            values: body.map((r) => parseFloat(r[si + 1] || '0')),
          }));
        }
      }

      if (indicator.length === 0) {
        container.innerHTML = `<p style="color:var(--rk-muted)">No radar data</p>`;
        return;
      }

      // Auto max per indicator
      indicator = indicator.map((ind, i) => ({
        ...ind,
max: ind.max ?? (Math.ceil(Math.max(...series.map((s) => s.values[i] ?? 0)) * 1.2) || 100),
      }));

      chart.setOption({
        tooltip: {},
        legend: series.length > 1 ? { show: true, bottom: 0 } : { show: false },
        radar: { indicator, shape: 'polygon', splitNumber: 4 },
        series: series.map((s) => ({
          name: s.name,
          type: 'radar',
          data: [{ value: s.values, name: s.name }],
        })),
      });

      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(container);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">ECharts load failed: ${this._escape(message)}</div>`;
      this._reportRenderError('echarts-radar', message);
    }
  }

  // ─── Gauge
  // Data format (JSON): { value: 72, name: "NPS", min: 0, max: 100 }
  // Or single header/body row: | Metric | Value |
  async _renderGauge(title: string, caption: string): Promise<void> {
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
      const echarts = await import(
        'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.esm.min.js'
      );
      const chart = echarts.init(container);
      this._chartInstance = chart;

      const raw = this._raw.trim();
      let gaugeValue = 0;
      let gaugeName = title || 'Value';
      let gaugeMin = 0;
      let gaugeMax = 100;

      if (raw.startsWith('{')) {
        try {
          const json = JSON.parse(raw) as { value?: number; name?: string; min?: number; max?: number };
          gaugeValue = json.value ?? 0;
          if (json.name) gaugeName = json.name;
          if (json.min !== undefined) gaugeMin = json.min;
          if (json.max !== undefined) gaugeMax = json.max;
        } catch { /* fall through */ }
      } else {
        const parsed = this._parseData();
        if (parsed && parsed.body.length > 0) {
          const row = parsed.body[0];
          if (row[0]) gaugeName = row[0];
          gaugeValue = parseFloat(row[1] || '0');
        }
      }

      chart.setOption({
        tooltip: { formatter: `{b}: {c}` },
        series: [{
          type: 'gauge',
          min: gaugeMin,
          max: gaugeMax,
          progress: { show: true, width: 12 },
          axisLine: { lineStyle: { width: 12 } },
          axisTick: { show: false },
          splitLine: { length: 8, lineStyle: { width: 2 } },
          axisLabel: { distance: 20, fontSize: 11 },
          anchor: { show: true, size: 14, itemStyle: { borderWidth: 3 } },
          detail: { valueAnimation: true, fontSize: 28, fontWeight: 700, offsetCenter: [0, '60%'] },
          data: [{ value: gaugeValue, name: gaugeName }],
        }],
      });

      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(container);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">ECharts load failed: ${this._escape(message)}</div>`;
      this._reportRenderError('echarts-gauge', message);
    }
  }

  async _renderEcharts(title: string, type: string, caption: string): Promise<void> {
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
      const echarts = await import(
        'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.esm.min.js'
      );
      const chart = echarts.init(container);
      this._chartInstance = chart;

      const xField = this.getAttribute('xfield') || header[0] || 'x';
      const yField = this.getAttribute('yfield') || header[1] || 'y';
      const xIdx = header.indexOf(xField);
      const yIdx = header.indexOf(yField);
      const xi = xIdx >= 0 ? xIdx : 0;
      const yi = yIdx >= 0 ? yIdx : 1;

      const xData = body.map((r) => r[xi] || '');
      const seriesType =
        type === 'scatter' ? 'scatter' : type === 'pie' ? 'pie' : type === 'area' ? 'line' : type === 'funnel' ? 'funnel' : type;

      // Detect all numeric columns for multi-series
      const numericCols = header
        .map((h, i) => ({ h, i }))
        .filter(({ i }) => i !== xi && body.some((r) => !Number.isNaN(parseFloat(r[i]))));

      // If yfield specified, use only that; otherwise use all numeric cols
      const seriesCols =
        yField !== header[0] && header.includes(yField)
          ? [{ h: yField, i: yi }]
          : numericCols.length > 0
            ? numericCols
            : [{ h: header[yi] || 'value', i: yi }];

      const option: Record<string, unknown> = {
        tooltip: { trigger: seriesType === 'pie' ? 'item' : 'axis' },
        legend: seriesCols.length > 1 ? { show: true } : { show: false },
      };

      if (seriesType === 'pie') {
        option.series = [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            data: body.map((r, i) => ({
              name: r[xi] || `Item ${i + 1}`,
              value: parseFloat(r[seriesCols[0]?.i ?? yi] || '0'),
            })),
          },
        ];
      } else if (seriesType === 'funnel') {
        option.tooltip = { trigger: 'item', formatter: '{a} <br/>{b}: {c}' };
        option.legend = { show: true, bottom: 0 };
        option.series = [{
          type: 'funnel',
          left: '10%',
          width: '80%',
          sort: 'descending',
          gap: 4,
          label: { show: true, position: 'inside', formatter: '{b}\n{c}' },
          data: body.map((r, i) => ({
            name: r[xi] || `Stage ${i + 1}`,
            value: parseFloat(r[seriesCols[0]?.i ?? yi] || '0'),
          })),
        }];
      } else {
        // Smart Y-axis formatter for large numbers
        const allVals = seriesCols.flatMap(({ i: si }) =>
          body.map((r) => parseFloat(r[si] || '0')),
        );
        const maxVal = Math.max(...allVals.filter((v) => !Number.isNaN(v)));
        const axisFormatter =
          maxVal >= 10000
            ? (v: number) =>
                v >= 1000000
                  ? `${(v / 1000000).toFixed(1)}M`
                  : v >= 1000
                    ? `${(v / 1000).toFixed(0)}K`
                    : String(v)
            : (v: number) => String(v);

        option.grid = { left: '12%', right: '5%', top: '15%', bottom: '10%', containLabel: true };
        option.xAxis = {
          type: 'category',
          data: xData,
          axisLabel: { interval: 0, rotate: xData.length > 6 ? 30 : 0 },
        };
        option.yAxis = { type: 'value', axisLabel: { formatter: axisFormatter } };
        option.series = seriesCols.map(({ h, i: si }) => ({
          name: h,
          type: seriesType,
          data: body.map((r) => parseFloat(r[si] || '0')),
          ...(type === 'area' ? { areaStyle: { opacity: 0.2 } } : {}),
          smooth: type === 'line' || type === 'area',
          symbolSize: 6,
        }));
      }

      chart.setOption(option);

      // Responsive resize
      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(container);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">ECharts load failed: ${this._escape(message)}</div>`;
      this._reportRenderError('echarts', message);
    }
  }

  /** Dispatch a rk-render-error CustomEvent so the viewer can collect and report errors */
  _reportRenderError(engine: string, message: string): void {
    this.dispatchEvent(
      new CustomEvent('rk-render-error', {
        bubbles: true,
        detail: { engine, message, anchor: this.dataset.rkAnchor || '' },
      }),
    );
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
