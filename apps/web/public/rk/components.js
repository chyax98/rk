// packages/components/src/elements/rk-callout.ts
var ICONS = {
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  danger: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
  tip: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  decision: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 17-3.5-2"/><path d="M6 12l-2-1"/><path d="m18 11-2 1"/><circle cx="12" cy="12" r="3"/></svg>`,
  note: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`
};
var RkCallout = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["tone", "type", "title"];
  }
  connectedCallback() {
    if (this.parentElement?.closest(".rk-callout__content")) return;
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const tone = this.getAttribute("tone") || this.getAttribute("type") || "info";
    const title = this.getAttribute("title") || "";
    const icon = ICONS[tone] || ICONS.info;
    this.innerHTML = /* html */
    `
      <div class="rk-callout rk-callout--${tone}">
        <span class="rk-callout__icon">${icon}</span>
        <div class="rk-callout__body">
          ${title ? `<div class="rk-callout__title">${this._escape(title)}</div>` : ""}
          <div class="rk-callout__content">${this._raw}</div>
        </div>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-callout", RkCallout);

// packages/components/src/elements/rk-stat.ts
var RkStat = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["value", "unit", "label", "delta", "tone"];
  }
  connectedCallback() {
    this._raw = this.innerHTML.trim();
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw !== "" || this.hasAttribute("value")) this._render();
  }
  _render() {
    const value = this.getAttribute("value") || "";
    const unit = this.getAttribute("unit") || "";
    const label = this.getAttribute("label") || "";
    const delta = this.getAttribute("delta") || "";
    const tone = this.getAttribute("tone") || "";
    let toneClass = "";
    if (tone === "positive" || tone === "success") toneClass = "rk-stat--positive";
    else if (tone === "negative" || tone === "danger") toneClass = "rk-stat--negative";
    else if (tone === "neutral") toneClass = "rk-stat--neutral";
    let deltaHtml = "";
    if (delta) {
      const parsed = parseFloat(delta);
      let direction = "neutral";
      let arrow = "";
      if (!Number.isNaN(parsed) && parsed > 0) {
        arrow = "\u2191";
      } else if (!Number.isNaN(parsed) && parsed < 0) {
        arrow = "\u2193";
      } else if (delta.startsWith("+") || delta.startsWith("\u2191")) {
        direction = "up";
        arrow = "\u2191";
      } else if (delta.startsWith("-") || delta.startsWith("\u2193")) {
        direction = "down";
        arrow = "\u2193";
      }
      deltaHtml = `<span class="rk-stat__delta rk-stat__delta--${direction}">${arrow} ${this._escape(delta.replace(/^[↑↓+-]/, ""))}</span>`;
    }
    this.innerHTML = /* html */
    `
      <div class="rk-stat ${toneClass}">
        <div class="rk-stat__label">${this._escape(label)}</div>
        <div>
          <span class="rk-stat__value">${this._escape(value)}</span>${unit ? `<span class="rk-stat__unit">${this._escape(unit)}</span>` : ""}
        </div>
        ${deltaHtml}
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-stat", RkStat);

// packages/components/src/elements/rk-summary.ts
var RkSummary = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["title"];
  }
  connectedCallback() {
    this._raw = this.innerHTML.trim();
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "Summary";
    this.innerHTML = /* html */
    `
      <div class="rk-summary">
        <div class="rk-summary__title">${this._escape(title)}</div>
        <div class="rk-summary__content">${this._raw}</div>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-summary", RkSummary);

// packages/components/src/elements/rk-code.ts
var RkCode = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["lang", "title", "frame", "showlinenumbers", "data-highlighted"];
  }
  connectedCallback() {
    this._raw = this.textContent || "";
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const lang = this.getAttribute("lang") || "";
    const title = this.getAttribute("title") || "";
    const frame = this.getAttribute("frame") || "none";
    const showLineNumbers = this.hasAttribute("showlinenumbers") || this.hasAttribute("showLineNumbers");
    const highlighted = this.getAttribute("data-highlighted") || "";
    let frameClass = "";
    if (frame === "editor") frameClass = "rk-code--frame-editor";
    else if (frame === "terminal") frameClass = "rk-code--frame-terminal";
    let headerHtml = "";
    const showHeader = frame === "editor" || frame === "terminal" || title || lang;
    if (showHeader) {
      let dotsHtml = "";
      if (frame === "editor" || frame === "terminal") {
        dotsHtml = `<span class="rk-code__dots"><i></i><i></i><i></i></span>`;
      }
      let promptHtml = "";
      if (frame === "terminal") {
        promptHtml = `<span class="rk-code__title" style="color:var(--rk-muted)">$</span>`;
      }
      headerHtml = /* html */
      `
        <div class="rk-code__header">
          ${dotsHtml}
          ${promptHtml}
          ${title ? `<span class="rk-code__title">${this._escape(title)}</span>` : ""}
          ${lang ? `<span class="rk-code__lang">${this._escape(lang)}</span>` : ""}
        </div>
      `;
    }
    let bodyContent = "";
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
      const lines = bodyContent.split("\n");
      if (lines.length > 0 && lines[lines.length - 1].trim() === "") {
        lines.pop();
      }
      const rows = lines.map((line, i) => `<tr><td class="rk-ln">${i + 1}</td><td class="rk-lc">${line}</td></tr>`).join("");
      bodyContent = `<table><tbody>${rows}</tbody></table>`;
    }
    this.innerHTML = /* html */
    `
      <div class="rk-code ${frameClass}">
        ${headerHtml}
        <div class="rk-code__body"><code>${bodyContent}</code></div>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  _escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
};
customElements.define("rk-code", RkCode);

// packages/components/src/elements/rk-table.ts
function parsePipeTable(raw) {
  const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const rows = [];
  for (const line of lines) {
    if (/^\|[\s\-:]+\|$/.test(line) || /^[\s\-:|]+$/.test(line.replace(/\|/g, "").trim() === "" ? "" : "x")) {
      const cells2 = line.split("|").map((c) => c.trim());
      const isSep = cells2.every((c) => /^[\s\-:]*$/.test(c));
      if (isSep) continue;
    }
    if (/^\|?\s*[-:]+[\s|:-]*$/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}
var RkTable = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["title", "profile"];
  }
  connectedCallback() {
    this._raw = this.textContent || "";
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "";
    const profile = this.getAttribute("profile") || "";
    const rows = parsePipeTable(this._raw);
    if (rows.length === 0) {
      this.innerHTML = `<div class="rk-table"><div class="rk-table__title">${this._escape(title)}</div><p style="color:var(--rk-muted)">No table data</p></div>`;
      return;
    }
    const header = rows[0];
    const body = rows.slice(1);
    const profileClass = profile ? `rk-table--${profile}` : "";
    const headerHtml = header.map((h) => `<th>${this._escape(h)}</th>`).join("");
    const bodyHtml = body.map((row) => {
      const cells = row.map((cell, ci) => {
        let content = this._escape(cell);
        if (profile === "status" && ci === 0) {
          const lower = cell.toLowerCase().trim();
          let dotClass = "";
          if (lower.includes("healthy") || lower.includes("ok") || lower.includes("green") || lower.includes("pass")) {
            dotClass = "healthy";
          } else if (lower.includes("degraded") || lower.includes("warn") || lower.includes("warning") || lower.includes("yellow")) {
            dotClass = "degraded";
          } else if (lower.includes("critical") || lower.includes("error") || lower.includes("fail") || lower.includes("red") || lower.includes("down")) {
            dotClass = "critical";
          }
          if (dotClass) {
            content = `<span class="rk-status-dot rk-status-dot--${dotClass}"></span>${content}`;
          }
        }
        return `<td>${content}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    this.innerHTML = /* html */
    `
      <div class="rk-table ${profileClass}">
        ${title ? `<div class="rk-table__title">${this._escape(title)}</div>` : ""}
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
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-table", RkTable);

// packages/components/src/elements/rk-chart.ts
function parsePipeTable2(raw) {
  const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const rows = [];
  for (const line of lines) {
    if (/^\|?\s*[-:]+[\s|:-]*$/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}
var RkChart = class extends HTMLElement {
  _raw = "";
  _chartInstance = null;
  static get observedAttributes() {
    return ["type", "title", "caption", "xfield", "yfield"];
  }
  connectedCallback() {
    this._raw = this.textContent || "";
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
    const type = this.getAttribute("type") || "bar";
    const title = this.getAttribute("title") || "";
    const caption = this.getAttribute("caption") || "";
    if (type === "kpi") {
      this._renderKpi(title, caption);
      return;
    }
    if (type === "radar") {
      this._renderRadar(title, caption);
      return;
    }
    if (type === "gauge") {
      this._renderGauge(title, caption);
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
    const items = body.map((row) => {
      const label = row[0] || header[0] || "";
      const value = row[1] || "\u2014";
      const delta = row[2] || "";
      const deltaHtml = delta ? `<span class="rk-chart-kpi__delta">${this._escape(delta)}</span>` : "";
      return `<div class="rk-chart-kpi__item">
          <div class="rk-chart-kpi__value">${this._escape(value)}</div>
          <div class="rk-chart-kpi__label">${this._escape(label)}</div>
          ${deltaHtml}
        </div>`;
    }).join("");
    this.innerHTML = /* html */
    `
      <div class="rk-chart rk-chart-kpi">
        ${title ? `<div class="rk-chart__title">${this._escape(title)}</div>` : ""}
        <div class="rk-chart-kpi__grid">${items}</div>
        ${caption ? `<div class="rk-chart__caption">${this._escape(caption)}</div>` : ""}
      </div>
    `;
  }
  /** Parse data: try JSON array first, then pipe table */
  _parseData() {
    const raw = this._raw.trim();
    if (raw.startsWith("[") || raw.startsWith("{")) {
      try {
        const json = JSON.parse(raw);
        const arr = Array.isArray(json) ? json : [json];
        if (arr.length === 0) return null;
        const header = Object.keys(arr[0]);
        const body = arr.map((row) => header.map((k) => String(row[k] ?? "")));
        return { header, body };
      } catch {
      }
    }
    const rows = parsePipeTable2(raw);
    if (rows.length < 2) return null;
    return { header: rows[0], body: rows.slice(1) };
  }
  // ─── Radar ───────────────────────────────────────────────
  // Data formats:
  //   Simple (header/body): col0=dimension, col1=value[, col2=value2...]
  //   Multi-series JSON: { axes: [...], series: [{name, values:[...]}, ...] }
  async _renderRadar(title, caption) {
    this.innerHTML = /* html */
    `
      <div class="rk-chart">
        ${title ? `<div class="rk-chart__title">${this._escape(title)}</div>` : ""}
        <div class="rk-chart__canvas" id="echarts-${this._uid()}"></div>
        ${caption ? `<div class="rk-chart__caption">${this._escape(caption)}</div>` : ""}
      </div>
    `;
    const container = this.querySelector(".rk-chart__canvas");
    if (!container) return;
    try {
      const echarts = await import("https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.esm.min.js");
      const chart = echarts.init(container);
      this._chartInstance = chart;
      const raw = this._raw.trim();
      let indicator = [];
      let series = [];
      if (raw.startsWith("{")) {
        try {
          const json = JSON.parse(raw);
          indicator = (json.axes || []).map((a) => ({ name: a }));
          series = json.series || [];
        } catch {
        }
      }
      if (indicator.length === 0) {
        const parsed = this._parseData();
        if (parsed) {
          const { header, body } = parsed;
          indicator = body.map((r) => ({ name: r[0] }));
          const seriesCount = header.length - 1;
          series = Array.from({ length: seriesCount }, (_, si) => ({
            name: header[si + 1],
            values: body.map((r) => parseFloat(r[si + 1] || "0"))
          }));
        }
      }
      if (indicator.length === 0) {
        container.innerHTML = `<p style="color:var(--rk-muted)">No radar data</p>`;
        return;
      }
      indicator = indicator.map((ind, i) => ({
        ...ind,
        max: ind.max ?? (Math.ceil(Math.max(...series.map((s) => s.values[i] ?? 0)) * 1.2) || 100)
      }));
      chart.setOption({
        tooltip: {},
        legend: series.length > 1 ? { show: true, bottom: 0 } : { show: false },
        radar: { indicator, shape: "polygon", splitNumber: 4 },
        series: series.map((s) => ({
          name: s.name,
          type: "radar",
          data: [{ value: s.values, name: s.name }]
        }))
      });
      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(container);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">ECharts load failed: ${this._escape(message)}</div>`;
      this._reportRenderError("echarts-radar", message);
    }
  }
  // ─── Gauge
  // Data format (JSON): { value: 72, name: "NPS", min: 0, max: 100 }
  // Or single header/body row: | Metric | Value |
  async _renderGauge(title, caption) {
    this.innerHTML = /* html */
    `
      <div class="rk-chart">
        ${title ? `<div class="rk-chart__title">${this._escape(title)}</div>` : ""}
        <div class="rk-chart__canvas" id="echarts-${this._uid()}"></div>
        ${caption ? `<div class="rk-chart__caption">${this._escape(caption)}</div>` : ""}
      </div>
    `;
    const container = this.querySelector(".rk-chart__canvas");
    if (!container) return;
    try {
      const echarts = await import("https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.esm.min.js");
      const chart = echarts.init(container);
      this._chartInstance = chart;
      const raw = this._raw.trim();
      let gaugeValue = 0;
      let gaugeName = title || "Value";
      let gaugeMin = 0;
      let gaugeMax = 100;
      if (raw.startsWith("{")) {
        try {
          const json = JSON.parse(raw);
          gaugeValue = json.value ?? 0;
          if (json.name) gaugeName = json.name;
          if (json.min !== void 0) gaugeMin = json.min;
          if (json.max !== void 0) gaugeMax = json.max;
        } catch {
        }
      } else {
        const parsed = this._parseData();
        if (parsed && parsed.body.length > 0) {
          const row = parsed.body[0];
          if (row[0]) gaugeName = row[0];
          gaugeValue = parseFloat(row[1] || "0");
        }
      }
      chart.setOption({
        tooltip: { formatter: `{b}: {c}` },
        series: [{
          type: "gauge",
          min: gaugeMin,
          max: gaugeMax,
          progress: { show: true, width: 12 },
          axisLine: { lineStyle: { width: 12 } },
          axisTick: { show: false },
          splitLine: { length: 8, lineStyle: { width: 2 } },
          axisLabel: { distance: 20, fontSize: 11 },
          anchor: { show: true, size: 14, itemStyle: { borderWidth: 3 } },
          detail: { valueAnimation: true, fontSize: 28, fontWeight: 700, offsetCenter: [0, "60%"] },
          data: [{ value: gaugeValue, name: gaugeName }]
        }]
      });
      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(container);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">ECharts load failed: ${this._escape(message)}</div>`;
      this._reportRenderError("echarts-gauge", message);
    }
  }
  async _renderEcharts(title, type, caption) {
    const parsed = this._parseData();
    if (!parsed) {
      this.innerHTML = `<div class="rk-chart"><div class="rk-chart__title">${this._escape(title)}</div><p style="color:var(--rk-muted)">Insufficient data for chart</p></div>`;
      return;
    }
    const { header, body } = parsed;
    this.innerHTML = /* html */
    `
      <div class="rk-chart">
        ${title ? `<div class="rk-chart__title">${this._escape(title)}</div>` : ""}
        <div class="rk-chart__canvas" id="echarts-${this._uid()}"></div>
        ${caption ? `<div class="rk-chart__caption">${this._escape(caption)}</div>` : ""}
      </div>
    `;
    const container = this.querySelector(".rk-chart__canvas");
    if (!container) return;
    try {
      const echarts = await import("https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.esm.min.js");
      const chart = echarts.init(container);
      this._chartInstance = chart;
      const xField = this.getAttribute("xfield") || header[0] || "x";
      const yField = this.getAttribute("yfield") || header[1] || "y";
      const xIdx = header.indexOf(xField);
      const yIdx = header.indexOf(yField);
      const xi = xIdx >= 0 ? xIdx : 0;
      const yi = yIdx >= 0 ? yIdx : 1;
      const xData = body.map((r) => r[xi] || "");
      const seriesType = type === "scatter" ? "scatter" : type === "pie" ? "pie" : type === "area" ? "line" : type === "funnel" ? "funnel" : type;
      const numericCols = header.map((h, i) => ({ h, i })).filter(({ i }) => i !== xi && body.some((r) => !Number.isNaN(parseFloat(r[i]))));
      const seriesCols = yField !== header[0] && header.includes(yField) ? [{ h: yField, i: yi }] : numericCols.length > 0 ? numericCols : [{ h: header[yi] || "value", i: yi }];
      const option = {
        tooltip: { trigger: seriesType === "pie" ? "item" : "axis" },
        legend: seriesCols.length > 1 ? { show: true } : { show: false }
      };
      if (seriesType === "pie") {
        option.series = [
          {
            type: "pie",
            radius: ["40%", "70%"],
            data: body.map((r, i) => ({
              name: r[xi] || `Item ${i + 1}`,
              value: parseFloat(r[seriesCols[0]?.i ?? yi] || "0")
            }))
          }
        ];
      } else if (seriesType === "funnel") {
        option.tooltip = { trigger: "item", formatter: "{a} <br/>{b}: {c}" };
        option.legend = { show: true, bottom: 0 };
        option.series = [{
          type: "funnel",
          left: "10%",
          width: "80%",
          sort: "descending",
          gap: 4,
          label: { show: true, position: "inside", formatter: "{b}\n{c}" },
          data: body.map((r, i) => ({
            name: r[xi] || `Stage ${i + 1}`,
            value: parseFloat(r[seriesCols[0]?.i ?? yi] || "0")
          }))
        }];
      } else {
        const allVals = seriesCols.flatMap(
          ({ i: si }) => body.map((r) => parseFloat(r[si] || "0"))
        );
        const maxVal = Math.max(...allVals.filter((v) => !Number.isNaN(v)));
        const axisFormatter = maxVal >= 1e4 ? (v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v) : (v) => String(v);
        option.grid = { left: "12%", right: "5%", top: "15%", bottom: "10%", containLabel: true };
        option.xAxis = {
          type: "category",
          data: xData,
          axisLabel: { interval: 0, rotate: xData.length > 6 ? 30 : 0 }
        };
        option.yAxis = { type: "value", axisLabel: { formatter: axisFormatter } };
        option.series = seriesCols.map(({ h, i: si }) => ({
          name: h,
          type: seriesType,
          data: body.map((r) => parseFloat(r[si] || "0")),
          ...type === "area" ? { areaStyle: { opacity: 0.2 } } : {},
          smooth: type === "line" || type === "area",
          symbolSize: 6
        }));
      }
      chart.setOption(option);
      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(container);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">ECharts load failed: ${this._escape(message)}</div>`;
      this._reportRenderError("echarts", message);
    }
  }
  /** Dispatch a rk-render-error CustomEvent so the viewer can collect and report errors */
  _reportRenderError(engine, message) {
    this.dispatchEvent(
      new CustomEvent("rk-render-error", {
        bubbles: true,
        detail: { engine, message, anchor: this.dataset.rkAnchor || "" }
      })
    );
  }
  _uid() {
    return Math.random().toString(36).slice(2, 9);
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-chart", RkChart);

// packages/components/src/elements/rk-diagram.ts
var RkDiagram = class extends HTMLElement {
  _raw = "";
  _observer = null;
  static get observedAttributes() {
    return ["title", "caption", "engine"];
  }
  connectedCallback() {
    this._raw = (this.textContent || "").trim();
    this._render();
  }
  disconnectedCallback() {
    this._observer?.disconnect();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "";
    const caption = this.getAttribute("caption") || "";
    const engine = this.getAttribute("engine") || "mermaid";
    const existingPrerendered = this.querySelector(".rk-diagram__prerendered");
    const prerenderedHTML = existingPrerendered ? existingPrerendered.outerHTML : null;
    this.innerHTML = /* html */
    `
      <div class="rk-diagram">
        ${title ? `<div class="rk-diagram__title" style="margin-bottom:var(--rk-space-3);color:var(--rk-text);font:var(--rk-type-label);letter-spacing:var(--rk-tracking-wide);text-transform:uppercase">${this._escape(title)}</div>` : ""}
        <div class="rk-diagram__loading">Loading diagram\u2026</div>
        <div class="rk-diagram__canvas"></div>
        ${caption ? `<div class="rk-diagram__caption">${this._escape(caption)}</div>` : ""}
      </div>
    `;
    if (prerenderedHTML) {
      const loading = this.querySelector(".rk-diagram__loading");
      if (loading) loading.style.display = "none";
      const canvas = this.querySelector(".rk-diagram__canvas");
      if (canvas) canvas.innerHTML = prerenderedHTML;
      this._makeSvgResponsive(canvas);
      return;
    }
    if (engine === "plantuml") {
      const loading = this.querySelector(".rk-diagram__loading");
      if (loading) {
        loading.innerHTML = "\u26A0\uFE0F PlantUML \u56FE\u8868\u9700\u8981\u670D\u52A1\u7AEF\u5904\u7406\u540E\u67E5\u770B\u3002<br><small>\u5728 server \u542F\u52A8\u72B6\u6001\u4E0B\u63A8\u9001 artifact \u5373\u53EF\u81EA\u52A8\u6E32\u67D3\u3002</small>";
      }
      return;
    }
    if (engine === "d2") {
      this._renderD2();
      return;
    }
    if (engine === "graphviz" || engine === "dot") {
      this._renderGraphviz();
      return;
    }
    this._renderMermaid();
  }
  /** Detect if current theme is dark based on CSS var */
  _isDark() {
    const bg = getComputedStyle(this).getPropertyValue("--rk-bg").trim();
    if (!bg) return false;
    if (bg.startsWith("#")) {
      const hex = bg.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      return !Number.isNaN(r) && r < 80;
    }
    return bg.includes("0b1") || bg.includes("08090a") || bg.includes("161616");
  }
  /**
   * Read design system CSS variables from computed styles and build
   * Mermaid themeVariables. Inspired by beautiful-mermaid's DiagramColors →
   * themeVariables mapping, adapted to RenderKit's --rk-* token schema.
   *
   * Token mapping:
   *   --rk-bg              → background
   *   --rk-text            → primaryTextColor
   *   --rk-accent          → primaryColor (node fill accent tint), primaryBorderColor
   *   --rk-border          → lineColor (edge color)
   *   --rk-surface         → clusterBkg, nodeBorder
   *   --rk-text-secondary  → secondaryTextColor
   *   --rk-muted           → tertiaryTextColor, edgeLabelBackground
   */
  _getMermaidThemeVars() {
    const cs = getComputedStyle(this);
    const token = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
    let bgRaw = token("--rk-bg", "#ffffff");
    if (bgRaw.includes("gradient") || bgRaw.includes("(")) {
      bgRaw = token("--rk-surface-solid", token("--rk-surface", "#ffffff"));
    }
    bgRaw = bgRaw.replace(/^["']|["']$/g, "");
    const text = token("--rk-text", "#1a1a1a");
    const textSec = token("--rk-text-secondary", "#3d3d3d");
    const muted = token("--rk-muted", "#737373");
    const accent = token("--rk-accent", "#0267a5");
    const border = token("--rk-border", "#dfe3ea");
    const surface = token("--rk-surface", "#ffffff");
    const surfaceR = token("--rk-surface-raised", surface);
    const fontFamily = token("--rk-font-sans", "'Inter', 'Noto Sans SC', sans-serif");
    const isDark = this._isDark();
    const nodeFill = isDark ? this._mixColors(accent, bgRaw, 0.18) : this._mixColors(accent, bgRaw, 0.1);
    const nodeBorder = this._mixColors(accent, bgRaw, isDark ? 0.35 : 0.3);
    return {
      // Background
      background: bgRaw,
      // Primary nodes
      primaryColor: nodeFill,
      primaryTextColor: text,
      primaryBorderColor: nodeBorder,
      // Secondary / tertiary nodes
      secondaryColor: this._mixColors(accent, bgRaw, 0.06),
      secondaryTextColor: textSec,
      secondaryBorderColor: this._mixColors(accent, bgRaw, 0.15),
      tertiaryColor: surfaceR,
      tertiaryTextColor: muted,
      tertiaryBorderColor: border,
      // Lines & edges
      lineColor: border,
      edgeLabelBackground: this._mixColors(text, bgRaw, 0.06),
      // Clusters / subgraphs
      clusterBkg: this._mixColors(text, bgRaw, 0.03),
      clusterBorder: border,
      // Font
      fontFamily,
      // Title
      titleColor: text,
      // Node-specific
      nodeBorder,
      nodeTextColor: text,
      // Notes
      noteBkgColor: this._mixColors(accent, bgRaw, 0.08),
      noteTextColor: text,
      noteBorderColor: this._mixColors(accent, bgRaw, 0.2)
    };
  }
  /**
   * Simple two-color mix at a given ratio (0-1).
   * Returns hex string. Used to derive Mermaid theme colors from --rk-* tokens.
   */
  _mixColors(color1, color2, ratio) {
    const c1 = this._parseColor(color1);
    const c2 = this._parseColor(color2);
    if (!c1 || !c2) return color1;
    const r = Math.round(c1.r * ratio + c2.r * (1 - ratio));
    const g = Math.round(c1.g * ratio + c2.g * (1 - ratio));
    const b = Math.round(c1.b * ratio + c2.b * (1 - ratio));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  /** Parse a CSS color string (#hex or rgb/rgba) to {r,g,b} */
  _parseColor(s) {
    s = s.trim();
    const hex = s.match(/^#?([0-9a-f]{6})$/i);
    if (hex) {
      const v = parseInt(hex[1], 16);
      return { r: v >> 16 & 255, g: v >> 8 & 255, b: v & 255 };
    }
    const shex = s.match(/^#?([0-9a-f]{3})$/i);
    if (shex) {
      const v = parseInt(shex[1], 16);
      const r = (v >> 8 & 15) * 17;
      const g = (v >> 4 & 15) * 17;
      const b = (v & 15) * 17;
      return { r, g, b };
    }
    const rgb = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgb) {
      return { r: parseInt(rgb[1], 10), g: parseInt(rgb[2], 10), b: parseInt(rgb[3], 10) };
    }
    return null;
  }
  async _renderMermaid() {
    const canvas = this.querySelector(".rk-diagram__canvas");
    const loading = this.querySelector(".rk-diagram__loading");
    if (!canvas || !this._raw) return;
    try {
      const mermaid = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
      const isDark = this._isDark();
      const themeVars = this._getMermaidThemeVars();
      mermaid.default.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        securityLevel: "loose",
        themeVariables: themeVars
      });
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      const { svg } = await mermaid.default.render(id, this._raw);
      if (loading) loading.remove();
      canvas.innerHTML = svg;
      this._makeSvgResponsive(canvas);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (loading) loading.remove();
      canvas.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm);white-space:pre-wrap">Mermaid error: ${this._escape(message)}</div>`;
      this._reportRenderError("mermaid", message);
    }
  }
  _renderD2() {
    const canvas = this.querySelector(".rk-diagram__canvas");
    const loading = this.querySelector(".rk-diagram__loading");
    if (loading) loading.remove();
    if (canvas) {
      canvas.innerHTML = `<div class="rk-diagram__error" style="padding:var(--rk-space-4);color:var(--rk-tone-warning-border);background:var(--rk-tone-warning-bg);border-radius:var(--rk-radius-sm);font-size:var(--rk-text-sm)">
        <strong>D2 rendering unavailable</strong> \u2014 the D2 WASM package is broken. Use <code>engine="mermaid"</code> or <code>engine="graphviz"</code> instead.
      </div>`;
    }
  }
  async _renderGraphviz() {
    const canvas = this.querySelector(".rk-diagram__canvas");
    const loading = this.querySelector(".rk-diagram__loading");
    if (!canvas || !this._raw) return;
    try {
      await import("https://cdn.jsdelivr.net/npm/@viz-js/viz/lib/viz-standalone.js");
      const vizGlobal = globalThis;
      const instanceFn = vizGlobal.Viz?.instance;
      if (!instanceFn) throw new Error("Viz.js not loaded");
      const viz = await instanceFn();
      const isDark = this._isDark();
      let dotCode = this._raw;
      if (isDark) {
        const prelude = '  graph [fontcolor="#c9d1d9" bgcolor="transparent"];\n  node [color="#8b949e" fontcolor="#c9d1d9"];\n  edge [color="#8b949e" fontcolor="#c9d1d9"];\n';
        dotCode = dotCode.replace("{", `{
${prelude}`);
      }
      const svgEl = viz.renderSVGElement(dotCode, {
        graphAttributes: { bgcolor: "transparent" }
      });
      const svgString = new XMLSerializer().serializeToString(svgEl);
      if (loading) loading.remove();
      canvas.innerHTML = svgString;
      this._makeSvgResponsive(canvas);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (loading) loading.textContent = `Graphviz \u6E32\u67D3\u5931\u8D25: ${message}`;
      this._reportRenderError("graphviz", message);
    }
  }
  /** Dispatch a rk-render-error CustomEvent so the viewer can collect and report errors */
  _reportRenderError(engine, message) {
    this.dispatchEvent(
      new CustomEvent("rk-render-error", {
        bubbles: true,
        detail: { engine, message, anchor: this.dataset.rkAnchor || "" }
      })
    );
  }
  _makeSvgResponsive(container) {
    const svgEl = container.querySelector("svg");
    if (svgEl) {
      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");
      svgEl.style.width = "100%";
      svgEl.style.maxWidth = "100%";
      svgEl.style.height = "auto";
    }
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-diagram", RkDiagram);

// packages/components/src/elements/rk-decision.ts
var RkDecision = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["question", "chosen", "status"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const question = this.getAttribute("question") || "";
    const chosen = this.getAttribute("chosen") || "";
    const status = this.getAttribute("status") || "proposed";
    const reasons = this.querySelectorAll("rk-reason li");
    const rationaleItems = Array.from(reasons).map((li) => `<li>${li.textContent || ""}</li>`).join("");
    const alternatives = this.querySelectorAll("rk-alternative");
    const altItems = Array.from(alternatives).map((alt) => `<li>${alt.textContent || ""}</li>`).join("");
    let statusClass = "proposed";
    if (["approved", "draft", "blocked", "resolved"].includes(status)) {
      statusClass = status;
    }
    this.innerHTML = /* html */
    `
      <div class="rk-decision">
        <div class="rk-decision__eyebrow">Decision</div>
        ${question ? `<h3 class="rk-decision__question">${this._escape(question)}</h3>` : ""}
        ${chosen ? `
          <div class="rk-decision__chosen">
            <span>Chosen: <strong>${this._escape(chosen)}</strong></span>
            <span class="rk-decision__status rk-decision__status--${statusClass}">${this._escape(status)}</span>
          </div>
        ` : ""}
        ${rationaleItems ? `
          <div class="rk-decision__rationale">
            <h4>Rationale</h4>
            <ul>${rationaleItems}</ul>
          </div>
        ` : ""}
        ${altItems ? `
          <div class="rk-decision__alternatives">
            <h4>Alternatives Considered</h4>
            <ul>${altItems}</ul>
          </div>
        ` : ""}
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-decision", RkDecision);

// packages/components/src/elements/rk-checklist.ts
var RkChecklist = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["title"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "";
    const items = this.querySelectorAll("rk-item");
    const itemHtml = Array.from(items).map((item) => {
      const checked = item.hasAttribute("checked");
      const note = item.getAttribute("note") || "";
      const text = item.textContent || "";
      const checkedClass = checked ? " is-checked" : "";
      const checkMark = checked ? "\u2713" : "";
      return (
        /* html */
        `
          <li class="rk-checklist__item${checkedClass}">
            <span class="rk-checklist__check">${checkMark}</span>
            <span class="rk-checklist__text">
              ${this._escape(text)}
              ${note ? `<span class="rk-checklist__note">${this._escape(note)}</span>` : ""}
            </span>
          </li>
        `
      );
    }).join("");
    this.innerHTML = /* html */
    `
      <div class="rk-checklist">
        ${title ? `<div class="rk-checklist__title">${this._escape(title)}</div>` : ""}
        <ul class="rk-checklist__list">${itemHtml}</ul>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-checklist", RkChecklist);

// packages/components/src/elements/rk-comparison.ts
function parsePipeTable3(raw) {
  const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const rows = [];
  for (const line of lines) {
    if (/^\|?\s*[-:]+[\s|:-]*$/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}
var RkComparison = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["title", "variant"];
  }
  connectedCallback() {
    this._raw = this.textContent || "";
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "";
    const variant = this.getAttribute("variant") || "proscons";
    const rows = parsePipeTable3(this._raw);
    if (rows.length === 0) {
      this.innerHTML = `<div class="rk-comparison"><div class="rk-comparison__title">${this._escape(title)}</div><p style="color:var(--rk-muted)">No comparison data</p></div>`;
      return;
    }
    if (variant === "matrix") {
      this._renderMatrix(title, rows);
    } else {
      this._renderProsCons(title, rows);
    }
  }
  _renderProsCons(title, rows) {
    const header = rows[0];
    const prosTitle = header[0] || "Pros";
    const consTitle = header[1] || "Cons";
    const body = rows.slice(1);
    const pros = body.map((r) => r[0] || "").filter(Boolean);
    const cons = body.map((r) => r[1] || "").filter(Boolean);
    this.innerHTML = /* html */
    `
      <div class="rk-comparison rk-comparison--proscons">
        ${title ? `<div class="rk-comparison__title">${this._escape(title)}</div>` : ""}
        <div class="rk-comparison__table">
          <div class="rk-comparison__column">
            <div class="rk-comparison__column-title">${this._escape(prosTitle)}</div>
            <ul>${pros.map((p) => `<li>${this._escape(p)}</li>`).join("")}</ul>
          </div>
          <div class="rk-comparison__column">
            <div class="rk-comparison__column-title">${this._escape(consTitle)}</div>
            <ul>${cons.map((c) => `<li>${this._escape(c)}</li>`).join("")}</ul>
          </div>
        </div>
      </div>
    `;
  }
  _renderMatrix(title, rows) {
    const header = rows[0];
    const body = rows.slice(1);
    const headerHtml = header.map((h) => `<th>${this._escape(h)}</th>`).join("");
    const bodyHtml = body.map((row) => {
      const cells = row.map((c) => `<td>${this._escape(c)}</td>`).join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    this.innerHTML = /* html */
    `
      <div class="rk-comparison rk-comparison--matrix">
        ${title ? `<div class="rk-comparison__title">${this._escape(title)}</div>` : ""}
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
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-comparison", RkComparison);

// packages/components/src/elements/rk-timeline.ts
var RkTimeline = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["title"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "";
    const steps = this.querySelectorAll("rk-step");
    const stepHtml = Array.from(steps).map((step, i) => {
      const status = step.getAttribute("status") || "next";
      const tags = step.getAttribute("tags") || "";
      const text = step.textContent || "";
      let statusClass = "next";
      if (["done", "active", "next"].includes(status)) {
        statusClass = status;
      }
      const tagHtml = tags ? `<div class="rk-timeline__tags">${tags.split(",").map((t) => `<span>${this._escape(t.trim())}</span>`).join("")}</div>` : "";
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
    }).join("");
    this.innerHTML = /* html */
    `
      <div class="rk-timeline">
        ${title ? `<div class="rk-timeline__title">${this._escape(title)}</div>` : ""}
        <ol class="rk-timeline__steps">${stepHtml}</ol>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-timeline", RkTimeline);

// packages/components/src/elements/rk-tabs.ts
var RkTabs = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["title"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "";
    const tabs = Array.from(this.querySelectorAll("rk-tab"));
    if (tabs.length === 0) {
      this.innerHTML = `<div class="rk-tabs"><p style="color:var(--rk-muted)">No tabs found. Use &lt;rk-tab label="\u2026"&gt; inside.</p></div>`;
      return;
    }
    const navBtns = tabs.map((tab, i) => {
      const label = tab.getAttribute("label") || `Tab ${i + 1}`;
      const id = tab.getAttribute("id") || `tab-${i}`;
      const active = i === 0 ? " is-active" : "";
      return `<button class="rk-tabs__btn${active}" data-tab="${id}" role="tab" aria-selected="${i === 0}">${this._escape(label)}</button>`;
    }).join("");
    const panels = tabs.map((tab, i) => {
      const id = tab.getAttribute("id") || `tab-${i}`;
      const active = i === 0 ? " is-active" : "";
      return `<div class="rk-tabs__panel${active}" data-tab="${id}" role="tabpanel">${tab.innerHTML}</div>`;
    }).join("");
    this.innerHTML = /* html */
    `
      <div class="rk-tabs">
        ${title ? `<div class="rk-tabs__title">${this._escape(title)}</div>` : ""}
        <div class="rk-tabs__nav" role="tablist">${navBtns}</div>
        <div class="rk-tabs__panels">${panels}</div>
      </div>
    `;
    this.querySelectorAll(".rk-tabs__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.tab;
        this.querySelectorAll(".rk-tabs__btn").forEach((b) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        });
        this.querySelectorAll(".rk-tabs__panel").forEach((p) => {
          p.classList.remove("is-active");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        this.querySelector(`.rk-tabs__panel[data-tab="${targetId}"]`)?.classList.add("is-active");
      });
    });
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-tabs", RkTabs);

// packages/components/src/elements/rk-grid.ts
var RkGrid = class extends HTMLElement {
  _rendered = false;
  static get observedAttributes() {
    return ["cols", "gap"];
  }
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    this._build();
  }
  _build() {
    const cols = this.getAttribute("cols") || "2";
    const gap = this.getAttribute("gap") || "md";
    const colCount = ["2", "3", "4"].includes(cols) ? cols : "2";
    const children = Array.from(this.children);
    const isColBased = children.some((c) => c.tagName.toLowerCase() === "rk-col");
    const cells = isColBased ? children.filter((c) => c.tagName.toLowerCase() === "rk-col") : children;
    const grid = document.createElement("div");
    grid.className = `rk-grid rk-grid--cols-${colCount} rk-grid--gap-${gap}`;
    for (const cell of cells) {
      const wrapper = document.createElement("div");
      wrapper.className = "rk-grid__cell";
      wrapper.appendChild(cell);
      grid.appendChild(wrapper);
    }
    this.innerHTML = "";
    this.appendChild(grid);
  }
};
customElements.define("rk-grid", RkGrid);

// packages/components/src/elements/rk-image.ts
var RkImage = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["src", "alt", "caption", "credit", "width"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const src = this.getAttribute("src") || "";
    const alt = this.getAttribute("alt") || "";
    const caption = this.getAttribute("caption") || "";
    const credit = this.getAttribute("credit") || "";
    const width = this.getAttribute("width") || "normal";
    if (!src) {
      this.innerHTML = `<div class="rk-image rk-image--${width}"><p style="color:var(--rk-muted)">rk-image requires a src attribute.</p></div>`;
      return;
    }
    const figcaption = caption || credit ? `<figcaption class="rk-image__caption">
          ${caption ? `<span>${this._escape(caption)}</span>` : ""}
          ${credit ? `<span class="rk-image__credit">${this._escape(credit)}</span>` : ""}
        </figcaption>` : "";
    this.innerHTML = /* html */
    `
      <figure class="rk-image rk-image--${width}">
        <div class="rk-image__wrap">
          <img src="${this._escapeAttr(src)}" alt="${this._escapeAttr(alt)}" loading="lazy">
        </div>
        ${figcaption}
      </figure>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  _escapeAttr(s) {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
};
customElements.define("rk-image", RkImage);

// packages/components/src/elements/rk-quote.ts
var RkQuote = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["attribution", "source", "source-url"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const attribution = this.getAttribute("attribution") || "";
    const source = this.getAttribute("source") || "";
    const sourceUrl = this.getAttribute("source-url") || "";
    const sourceHtml = source ? sourceUrl ? ` <cite><a href="${this._escapeAttr(sourceUrl)}" target="_blank" rel="noopener">${this._escape(source)}</a></cite>` : ` <cite>${this._escape(source)}</cite>` : "";
    const figcaption = attribution || source ? `<figcaption class="rk-quote__attribution">
          ${attribution ? `\u2014 ${this._escape(attribution)}` : ""}${sourceHtml}
        </figcaption>` : "";
    this.innerHTML = /* html */
    `
      <figure class="rk-quote">
        <blockquote class="rk-quote__body">${this._raw}</blockquote>
        ${figcaption}
      </figure>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  _escapeAttr(s) {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
};
customElements.define("rk-quote", RkQuote);

// packages/components/src/elements/rk-collapsible.ts
var RkCollapsible = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["summary", "open"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const summary = this.getAttribute("summary") || "Details";
    const isOpen = this.hasAttribute("open");
    this.innerHTML = /* html */
    `
      <details class="rk-collapsible"${isOpen ? " open" : ""}>
        <summary class="rk-collapsible__summary">
          <span class="rk-collapsible__icon">\u25B6</span>
          <span>${this._escape(summary)}</span>
        </summary>
        <div class="rk-collapsible__body">${this._raw}</div>
      </details>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-collapsible", RkCollapsible);

// packages/components/src/elements/rk-highlight.ts
var RkHighlight = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["label"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const label = this.getAttribute("label") || "\u8981\u70B9";
    this.innerHTML = /* html */
    `
      <div class="rk-highlight">
        <span class="rk-highlight__label">${this._escape(label)}</span>
        <div class="rk-highlight__body">${this._raw}</div>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-highlight", RkHighlight);

// packages/components/src/elements/rk-progress.ts
var RkProgress = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["label", "value", "max", "tone"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const label = this.getAttribute("label") || "";
    const rawValue = parseFloat(this.getAttribute("value") || "0");
    const max = parseFloat(this.getAttribute("max") || "100");
    const tone = this.getAttribute("tone") || "default";
    const pct = Math.min(100, Math.max(0, rawValue / max * 100));
    const displayValue = Math.round(rawValue);
    this.innerHTML = /* html */
    `
      <div class="rk-progress">
        <div class="rk-progress__header">
          ${label ? `<span class="rk-progress__label">${this._escape(label)}</span>` : ""}
          <span class="rk-progress__value">${displayValue}%</span>
        </div>
        <div class="rk-progress__track">
          <div class="rk-progress__fill rk-progress__fill--${tone}" style="width:${pct}%"></div>
        </div>
        ${this._raw ? `<div class="rk-progress__extra">${this._raw}</div>` : ""}
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-progress", RkProgress);

// packages/components/src/elements/rk-steps.ts
var RkSteps = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["current"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const current = parseInt(this.getAttribute("current") || "1", 10);
    const steps = Array.from(this.querySelectorAll("rk-step"));
    if (steps.length === 0) {
      this.innerHTML = `<div class="rk-steps"><p style="color:var(--rk-muted)">No steps found. Use &lt;rk-step&gt; inside.</p></div>`;
      return;
    }
    const items = steps.map((step, i) => {
      const n = i + 1;
      const label = step.getAttribute("label") || step.textContent?.trim() || `Step ${n}`;
      let status = "next";
      if (n < current) status = "done";
      else if (n === current) status = "active";
      const circle = status === "done" ? "\u2713" : `${n}`;
      const itemHtml = `
          <div class="rk-steps__item rk-steps__item--${status}">
            <div class="rk-steps__circle">${circle}</div>
            <div class="rk-steps__label">${this._escape(label)}</div>
          </div>`;
      const connector = i < steps.length - 1 ? '<div class="rk-steps__connector"></div>' : "";
      return itemHtml + connector;
    }).join("");
    this.innerHTML = /* html */
    `
      <div class="rk-steps">
        <div class="rk-steps__track">${items}</div>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-steps", RkSteps);

// packages/components/src/elements/rk-metric.ts
var RkMetric = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["cols"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const rawCols = this.getAttribute("cols") || "4";
    const cols = ["2", "3", "4"].includes(rawCols) ? rawCols : "4";
    const items = Array.from(this.querySelectorAll("rk-metric-item"));
    if (items.length === 0) {
      this.innerHTML = `<div class="rk-metric"><p style="color:var(--rk-muted)">No metric items found. Use &lt;rk-metric-item label="\u2026" value="\u2026"&gt; inside.</p></div>`;
      return;
    }
    const cards = items.map((item) => {
      const label = item.getAttribute("label") || "";
      const value = item.getAttribute("value") || "\u2014";
      const delta = item.getAttribute("delta") || "";
      const tone = item.getAttribute("tone") || "";
      const deltaHtml = delta ? `<span class="rk-metric__delta${tone ? ` rk-metric__delta--${tone}` : ""}">${this._escape(delta)}</span>` : "";
      return `
          <div class="rk-metric__card">
            <div class="rk-metric__value-row">
              <span class="rk-metric__value">${this._escape(value)}</span>
              ${deltaHtml}
            </div>
            <div class="rk-metric__label">${this._escape(label)}</div>
          </div>`;
    }).join("");
    this.innerHTML = /* html */
    `
      <div class="rk-metric rk-metric--cols-${cols}">
        ${cards}
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-metric", RkMetric);

// packages/components/src/elements/rk-3d.ts
var RkThreeD = class extends HTMLElement {
  _rendered = false;
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    this._render();
  }
  _render() {
    const scene = this.getAttribute("scene") || "cube";
    const height = this.getAttribute("height") || "360";
    const caption = this.getAttribute("caption") || "";
    const color = this.getAttribute("color") || "#6366f1";
    const uid = Math.random().toString(36).slice(2, 9);
    this.innerHTML = `
      <div class="rk-3d">
        <canvas class="rk-3d__canvas" id="rk3d-${uid}" height="${height}" style="width:100%;height:${height}px;display:block;"></canvas>
        ${caption ? `<p class="rk-3d__caption">${this._escape(caption)}</p>` : ""}
      </div>`;
    this._loadThree(uid, scene, color, parseInt(height, 10));
  }
  async _loadThree(uid, scene, color, height) {
    try {
      const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170/build/three.module.js");
      const canvas = this.querySelector(`#rk3d-${uid}`);
      if (!canvas) return;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvas.clientWidth || 600, height);
      const camera = new THREE.PerspectiveCamera(
        60,
        (canvas.clientWidth || 600) / height,
        0.1,
        100
      );
      camera.position.set(0, 0, 3);
      const threeScene = new THREE.Scene();
      threeScene.background = null;
      threeScene.add(new THREE.AmbientLight(16777215, 0.6));
      const dirLight = new THREE.DirectionalLight(16777215, 1);
      dirLight.position.set(5, 5, 5);
      threeScene.add(dirLight);
      let geo;
      if (scene === "sphere") geo = new THREE.SphereGeometry(1, 32, 32);
      else if (scene === "torus") geo = new THREE.TorusGeometry(0.7, 0.3, 16, 100);
      else if (scene === "orbit") geo = new THREE.IcosahedronGeometry(0.8, 1);
      else geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const hex = parseInt(color.replace("#", ""), 16);
      const mat = new THREE.MeshPhongMaterial({ color: hex, shininess: 80 });
      const mesh = new THREE.Mesh(geo, mat);
      threeScene.add(mesh);
      if (scene === "orbit") {
        const orbitGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const colors = [16739179, 5164484, 16770669];
        for (let i = 0; i < 3; i++) {
          const orbitMat = new THREE.MeshPhongMaterial({ color: colors[i] });
          const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
          const angle = i / 3 * Math.PI * 2;
          orbitMesh.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
          threeScene.add(orbitMesh);
        }
      }
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;
      canvas.addEventListener("mousedown", (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      });
      canvas.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        mesh.rotation.y += (e.clientX - lastX) * 0.01;
        mesh.rotation.x += (e.clientY - lastY) * 0.01;
        lastX = e.clientX;
        lastY = e.clientY;
      });
      canvas.addEventListener("mouseup", () => {
        isDragging = false;
      });
      canvas.addEventListener("mouseleave", () => {
        isDragging = false;
      });
      canvas.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches.length === 1) {
            isDragging = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
          }
        },
        { passive: true }
      );
      canvas.addEventListener(
        "touchmove",
        (e) => {
          if (!isDragging || e.touches.length !== 1) return;
          mesh.rotation.y += (e.touches[0].clientX - lastX) * 0.01;
          mesh.rotation.x += (e.touches[0].clientY - lastY) * 0.01;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        },
        { passive: true }
      );
      canvas.addEventListener("touchend", () => {
        isDragging = false;
      });
      const animate = () => {
        requestAnimationFrame(animate);
        if (!isDragging) {
          mesh.rotation.x += 5e-3;
          mesh.rotation.y += 8e-3;
        }
        if (scene === "orbit") {
          const children = threeScene.children.filter(
            (c) => c !== mesh && c.type === "Mesh"
          );
          children.forEach((child, i) => {
            const t = Date.now() * 1e-3 + i / 3 * Math.PI * 2;
            child.position.set(Math.cos(t) * 1.5, Math.sin(t * 0.7) * 0.3, Math.sin(t) * 1.5);
          });
        }
        renderer.render(threeScene, camera);
      };
      animate();
      const ro = new ResizeObserver(() => {
        const w = canvas.clientWidth || 600;
        renderer.setSize(w, height);
        camera.aspect = w / height;
        camera.updateProjectionMatrix();
      });
      if (canvas.parentElement) ro.observe(canvas.parentElement);
    } catch {
      const canvas = this.querySelector(".rk-3d__canvas");
      if (canvas) {
        canvas.insertAdjacentHTML(
          "afterend",
          '<p style="color:#999;font-size:0.8rem;text-align:center;padding:1rem">3D \u9700\u8981 WebGL \u652F\u6301\u548C Three.js CDN \u52A0\u8F7D</p>'
        );
      }
    }
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-3d", RkThreeD);

// packages/components/src/elements/rk-badge.ts
var RkBadge = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["color", "icon"];
  }
  connectedCallback() {
    if (!this._raw) this._raw = this.textContent?.trim() || "";
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const color = this.getAttribute("color") || "accent";
    const icon = this.getAttribute("icon") || "";
    const text = this._raw;
    const colorMap = {
      blue: {
        bg: "var(--rk-tone-info-bg, #eff6ff)",
        text: "var(--rk-tone-info-border, #2563eb)",
        border: "var(--rk-tone-info-border, #2563eb)"
      },
      green: {
        bg: "var(--rk-tone-success-bg, #f0fdf4)",
        text: "var(--rk-tone-success-border, #16a34a)",
        border: "var(--rk-tone-success-border, #16a34a)"
      },
      red: {
        bg: "var(--rk-tone-danger-bg, #fef2f2)",
        text: "var(--rk-tone-danger-border, #dc2626)",
        border: "var(--rk-tone-danger-border, #dc2626)"
      },
      orange: {
        bg: "var(--rk-tone-warning-bg, #fffbeb)",
        text: "var(--rk-tone-warning-border, #d97706)",
        border: "var(--rk-tone-warning-border, #d97706)"
      },
      purple: { bg: "rgba(139,92,246,0.1)", text: "#7c3aed", border: "#7c3aed" },
      gray: {
        bg: "var(--rk-surface, #f5f5f4)",
        text: "var(--rk-text-tertiary, #6b6b66)",
        border: "var(--rk-border, #e5e4dc)"
      },
      accent: {
        bg: "var(--rk-accent-muted, rgba(2,103,165,0.1))",
        text: "var(--rk-accent, #0267a5)",
        border: "var(--rk-accent, #0267a5)"
      }
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
    ">${icon ? `<span>${icon}</span>` : ""}<span>${this._escape(text)}</span></span>`;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
var RkBadgeGroup = class extends HTMLElement {
  connectedCallback() {
    if (!this.style.display) {
      this.style.cssText = `
        display:flex;flex-wrap:wrap;gap:var(--rk-space-2,8px);
        align-items:center;
      `;
    }
  }
};
customElements.define("rk-badge", RkBadge);
customElements.define("rk-badge-group", RkBadgeGroup);

// packages/components/src/elements/rk-kanban.ts
var RkKanbanCard = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["priority", "tag", "assignee", "due"];
  }
  connectedCallback() {
    if (!this._raw) this._raw = (this.textContent || "").trim();
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const priority = this.getAttribute("priority") || "";
    const tag = this.getAttribute("tag") || "";
    const assignee = this.getAttribute("assignee") || "";
    const due = this.getAttribute("due") || "";
    const text = this._raw;
    const priorityColors = {
      high: "var(--rk-tone-danger-border, #dc2626)",
      medium: "var(--rk-tone-warning-border, #d97706)",
      low: "var(--rk-tone-info-border, #2563eb)"
    };
    const priorityBg = {
      high: "var(--rk-tone-danger-bg, #fef2f2)",
      medium: "var(--rk-tone-warning-bg, #fffbeb)",
      low: "var(--rk-tone-info-bg, #eff6ff)"
    };
    const borderColor = priority ? priorityColors[priority] || "var(--rk-border)" : "var(--rk-border)";
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
        ${tag || priority ? `
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
            ${tag ? `<span style="
              font:600 10px/1.4 var(--rk-font-sans,sans-serif);
              text-transform:uppercase;letter-spacing:0.05em;
              padding:2px 6px;border-radius:4px;
              background:var(--rk-accent-muted,rgba(2,103,165,0.1));
              color:var(--rk-accent,#0267a5);
            ">${this._escape(tag)}</span>` : ""}
            ${priority ? `<span style="
              font:600 10px/1.4 var(--rk-font-sans,sans-serif);
              text-transform:uppercase;letter-spacing:0.05em;
              padding:2px 6px;border-radius:4px;
              background:${priorityBg[priority] || "var(--rk-surface-2)"};
              color:${priorityColors[priority] || "var(--rk-text-muted)"};
            ">${priority === "high" ? "\u2191 \u9AD8\u4F18" : priority === "medium" ? "\u2192 \u4E2D" : "\u2193 \u4F4E"}</span>` : ""}
          </div>
        ` : ""}
        <div style="
          font:var(--rk-weight-normal,400) var(--rk-text-sm,13px)/1.6 var(--rk-font-sans,sans-serif);
          color:var(--rk-text,#1a1a1a);
        ">${this._escape(text)}</div>
        ${assignee || due ? `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
            ${assignee ? `<span style="
              font:500 11px/1 var(--rk-font-sans,sans-serif);
              color:var(--rk-text-tertiary,#6b6b66);
            ">@${this._escape(assignee)}</span>` : "<span></span>"}
            ${due ? `<span style="
              font:400 11px/1 var(--rk-font-sans,sans-serif);
              color:var(--rk-muted,#a0a0a0);
            ">${this._escape(due)}</span>` : ""}
          </div>
        ` : ""}
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
var RkKanbanCol = class extends HTMLElement {
  static get observedAttributes() {
    return ["title", "accent", "done"];
  }
  connectedCallback() {
    this._upgradeCards();
    this._renderShell();
  }
  attributeChangedCallback() {
    this._renderShell();
  }
  _upgradeCards() {
  }
  _renderShell() {
    const title = this.getAttribute("title") || "Column";
    const done = this.hasAttribute("done");
    const accent = this.getAttribute("accent") || (done ? "green" : "");
    const accentColor = accent === "green" ? "var(--rk-tone-success-border,#16a34a)" : accent === "blue" ? "var(--rk-tone-info-border,#2563eb)" : accent === "orange" ? "var(--rk-tone-warning-border,#d97706)" : accent === "red" ? "var(--rk-tone-danger-border,#dc2626)" : "var(--rk-border,#e5e4dc)";
    const existingCards = Array.from(this.querySelectorAll("rk-kanban-card"));
    const cardCount = existingCards.length;
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
    let header = this.querySelector(".rk-kanban-col__header");
    if (!header) {
      header = document.createElement("div");
      header.className = "rk-kanban-col__header";
      this.insertBefore(header, this.firstChild);
    }
    header.style.cssText = `
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
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
var RkKanban = class extends HTMLElement {
  connectedCallback() {
    this.style.cssText = `
      display:flex;gap:var(--rk-space-4,16px);
      overflow-x:auto;
      padding-bottom:var(--rk-space-2,8px);
    `;
    if (!this.querySelector(".rk-kanban__scroll-hint")) {
      const hint = document.createElement("style");
      hint.textContent = `.rk-kanban { scrollbar-width:thin; }`;
      this.appendChild(hint);
    }
  }
};
customElements.define("rk-kanban-card", RkKanbanCard);
customElements.define("rk-kanban-col", RkKanbanCol);
customElements.define("rk-kanban", RkKanban);

// packages/components/src/elements/rk-form.ts
var RkField = class extends HTMLElement {
  static get observedAttributes() {
    return ["label", "type", "max", "placeholder", "options", "required", "name", "value"];
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    this._render();
  }
  getValue() {
    const input = this.querySelector("input,textarea,select");
    const type = this.getAttribute("type") || "text";
    if (type === "rating") {
      const checked = this.querySelector(
        ".rk-field__star--active:last-of-type"
      );
      return checked ? Number(checked.dataset.value) : 0;
    }
    if (type === "checkbox") {
      return input?.checked ?? false;
    }
    return input?.value ?? "";
  }
  _render() {
    const label = this.getAttribute("label") || "";
    const type = this.getAttribute("type") || "text";
    const max = Number(this.getAttribute("max") || 5);
    const placeholder = this.getAttribute("placeholder") || "";
    const options = (this.getAttribute("options") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const required = this.hasAttribute("required");
    const name = this.getAttribute("name") || label.toLowerCase().replace(/\s+/g, "_");
    const fieldId = `rk-field-${Math.random().toString(36).slice(2, 8)}`;
    const sharedStyle = `
      font:400 var(--rk-text-base,15px)/1.5 var(--rk-font-sans,sans-serif);
      color:var(--rk-text,#1a1a1a);
      background:var(--rk-surface,#fff);
      border:1px solid var(--rk-border,#e5e4dc);
      border-radius:var(--rk-radius-sm,6px);
      padding:var(--rk-space-2,8px) var(--rk-space-3,12px);
      width:100%;box-sizing:border-box;
      outline:none;transition:border-color 150ms;
    `;
    let control = "";
    if (type === "textarea") {
      control = `<textarea id="${fieldId}" name="${name}" placeholder="${this._escape(placeholder)}" rows="4"
        style="${sharedStyle}min-height:96px;resize:vertical;"
        onfocus="this.style.borderColor='var(--rk-accent)'"
        onblur="this.style.borderColor='var(--rk-border)'"
      ></textarea>`;
    } else if (type === "select") {
      const opts = options.map((o) => `<option value="${this._escape(o)}">${this._escape(o)}</option>`).join("");
      control = `<select id="${fieldId}" name="${name}" style="${sharedStyle}cursor:pointer;"
        onfocus="this.style.borderColor='var(--rk-accent)'"
        onblur="this.style.borderColor='var(--rk-border)'"
      ><option value="">\u8BF7\u9009\u62E9...</option>${opts}</select>`;
    } else if (type === "rating") {
      const stars = Array.from({ length: max }, (_, i) => {
        const v = i + 1;
        return `<button type="button" class="rk-field__star" data-value="${v}"
          style="background:none;border:none;cursor:pointer;padding:2px;font-size:22px;line-height:1;
            color:var(--rk-border-hover,#ccc);transition:color 150ms;outline:none;"
          onclick="(function(el){
            const stars=el.closest('.rk-field__stars').querySelectorAll('.rk-field__star');
            stars.forEach((s,idx)=>{
              s.style.color=idx<${v}?'#f59e0b':'var(--rk-border-hover,#ccc)';
              s.classList.toggle('rk-field__star--active',idx<${v});
              if(idx===${v}-1)s.classList.add('rk-field__star--active');
            });
          })(this)"
          onmouseover="(function(el){
            const stars=el.closest('.rk-field__stars').querySelectorAll('.rk-field__star');
            stars.forEach((s,idx)=>{s.style.color=idx<${v}?'#fbbf24':'var(--rk-border-hover,#ccc)';});
          })(this)"
          onmouseout="(function(el){
            const stars=el.closest('.rk-field__stars').querySelectorAll('.rk-field__star');
            const active=parseInt(el.closest('.rk-field__stars').dataset.rating||'0');
            stars.forEach((s,idx)=>{s.style.color=idx<active?'#f59e0b':'var(--rk-border-hover,#ccc)';});
          })(this)"
        >\u2605</button>`;
      }).join("");
      control = `<div class="rk-field__stars" data-rating="0" style="display:flex;gap:2px;">${stars}</div>`;
    } else if (type === "checkbox") {
      control = `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="${fieldId}" name="${name}"
          style="width:16px;height:16px;accent-color:var(--rk-accent,#0267a5);cursor:pointer;">
        <span style="font:400 var(--rk-text-sm,13px)/1.5 var(--rk-font-sans);color:var(--rk-text);">
          ${this._escape(placeholder || label)}
        </span>
      </label>`;
    } else {
      control = `<input type="${type === "number" ? "number" : "text"}" id="${fieldId}" name="${name}"
        placeholder="${this._escape(placeholder)}"
        style="${sharedStyle}"
        onfocus="this.style.borderColor='var(--rk-accent)'"
        onblur="this.style.borderColor='var(--rk-border)'"
      >`;
    }
    this.innerHTML = `
      <div class="rk-field" style="margin-bottom:var(--rk-space-4,16px);">
        ${type !== "checkbox" ? `
          <label for="${fieldId}" style="
            display:block;margin-bottom:6px;
            font:600 var(--rk-text-sm,13px)/1.4 var(--rk-font-sans,sans-serif);
            color:var(--rk-text,#1a1a1a);
          ">${this._escape(label)}${required ? ' <span style="color:var(--rk-tone-danger-border,#dc2626)">*</span>' : ""}</label>
        ` : ""}
        ${control}
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
var RkForm = class extends HTMLElement {
  _fieldsHTML = "";
  static get observedAttributes() {
    return ["title", "submit-label", "description"];
  }
  connectedCallback() {
    if (!this._fieldsHTML) {
      this._fieldsHTML = Array.from(this.querySelectorAll("rk-field")).map((f) => f.outerHTML).join("") || this.innerHTML;
    }
    this._render();
  }
  attributeChangedCallback() {
    if (this._fieldsHTML) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "\u8868\u5355";
    const submitLabel = this.getAttribute("submit-label") || "\u63D0\u4EA4";
    const description = this.getAttribute("description") || "";
    const fieldHTML = this._fieldsHTML;
    this.innerHTML = `
      <div class="rk-form" style="
        background:var(--rk-surface,#fff);
        border:1px solid var(--rk-border,#e5e4dc);
        border-radius:var(--rk-radius-lg,14px);
        padding:var(--rk-space-6,24px);
        max-width:560px;
      ">
        <h3 style="
          margin:0 0 var(--rk-space-2,8px);
          font:700 var(--rk-text-lg,20px)/1.3 var(--rk-font-sans,sans-serif);
          color:var(--rk-text,#1a1a1a);
        ">${this._escape(title)}</h3>
        ${description ? `<p style="
          margin:0 0 var(--rk-space-4,16px);
          font:400 var(--rk-text-sm,13px)/1.6 var(--rk-font-sans);
          color:var(--rk-text-tertiary,#6b6b66);
        ">${this._escape(description)}</p>` : `<div style="margin-bottom:var(--rk-space-4,16px)"></div>`}
        <div class="rk-form__fields">${fieldHTML}</div>
        <button type="button" class="rk-form__submit"
          onclick="(function(btn){
            const form = btn.closest('.rk-form');
            const fields = form.querySelectorAll('rk-field');
            const result = [];
            fields.forEach(f => {
              const label = f.getAttribute('label') || f.getAttribute('name') || 'field';
              const name = f.getAttribute('name') || label.toLowerCase().replace(/s+/g, '_');
              const type = f.getAttribute('type') || 'text';
              let val;
              if(type==='rating'){
                const lastActive = f.querySelector('.rk-field__star--active');
                val = lastActive ? Number(lastActive.dataset.value) : 0;
              } else if(type==='checkbox'){
                val = f.querySelector('input')?.checked ?? false;
              } else {
                val = f.querySelector('input,textarea,select')?.value ?? '';
              }
              result.push({ name, label, value: val });
            });

            const artifactId = document.documentElement.dataset.rkArtifactId;
            if (artifactId) {
              btn.disabled = true; btn.textContent = '\u63D0\u4EA4\u4E2D\u2026';
              const formTitle = form.closest('rk-form')?.getAttribute('title') || '';
              fetch('/api/artifacts/' + artifactId + '/submissions', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ formTitle, fields: result }),
              }).then(r => r.json()).then(data => {
                if (data.ok) {
                  btn.textContent = '\u2713 \u5DF2\u63D0\u4EA4';
                  btn.style.background = 'var(--rk-tone-success-bg)';
                  btn.style.color = 'var(--rk-tone-success-border)';
                  btn.style.borderColor = 'var(--rk-tone-success-border)';
                  btn.disabled = true;
                  form.classList.add('rk-form--submitted');
                } else {
                  btn.disabled = false; btn.textContent = '\u63D0\u4EA4\u5931\u8D25\uFF0C\u91CD\u8BD5';
                }
              }).catch(() => {
                btn.disabled = false; btn.textContent = '\u7F51\u7EDC\u9519\u8BEF\uFF0C\u91CD\u8BD5';
              });
            } else {
              console.log('[RenderKit Form Submission]', JSON.stringify(result, null, 2));
              btn.textContent = '\u2713 \u5DF2\u63D0\u4EA4\uFF08\u9884\u89C8\u6A21\u5F0F\uFF09';
              btn.style.background = 'var(--rk-tone-success-bg)';
              btn.style.color = 'var(--rk-tone-success-border)';
              btn.style.borderColor = 'var(--rk-tone-success-border)';
              btn.disabled = true;
            }
          })(this)"
          style="
            display:inline-flex;align-items:center;gap:6px;
            padding:var(--rk-space-2,8px) var(--rk-space-6,24px);
            background:var(--rk-accent,#0267a5);color:white;
            border:1px solid var(--rk-accent,#0267a5);
            border-radius:var(--rk-radius-sm,6px);
            font:600 var(--rk-text-sm,13px)/1.4 var(--rk-font-sans,sans-serif);
            cursor:pointer;transition:all 150ms;
          "
          onmouseover="if(!this.disabled)this.style.background='var(--rk-accent-hover)'"
          onmouseout="if(!this.disabled)this.style.background='var(--rk-accent)'"
        >${this._escape(submitLabel)}</button>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-field", RkField);
customElements.define("rk-form", RkForm);

// packages/components/src/elements/rk-card.ts
var RkCard = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["title", "subtitle", "variant", "accent"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "";
    const subtitle = this.getAttribute("subtitle") || "";
    const variant = this.getAttribute("variant") || "default";
    const accent = this.getAttribute("accent") || "";
    const variantClass = variant !== "default" ? ` rk-card--${variant}` : "";
    const accentClass = accent ? ` rk-card--accent-${accent}` : "";
    this.innerHTML = /* html */
    `
      <div class="rk-card${variantClass}${accentClass}">
        ${title || subtitle ? `
        <div class="rk-card__header">
          ${title ? `<div class="rk-card__title">${this._escape(title)}</div>` : ""}
          ${subtitle ? `<div class="rk-card__subtitle">${this._escape(subtitle)}</div>` : ""}
        </div>` : ""}
        <div class="rk-card__body">${this._raw}</div>
      </div>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-card", RkCard);

// packages/components/src/elements/rk-section.ts
var RkSection = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["title", "subtitle", "level", "divider"];
  }
  connectedCallback() {
    this._raw = this.innerHTML;
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "";
    const subtitle = this.getAttribute("subtitle") || "";
    const level = this.getAttribute("level") || "h2";
    const hasDivider = this.hasAttribute("divider");
    const safeLevel = ["h2", "h3", "h4"].includes(level) ? level : "h2";
    const dividerClass = hasDivider ? " rk-section--divider" : "";
    this.innerHTML = /* html */
    `
      <section class="rk-section${dividerClass}">
        ${title ? `
        <div class="rk-section__header">
          <${safeLevel} class="rk-section__title">${this._escape(title)}</${safeLevel}>
          ${subtitle ? `<p class="rk-section__subtitle">${this._escape(subtitle)}</p>` : ""}
        </div>` : ""}
        <div class="rk-section__body">${this._raw}</div>
      </section>
    `;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-section", RkSection);

// packages/components/src/elements/rk-diff.ts
var RkDiff = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["lang", "title", "from", "to", "compact"];
  }
  connectedCallback() {
    this._raw = this.textContent || "";
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const lang = this.getAttribute("lang") || "";
    const title = this.getAttribute("title") || "";
    const from = this.getAttribute("from") || "";
    const to = this.getAttribute("to") || "";
    const lines = this._raw.split("\n");
    const parsed = this._parseLines(lines);
    const stats = this._stats(parsed);
    let headerTitle = title;
    if (!headerTitle && (from || to)) {
      headerTitle = from && to ? `${from} \u2192 ${to}` : from || to;
    }
    const langBadge = lang ? `<span class="rk-diff__lang">${this._escape(lang)}</span>` : "";
    const statsBadge = `
      ${stats.added > 0 ? `<span class="rk-diff__stat rk-diff__stat--add">+${stats.added}</span>` : ""}
      ${stats.removed > 0 ? `<span class="rk-diff__stat rk-diff__stat--del">-${stats.removed}</span>` : ""}
    `;
    const headerHtml = (
      /* html */
      `
      <div class="rk-diff__header">
        <div class="rk-diff__header-left">
          <svg class="rk-diff__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
          ${headerTitle ? `<span class="rk-diff__title">${this._escape(headerTitle)}</span>` : ""}
          ${langBadge}
        </div>
        <div class="rk-diff__header-right">${statsBadge}</div>
      </div>
    `
    );
    const bodyHtml = this._renderLines(parsed);
    this.innerHTML = /* html */
    `
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
  _parseLines(lines) {
    const result = [];
    let lineOld = 0;
    let lineNew = 0;
    for (const line of lines) {
      if (line.startsWith("@@")) {
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          lineOld = parseInt(match[1], 10);
          lineNew = parseInt(match[2], 10);
        }
        result.push({ type: "hunk", text: line });
      } else if (line.startsWith("---") || line.startsWith("+++") || line.startsWith("diff ") || line.startsWith("index ")) {
        result.push({ type: "meta", text: line });
      } else if (line.startsWith("+")) {
        result.push({ type: "add", text: line.slice(1), lineOld: void 0, lineNew: lineNew++ });
      } else if (line.startsWith("-")) {
        result.push({ type: "del", text: line.slice(1), lineOld: lineOld++, lineNew: void 0 });
      } else if (line.startsWith(" ") || line === "") {
        const txt = line.startsWith(" ") ? line.slice(1) : line;
        result.push({ type: "ctx", text: txt, lineOld: lineOld++, lineNew: lineNew++ });
      } else {
        result.push({ type: "ctx", text: line, lineOld: lineOld++, lineNew: lineNew++ });
      }
    }
    return result;
  }
  _stats(parsed) {
    let added = 0;
    let removed = 0;
    for (const l of parsed) {
      if (l.type === "add") added++;
      else if (l.type === "del") removed++;
    }
    return { added, removed };
  }
  _renderLines(parsed) {
    const rows = [];
    for (const line of parsed) {
      if (line.type === "meta") continue;
      if (line.type === "hunk") {
        rows.push(`
          <tr class="rk-diff__row rk-diff__row--hunk">
            <td class="rk-diff__gutter rk-diff__gutter--hunk" colspan="2"></td>
            <td class="rk-diff__code rk-diff__code--hunk">${this._escape(line.text)}</td>
          </tr>
        `);
        continue;
      }
      const typeClass = `rk-diff__row--${line.type}`;
      const oldNum = line.lineOld !== void 0 ? String(line.lineOld) : "";
      const newNum = line.lineNew !== void 0 ? String(line.lineNew) : "";
      const prefix = line.type === "add" ? "+" : line.type === "del" ? "\u2212" : " ";
      rows.push(`
        <tr class="rk-diff__row ${typeClass}">
          <td class="rk-diff__gutter rk-diff__gutter--old">${oldNum}</td>
          <td class="rk-diff__gutter rk-diff__gutter--new">${newNum}</td>
          <td class="rk-diff__code"><span class="rk-diff__prefix">${prefix}</span><span class="rk-diff__text">${this._escape(line.text)}</span></td>
        </tr>
      `);
    }
    return rows.join("");
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-diff", RkDiff);

// packages/components/src/elements/rk-infographic.ts
var _libLoaded = null;
function loadLib() {
  if (_libLoaded) return _libLoaded;
  _libLoaded = new Promise((resolve, reject) => {
    if (window.AntVInfographic) {
      resolve(window.AntVInfographic);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@antv/infographic@0.2/dist/infographic.min.js";
    s.crossOrigin = "anonymous";
    s.onload = () => {
      if (window.AntVInfographic) {
        resolve(window.AntVInfographic);
      } else {
        reject(new Error("AntVInfographic not found after script load"));
      }
    };
    s.onerror = () => reject(new Error("Failed to load @antv/infographic from CDN"));
    document.head.appendChild(s);
  });
  return _libLoaded;
}
var RkInfographic = class extends HTMLElement {
  _raw = "";
  _instance = null;
  _ro = null;
  static get observedAttributes() {
    return ["title", "height", "theme"];
  }
  connectedCallback() {
    this._raw = this.textContent || "";
    this._render();
  }
  disconnectedCallback() {
    this._cleanup();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _cleanup() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._instance) {
      this._instance.destroy?.();
      this._instance = null;
    }
  }
  _uid() {
    return Math.random().toString(36).slice(2, 9);
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  async _render() {
    const title = this.getAttribute("title") || "";
    const height = this.getAttribute("height") || "400";
    const theme = this.getAttribute("theme") || "";
    const syntax = this._raw.trim();
    const uid = this._uid();
    if (!syntax) {
      this.innerHTML = `<div class="rk-infographic"><p style="color:var(--rk-muted)">No infographic syntax provided.</p></div>`;
      return;
    }
    this.innerHTML = /* html */
    `
      <div class="rk-infographic">
        ${title ? `<div class="rk-infographic__title">${this._escape(title)}</div>` : ""}
        <div class="rk-infographic__canvas" id="infographic-${uid}"></div>
      </div>
    `;
    const container = this.querySelector(`#infographic-${uid}`);
    if (!container) return;
    container.style.height = `${parseInt(height, 10) || 400}px`;
    try {
      const lib = await loadLib();
      this._cleanup();
      const opts = {
        container,
        width: "100%",
        height: parseInt(height, 10) || 400,
        editable: false
      };
      if (theme) {
        opts.theme = theme;
      }
      this._instance = new lib.Infographic(opts);
      this._instance.render(syntax);
      this._ro = new ResizeObserver(() => {
        const svg = container.querySelector("svg");
        if (svg) {
          svg.setAttribute("width", "100%");
        }
      });
      this._ro.observe(container);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">Infographic load failed: ${this._escape(message)}</div>`;
    }
  }
};
customElements.define("rk-infographic", RkInfographic);

// packages/components/src/elements/rk-map.ts
var TILE_URLS = {
  osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "carto-light": "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  "carto-dark": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
};
var TILE_ATTRIBUTIONS = {
  osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  "carto-light": '&copy; <a href="https://carto.com/">CARTO</a>',
  "carto-dark": '&copy; <a href="https://carto.com/">CARTO</a>'
};
var RkMap = class extends HTMLElement {
  _map = null;
  _raw = "";
  _uid = Math.random().toString(36).slice(2, 9);
  static get observedAttributes() {
    return ["center", "zoom", "height", "title", "tiles"];
  }
  connectedCallback() {
    this._raw = (this.textContent || "").trim();
    this._render();
  }
  disconnectedCallback() {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }
  attributeChangedCallback() {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
    this._render();
  }
  _parseCenter() {
    const raw = this.getAttribute("center") || "30,105";
    const parts = raw.split(",").map(Number);
    const lat = isNaN(parts[0]) ? 30 : parts[0];
    const lng = isNaN(parts[1]) ? 105 : parts[1];
    return [lat, lng];
  }
  _parseMarkers() {
    if (!this._raw) return [];
    try {
      const data = JSON.parse(this._raw);
      if (!Array.isArray(data)) return [];
      return data.filter(
        (m) => typeof m === "object" && m !== null && typeof m.lat === "number" && typeof m.lng === "number"
      );
    } catch {
      return [];
    }
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  _injectLeafletCSS() {
    if (document.querySelector("link[data-rk-leaflet-css]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
    link.setAttribute("data-rk-leaflet-css", "");
    document.head.appendChild(link);
  }
  async _render() {
    const center = this._parseCenter();
    const zoom = parseInt(this.getAttribute("zoom") || "4", 10) || 4;
    const height = parseInt(this.getAttribute("height") || "400", 10) || 400;
    const title = this.getAttribute("title") || "";
    const tiles = this.getAttribute("tiles") || "osm";
    const markers = this._parseMarkers();
    const tileUrl = TILE_URLS[tiles] || TILE_URLS.osm;
    const tileAttr = TILE_ATTRIBUTIONS[tiles] || TILE_ATTRIBUTIONS.osm;
    const containerId = `rk-map-${this._uid}`;
    this.innerHTML = `
      <div class="rk-map">
        ${title ? `<div class="rk-map__title">${this._escape(title)}</div>` : ""}
        <div class="rk-map__container" id="${containerId}" style="height:${height}px;width:100%;"></div>
        ${markers.length > 0 ? `<div class="rk-map__info">${markers.length} marker${markers.length > 1 ? "s" : ""}</div>` : ""}
      </div>`;
    this._injectLeafletCSS();
    try {
      const L = await import(
        /* @vite-ignore */
        "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js"
      );
      const container = this.querySelector(`#${containerId}`);
      if (!container) return;
      const map = L.map(container, {
        scrollWheelZoom: true,
        zoomControl: true
      }).setView(center, zoom);
      L.tileLayer(tileUrl, {
        attribution: tileAttr,
        maxZoom: 19
      }).addTo(map);
      if (markers.length > 1) {
        for (const m of markers) {
          const mk = L.marker([m.lat, m.lng]);
          if (m.label) {
            mk.bindPopup(this._escape(m.label), { closeButton: false });
          }
          mk.addTo(map);
        }
        const bounds = markers.map((m) => [m.lat, m.lng]);
        map.setView(
          [
            (Math.min(...bounds.map((b) => b[0])) + Math.max(...bounds.map((b) => b[0]))) / 2,
            (Math.min(...bounds.map((b) => b[1])) + Math.max(...bounds.map((b) => b[1]))) / 2
          ],
          zoom
        );
      } else if (markers.length === 1) {
        const m = markers[0];
        const mk = L.marker([m.lat, m.lng]);
        if (m.label) {
          mk.bindPopup(this._escape(m.label), { closeButton: false });
        }
        mk.addTo(map);
        map.setView([m.lat, m.lng], Math.max(zoom, 10));
      }
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
      this._map = map;
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-map__error">Map load failed: ${err.message}</div>`;
      }
    }
  }
};
customElements.define("rk-map", RkMap);

// packages/components/src/elements/rk-datagrid.ts
var RkDatagrid = class extends HTMLElement {
  _raw = "";
  _gridApi = null;
  _resizeObserver = null;
  static get observedAttributes() {
    return ["title", "height", "theme", "pagination", "page-size"];
  }
  connectedCallback() {
    this._raw = this.textContent?.trim() || "";
    this._render();
  }
  disconnectedCallback() {
    this._destroy();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._gridApi) {
      this._gridApi.destroy();
      this._gridApi = null;
    }
  }
  async _render() {
    const title = this.getAttribute("title") || "";
    const height = parseInt(this.getAttribute("height") || "400", 10);
    const rawTheme = this.getAttribute("theme") || "alpine";
    const pagination = this.hasAttribute("pagination");
    const pageSize = parseInt(this.getAttribute("page-size") || "20", 10);
    let columnDefs = [];
    let rowData = [];
    try {
      const json = JSON.parse(this._raw);
      columnDefs = json.columns || [];
      rowData = json.rows || [];
    } catch {
      this.innerHTML = /* html */
      `
        <div class="rk-datagrid">
          ${title ? `<div class="rk-datagrid__title">${this._esc(title)}</div>` : ""}
          <div class="rk-datagrid__error">
            <p style="color:var(--rk-muted)">Invalid JSON. Expected: {"columns": [...], "rows": [...]}</p>
          </div>
        </div>
      `;
      return;
    }
    if (columnDefs.length === 0) {
      this.innerHTML = /* html */
      `
        <div class="rk-datagrid">
          ${title ? `<div class="rk-datagrid__title">${this._esc(title)}</div>` : ""}
          <div class="rk-datagrid__empty">
            <p style="color:var(--rk-muted)">No columns defined</p>
          </div>
        </div>
      `;
      return;
    }
    let theme = rawTheme;
    if (theme === "alpine") {
      try {
        const bg = getComputedStyle(this).getPropertyValue("--rk-bg").trim();
        if (bg && this._isDarkColor(bg)) {
          theme = "alpine-dark";
        }
      } catch {
      }
    }
    this.innerHTML = /* html */
    `
      <div class="rk-datagrid">
        ${title ? `<div class="rk-datagrid__title">${this._esc(title)}</div>` : ""}
        <div class="rk-datagrid__container" style="height:${height}px"></div>
      </div>
    `;
    const container = this.querySelector(".rk-datagrid__container");
    if (!container) return;
    const themeClass = `ag-theme-${theme}`;
    container.classList.add(themeClass);
    try {
      await this._loadStylesheet(
        "https://cdn.jsdelivr.net/npm/ag-grid-community@32/styles/ag-grid.css"
      );
      await this._loadStylesheet(
        `https://cdn.jsdelivr.net/npm/ag-grid-community@32/styles/ag-theme-${theme}.css`
      );
      const agGrid = await this._loadAgGrid();
      const gridOptions = {
        columnDefs,
        rowData,
        animateRows: true,
        defaultColDef: {
          sortable: true,
          filter: true,
          resizable: true
        }
      };
      if (pagination) {
        gridOptions.pagination = true;
        gridOptions.paginationPageSize = pageSize;
      }
      const { api } = agGrid.createGrid(container, gridOptions);
      this._gridApi = api;
      this._resizeObserver = new ResizeObserver(() => {
        if (this._gridApi) {
          window.dispatchEvent(new Event("resize"));
        }
      });
      this._resizeObserver.observe(container);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = /* html */
      `
        <div style="padding:var(--rk-space-3,12px);color:var(--rk-tone-danger-border,#e53e3e);font-size:var(--rk-text-sm,14px)">
          AG Grid load failed: ${this._esc(message)}
        </div>
      `;
    }
  }
  /** Load AG Grid from CDN as ESM */
  _loadAgGrid() {
    return new Promise((resolve, reject) => {
      if (window.agGrid) {
        resolve(window.agGrid);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/ag-grid-community@32/dist/ag-grid-community.min.js";
      script.onload = () => {
        if (window.agGrid) {
          resolve(window.agGrid);
        } else {
          reject(new Error("agGrid not found on window after script load"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load AG Grid script from CDN"));
      document.head.appendChild(script);
    });
  }
  /** Inject a stylesheet link if not already present */
  _loadStylesheet(url) {
    const existing = document.querySelector(
      `link[rel="stylesheet"][href="${url}"]`
    );
    if (existing) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
      document.head.appendChild(link);
    });
  }
  /** Rough check if a CSS color value is "dark" */
  _isDarkColor(color) {
    const el = document.createElement("div");
    el.style.color = color;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);
    const match = computed.match(/(\d+)/g);
    if (!match || match.length < 3) return false;
    const [r, g, b] = match.map(Number);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum < 0.5;
  }
  _esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-datagrid", RkDatagrid);

// packages/components/src/elements/rk-plot.ts
var RkPlot = class extends HTMLElement {
  _raw = "";
  _ro = null;
  _plotEl = null;
  static get observedAttributes() {
    return ["title", "caption", "height"];
  }
  connectedCallback() {
    this._raw = this.textContent?.trim() || "";
    this._render();
  }
  disconnectedCallback() {
    this._ro?.disconnect();
    this._ro = null;
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  async _render() {
    const title = this.getAttribute("title") || "";
    const caption = this.getAttribute("caption") || "";
    const height = parseInt(this.getAttribute("height") || "300", 10);
    this.innerHTML = /* html */
    `
      <div class="rk-plot">
        ${title ? `<div class="rk-plot__title">${this._esc(title)}</div>` : ""}
        <div class="rk-plot__canvas"></div>
        ${caption ? `<div class="rk-plot__caption">${this._esc(caption)}</div>` : ""}
      </div>
    `;
    const canvas = this.querySelector(".rk-plot__canvas");
    if (!canvas) return;
    let spec;
    try {
      spec = JSON.parse(this._raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      canvas.innerHTML = `<div class="rk-plot__error">Invalid JSON: ${this._esc(msg)}</div>`;
      return;
    }
    let Plot;
    try {
      Plot = await this._loadPlot();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      canvas.innerHTML = `<div class="rk-plot__error">Plot library load failed: ${this._esc(msg)}</div>`;
      return;
    }
    try {
      const svg = this._buildPlot(Plot, spec, canvas.offsetWidth || 600, height);
      canvas.innerHTML = "";
      canvas.appendChild(svg);
      this._plotEl = svg;
      this._ro?.disconnect();
      this._ro = new ResizeObserver(() => {
        const newWidth = canvas.offsetWidth || 600;
        try {
          const updated = this._buildPlot(Plot, spec, newWidth, height);
          canvas.innerHTML = "";
          canvas.appendChild(updated);
          this._plotEl = updated;
        } catch {
        }
      });
      this._ro.observe(canvas);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      canvas.innerHTML = `<div class="rk-plot__error">Plot render error: ${this._esc(msg)}</div>`;
    }
  }
  _buildPlot(Plot, spec, width, height) {
    const { marks: rawMarks, ...plotOpts } = spec;
    const markInstances = [];
    if (Array.isArray(rawMarks)) {
      for (const m of rawMarks) {
        if (!m || typeof m !== "object") continue;
        const { type, data, ...opts } = m;
        const markFn = Plot[type];
        if (typeof markFn !== "function") continue;
        const mappedOpts = this._mapOpts(opts);
        const mark = data !== void 0 ? markFn(data, mappedOpts) : markFn(mappedOpts);
        markInstances.push(mark);
      }
    }
    const style = getComputedStyle(this);
    const accent = style.getPropertyValue("--rk-accent").trim() || "#4f46e5";
    const textColor = style.getPropertyValue("--rk-text").trim() || "#374151";
    const options = {
      width,
      height,
      ...plotOpts,
      marks: markInstances,
      style: {
        color: textColor,
        ...plotOpts.style || {}
      }
    };
    if (!options.color) {
      options.color = { scheme: "Tableau10" };
    }
    return Plot.plot(options);
  }
  /** Map snake_case opts to camelCase for Plot API */
  _mapOpts(opts) {
    const mapped = {};
    for (const [k, v] of Object.entries(opts)) {
      const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      mapped[camel] = v;
    }
    return mapped;
  }
  /** Lazy-load Observable Plot from CDN (UMD → window.Plot) */
  async _loadPlot() {
    const w = window;
    if (w.Plot) return w.Plot;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/dist/plot.umd.min.js";
      script.async = true;
      script.onload = () => {
        if (w.Plot) resolve(w.Plot);
        else reject(new Error("Plot not found after script load"));
      };
      script.onerror = () => reject(new Error("Failed to load Plot from CDN"));
      document.head.appendChild(script);
    });
  }
  _esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-plot", RkPlot);

// packages/components/src/elements/rk-sketch.ts
var RkSketch = class extends HTMLElement {
  _raw = "";
  _ro = null;
  _loaded = false;
  static get observedAttributes() {
    return ["width", "height", "roughness", "title"];
  }
  connectedCallback() {
    this._raw = (this.textContent || "").trim();
    this._render();
  }
  disconnectedCallback() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
  }
  attributeChangedCallback() {
    if (this._loaded || this._raw) this._render();
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  _parseSpec() {
    if (!this._raw) return null;
    try {
      const data = JSON.parse(this._raw);
      if (!data || !Array.isArray(data.shapes)) return null;
      return data;
    } catch {
      return null;
    }
  }
  _makeOpts(shape, globalRoughness) {
    return {
      roughness: shape.roughness ?? globalRoughness,
      stroke: shape.stroke || "currentColor",
      strokeWidth: shape.strokeWidth ?? 1.5,
      fill: shape.fill || void 0,
      fillStyle: shape.fillStyle || (shape.fill ? "hachure" : void 0)
    };
  }
  _drawArrowHead(svg, x1, y1, x2, y2, color) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 10;
    const x3 = x2 - size * Math.cos(angle - Math.PI / 6);
    const y3 = y2 - size * Math.sin(angle - Math.PI / 6);
    const x4 = x2 - size * Math.cos(angle + Math.PI / 6);
    const y4 = y2 - size * Math.sin(angle + Math.PI / 6);
    const head = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    head.setAttribute("points", `${x2},${y2} ${x3},${y3} ${x4},${y4}`);
    head.setAttribute("fill", color);
    head.setAttribute("stroke", color);
    svg.appendChild(head);
  }
  _addLabel(svg, x, y, text) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.setAttribute("x", String(x));
    el.setAttribute("y", String(y));
    el.setAttribute("text-anchor", "middle");
    el.setAttribute("dominant-baseline", "central");
    el.setAttribute("font-size", "13");
    el.setAttribute("font-family", "inherit");
    el.setAttribute("fill", "currentColor");
    el.textContent = text;
    svg.appendChild(el);
  }
  async _render() {
    const width = parseInt(this.getAttribute("width") || "500", 10) || 500;
    const height = parseInt(this.getAttribute("height") || "300", 10) || 300;
    const roughness = parseFloat(this.getAttribute("roughness") || "1.5") || 1.5;
    const title = this.getAttribute("title") || "";
    const spec = this._parseSpec();
    if (!spec) {
      this.innerHTML = `<div class="rk-sketch"><div class="rk-sketch__error">Invalid JSON spec. Expected: {"shapes": [...]}</div></div>`;
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "rk-sketch";
    if (title) {
      const t = document.createElement("div");
      t.className = "rk-sketch__title";
      t.textContent = title;
      wrapper.appendChild(t);
    }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", "rk-sketch__svg");
    wrapper.appendChild(svg);
    const errorDiv = document.createElement("div");
    errorDiv.className = "rk-sketch__error";
    errorDiv.style.display = "none";
    wrapper.appendChild(errorDiv);
    this.innerHTML = "";
    this.appendChild(wrapper);
    try {
      const rough = await import(
        /* @vite-ignore */
        "https://cdn.jsdelivr.net/npm/roughjs@4/bundled/rough.esm.js"
      );
      const rc = rough.default || rough;
      const drawer = rc.svg(svg);
      for (const shape of spec.shapes) {
        const opts = this._makeOpts(shape, roughness);
        switch (shape.type) {
          case "rect":
            drawer.rect(shape.x ?? 0, shape.y ?? 0, shape.w ?? 100, shape.h ?? 60, opts);
            if (shape.label) {
              this._addLabel(
                svg,
                (shape.x ?? 0) + (shape.w ?? 100) / 2,
                (shape.y ?? 0) + (shape.h ?? 60) / 2,
                shape.label
              );
            }
            break;
          case "circle":
            drawer.circle(shape.cx ?? 50, shape.cy ?? 50, (shape.r ?? 30) * 2, opts);
            if (shape.label) {
              this._addLabel(svg, shape.cx ?? 50, shape.cy ?? 50, shape.label);
            }
            break;
          case "ellipse":
            drawer.ellipse(
              shape.cx ?? 50,
              shape.cy ?? 50,
              (shape.rx ?? 50) * 2,
              (shape.ry ?? 30) * 2,
              opts
            );
            if (shape.label) {
              this._addLabel(svg, shape.cx ?? 50, shape.cy ?? 50, shape.label);
            }
            break;
          case "line":
            drawer.line(shape.x1 ?? 0, shape.y1 ?? 0, shape.x2 ?? 100, shape.y2 ?? 100, opts);
            if (shape.label) {
              this._addLabel(
                svg,
                ((shape.x1 ?? 0) + (shape.x2 ?? 100)) / 2,
                ((shape.y1 ?? 0) + (shape.y2 ?? 100)) / 2 - 10,
                shape.label
              );
            }
            break;
          case "arrow": {
            const ax1 = shape.x1 ?? 0, ay1 = shape.y1 ?? 0;
            const ax2 = shape.x2 ?? 100, ay2 = shape.y2 ?? 100;
            drawer.line(ax1, ay1, ax2, ay2, opts);
            this._drawArrowHead(svg, ax1, ay1, ax2, ay2, shape.stroke || "currentColor");
            if (shape.label) {
              this._addLabel(svg, (ax1 + ax2) / 2, (ay1 + ay2) / 2 - 12, shape.label);
            }
            break;
          }
          case "path":
            if (shape.d) {
              drawer.path(shape.d, opts);
            }
            break;
          default:
            break;
        }
      }
      this._loaded = true;
      if (!this._ro) {
        this._ro = new ResizeObserver(() => {
        });
        this._ro.observe(wrapper);
      }
    } catch (err) {
      errorDiv.textContent = `Sketch render failed: ${err.message}`;
      errorDiv.style.display = "block";
    }
  }
};
customElements.define("rk-sketch", RkSketch);

// packages/components/src/elements/rk-zdog.ts
var RkZdog = class extends HTMLElement {
  _raw = "";
  _illo = null;
  _raf = null;
  _Zdog = null;
  static get observedAttributes() {
    return ["width", "height", "rotate", "zoom", "title"];
  }
  connectedCallback() {
    this._raw = (this.textContent || "").trim();
    this._render();
  }
  disconnectedCallback() {
    this._cleanup();
  }
  attributeChangedCallback() {
    if (this._Zdog && this._raw) {
      this._cleanup();
      this._render();
    }
  }
  _cleanup() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this._illo = null;
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  _parseSpec() {
    if (!this._raw) return null;
    try {
      const data = JSON.parse(this._raw);
      if (!data || !Array.isArray(data.shapes)) return null;
      return data;
    } catch {
      return null;
    }
  }
  _toTranslate(t) {
    if (!t) return {};
    return {
      ...t.x !== void 0 ? { x: t.x } : {},
      ...t.y !== void 0 ? { y: t.y } : {},
      ...t.z !== void 0 ? { z: t.z } : {}
    };
  }
  _toRotate(r) {
    if (!r) return {};
    return {
      ...r.x !== void 0 ? { x: r.x * Math.PI / 180 } : {},
      ...r.y !== void 0 ? { y: r.y * Math.PI / 180 } : {},
      ...r.z !== void 0 ? { z: r.z * Math.PI / 180 } : {}
    };
  }
  _loadScript() {
    return new Promise((resolve, reject) => {
      if (window.Zdog) {
        resolve(window.Zdog);
        return;
      }
      const existing = document.querySelector("script[data-rk-zdog]");
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Zdog));
        existing.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/zdog@1/js/zdog.dist.min.js";
      script.setAttribute("data-rk-zdog", "");
      script.onload = () => resolve(window.Zdog);
      script.onerror = () => reject(new Error("Failed to load Zdog"));
      document.head.appendChild(script);
    });
  }
  async _render() {
    const width = parseInt(this.getAttribute("width") || "300", 10) || 300;
    const height = parseInt(this.getAttribute("height") || "300", 10) || 300;
    const rotate = this.hasAttribute("rotate");
    const zoom = parseFloat(this.getAttribute("zoom") || "1") || 1;
    const title = this.getAttribute("title") || "";
    const spec = this._parseSpec();
    if (!spec) {
      this.innerHTML = `<div class="rk-zdog"><div class="rk-zdog__error">Invalid JSON spec. Expected: {"shapes": [...]}</div></div>`;
      return;
    }
    const canvasId = `rk-zdog-canvas-${Math.random().toString(36).slice(2, 9)}`;
    const wrapper = document.createElement("div");
    wrapper.className = "rk-zdog";
    if (title) {
      const t = document.createElement("div");
      t.className = "rk-zdog__title";
      t.textContent = title;
      wrapper.appendChild(t);
    }
    const canvas = document.createElement("canvas");
    canvas.id = canvasId;
    canvas.width = width;
    canvas.height = height;
    canvas.className = "rk-zdog__canvas";
    wrapper.appendChild(canvas);
    this.innerHTML = "";
    this.appendChild(wrapper);
    try {
      const Z = await this._loadScript();
      this._Zdog = Z;
      const illo = new Z.Illustration({
        element: `#${canvasId}`,
        zoom,
        dragRotate: true,
        resize: false
      });
      this._illo = illo;
      for (const shape of spec.shapes) {
        const baseOpts = {
          addTo: illo,
          color: shape.color || "#636",
          ...Object.keys(this._toTranslate(shape.translate)).length > 0 ? { translate: this._toTranslate(shape.translate) } : {},
          ...Object.keys(this._toRotate(shape.rotate)).length > 0 ? { rotate: this._toRotate(shape.rotate) } : {}
        };
        switch (shape.type) {
          case "box":
            new Z.Box({
              ...baseOpts,
              width: shape.width ?? 80,
              height: shape.height ?? 80,
              depth: shape.depth ?? 80,
              topFace: shape.topFace,
              bottomFace: shape.bottomFace,
              leftFace: shape.leftFace,
              rightFace: shape.rightFace,
              frontFace: shape.frontFace,
              rearFace: shape.rearFace
            });
            break;
          case "sphere":
            new Z.Sphere({
              ...baseOpts,
              diameter: shape.diameter ?? 80
            });
            break;
          case "cylinder":
            new Z.Cylinder({
              ...baseOpts,
              diameter: shape.diameter ?? 40,
              length: shape.length ?? 60
            });
            break;
          case "cone":
            new Z.Cone({
              ...baseOpts,
              diameter: shape.diameter ?? 40,
              length: shape.length ?? 60
            });
            break;
          case "rect":
            new Z.Rect({
              ...baseOpts,
              width: shape.width ?? 80,
              height: shape.height ?? 80
            });
            break;
          case "ellipse":
            new Z.Ellipse({
              ...baseOpts,
              diameter: shape.diameter ?? 80
            });
            break;
          case "polygon":
            new Z.Polygon({
              ...baseOpts,
              sides: shape.sides ?? 6,
              radius: shape.radius ?? 40
            });
            break;
          default:
            break;
        }
      }
      const animate = () => {
        if (rotate) {
          illo.rotateGraph();
        }
        illo.updateRenderGraph();
        this._raf = requestAnimationFrame(animate);
      };
      animate();
    } catch (err) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "rk-zdog__error";
      errorDiv.textContent = `Zdog render failed: ${err.message}`;
      wrapper.appendChild(errorDiv);
    }
  }
};
customElements.define("rk-zdog", RkZdog);

// packages/components/src/elements/rk-model.ts
var RkModel = class extends HTMLElement {
  _uid = Math.random().toString(36).slice(2, 9);
  static get observedAttributes() {
    return ["src", "poster", "title", "height", "ar", "auto-rotate", "camera-controls", "shadow-intensity", "exposure"];
  }
  connectedCallback() {
    this._render();
  }
  disconnectedCallback() {
  }
  attributeChangedCallback() {
    this._render();
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  async _injectModelViewer() {
    if (window.customElements.get("model-viewer")) return;
    if (document.querySelector("script[data-rk-model-viewer]")) {
      return new Promise((resolve) => {
        const check = () => {
          if (window.customElements.get("model-viewer")) resolve();
          else setTimeout(check, 100);
        };
        check();
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
      script.setAttribute("data-rk-model-viewer", "");
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("model-viewer CDN load failed"));
      document.head.appendChild(script);
    });
  }
  async _render() {
    const src = this.getAttribute("src") || "";
    const poster = this.getAttribute("poster") || "";
    const title = this.getAttribute("title") || "";
    const height = this.getAttribute("height") || "400";
    const ar = this.hasAttribute("ar");
    const autoRotate = this.hasAttribute("auto-rotate");
    const cameraControls = this.hasAttribute("camera-controls");
    const shadowIntensity = this.getAttribute("shadow-intensity") || "1";
    const exposure = this.getAttribute("exposure") || "";
    if (!src) {
      this.innerHTML = `
        <div class="rk-model">
          <div class="rk-model__error">Missing <code>src</code> attribute. Provide a path to a GLTF/GLB file.</div>
        </div>`;
      return;
    }
    const mvAttrs = [
      `src="${this._escape(src)}"`,
      `style="width:100%;height:${height}px"`,
      `shadow-intensity="${shadowIntensity}"`
    ];
    if (poster) mvAttrs.push(`poster="${this._escape(poster)}"`);
    if (ar) mvAttrs.push("ar");
    if (autoRotate) mvAttrs.push("auto-rotate");
    if (cameraControls) mvAttrs.push("camera-controls");
    if (exposure) mvAttrs.push(`exposure="${exposure}"`);
    mvAttrs.push('loading="lazy"');
    const containerId = `rk-model-${this._uid}`;
    this.innerHTML = `
      <div class="rk-model">
        ${title ? `<div class="rk-model__title">${this._escape(title)}</div>` : ""}
        <div class="rk-model__container" id="${containerId}">
          <div class="rk-model__loading">Loading 3D model viewer\u2026</div>
        </div>
      </div>`;
    try {
      await this._injectModelViewer();
      const container = this.querySelector(`#${containerId}`);
      if (!container) return;
      container.innerHTML = `<model-viewer ${mvAttrs.join(" ")}></model-viewer>`;
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-model__error">Failed to load model-viewer: ${err.message}</div>`;
      }
    }
  }
};
customElements.define("rk-model", RkModel);

// packages/components/src/elements/rk-globe.ts
var RkGlobe = class extends HTMLElement {
  _globe = null;
  _raw = "";
  _uid = Math.random().toString(36).slice(2, 9);
  _ro = null;
  static get observedAttributes() {
    return ["height", "title", "auto-rotate"];
  }
  connectedCallback() {
    this._raw = (this.textContent || "").trim();
    this._render();
  }
  disconnectedCallback() {
    this._cleanup();
  }
  attributeChangedCallback() {
    this._cleanup();
    this._render();
  }
  _cleanup() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._globe) {
      try {
        this._globe._destructor();
      } catch {
      }
      this._globe = null;
    }
  }
  _parsePoints() {
    if (!this._raw) return [];
    try {
      const data = JSON.parse(this._raw);
      if (!Array.isArray(data)) return [];
      return data.filter(
        (p) => typeof p === "object" && p !== null && typeof p.lat === "number" && typeof p.lng === "number"
      );
    } catch {
      return [];
    }
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  async _loadGlobeLib() {
    if (window.Globe) return window.Globe;
    if (document.querySelector("script[data-rk-globe]")) {
      return new Promise((resolve, reject) => {
        const check = () => {
          if (window.Globe) resolve(window.Globe);
          else setTimeout(check, 100);
        };
        setTimeout(() => reject(new Error("Globe.gl load timeout")), 15e3);
        check();
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/globe.gl@2.31.0/dist/globe.gl.min.js";
      script.setAttribute("data-rk-globe", "");
      script.onload = () => {
        if (window.Globe) resolve(window.Globe);
        else reject(new Error("Globe.gl global not found after load"));
      };
      script.onerror = () => reject(new Error("Globe.gl CDN load failed"));
      document.head.appendChild(script);
    });
  }
  async _render() {
    const height = parseInt(this.getAttribute("height") || "500", 10) || 500;
    const title = this.getAttribute("title") || "";
    const autoRotate = this.hasAttribute("auto-rotate");
    const points = this._parsePoints();
    const containerId = `rk-globe-${this._uid}`;
    this.innerHTML = `
      <div class="rk-globe">
        ${title ? `<div class="rk-globe__title">${this._escape(title)}</div>` : ""}
        <div class="rk-globe__container" id="${containerId}" style="height:${height}px;width:100%;"></div>
        ${points.length > 0 ? `<div class="rk-globe__info">${points.length} point${points.length > 1 ? "s" : ""}</div>` : ""}
      </div>`;
    try {
      const Globe = await this._loadGlobeLib();
      const container = this.querySelector(`#${containerId}`);
      if (!container) return;
      const globe = Globe(container).globeImageUrl("https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg").backgroundColor("rgba(0,0,0,0)").atmosphereColor("#6366f1").atmosphereAltitude(0.15).width(container.clientWidth || 600).height(height);
      if (points.length > 0) {
        globe.pointsData(points).pointLat((d) => d.lat).pointLng((d) => d.lng).pointAltitude((d) => d.size || 0.5).pointRadius((d) => (d.size || 0.5) * 0.6).pointColor((d) => d.color || "#6366f1").pointLabel((d) => d.label || `${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}`);
      }
      if (autoRotate) {
        const controls = globe.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
      }
      this._globe = globe;
      this._ro = new ResizeObserver(() => {
        if (this._globe && container) {
          try {
            this._globe.width(container.clientWidth || 600).height(height);
          } catch {
          }
        }
      });
      this._ro.observe(container);
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-globe__error">Globe load failed: ${err.message}</div>`;
      }
    }
  }
};
customElements.define("rk-globe", RkGlobe);

// packages/components/src/elements/rk-narrative.ts
var RkNarrative = class extends HTMLElement {
  _raw = "";
  static get observedAttributes() {
    return ["title"];
  }
  connectedCallback() {
    this._raw = this.textContent?.trim() || "";
    this._render();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _render() {
    const title = this.getAttribute("title") || "";
    let phrases;
    try {
      phrases = JSON.parse(this._raw).phrases;
      if (!Array.isArray(phrases)) throw new Error("phrases must be an array");
    } catch (e) {
      this.innerHTML = `<div class="rk-narrative"><div class="rk-narrative__error">Invalid JSON: ${this._esc(e.message)}</div></div>`;
      return;
    }
    const titleHtml = title ? `<div class="rk-narrative__title">${this._esc(title)}</div>` : "";
    const body = phrases.map((p) => this._renderPhrase(p)).join("");
    this.innerHTML = /* html */
    `
      <div class="rk-narrative">
        ${titleHtml}
        <div class="rk-narrative__body">${body}</div>
      </div>
    `;
  }
  _renderPhrase(p) {
    if ("text" in p) {
      return this._esc(p.text);
    }
    if ("value" in p) {
      const v = p;
      const arrow = v.trend === "up" ? "\u2191" : v.trend === "down" ? "\u2193" : v.trend === "flat" ? "\u2192" : "";
      const colorCls = v.color ? ` rk-narrative__value--${v.color}` : "";
      const deltaHtml = v.delta ? `<span class="rk-narrative__delta${v.trend === "up" ? " rk-narrative__delta--up" : v.trend === "down" ? " rk-narrative__delta--down" : ""}">${this._esc(v.delta)}</span>` : "";
      const arrowHtml = arrow ? `<span class="rk-narrative__arrow${v.trend === "up" ? " rk-narrative__arrow--up" : v.trend === "down" ? " rk-narrative__arrow--down" : ""}">${arrow}</span>` : "";
      return `<span class="rk-narrative__value${colorCls}">${arrowHtml}${this._esc(v.value)}</span>${deltaHtml}`;
    }
    if ("sparkline" in p) {
      const s = p;
      return this._renderSparkline(s.sparkline, s.color || "accent", s.height || 20);
    }
    if ("bar" in p) {
      const b = p;
      const pct = Math.min(100, Math.max(0, b.bar / b.max * 100));
      const colorCls = b.color ? ` rk-narrative__minibar--${b.color}` : "";
      return `<span class="rk-narrative__minibar${colorCls}"><span class="rk-narrative__minibar-fill" style="width:${pct}%"></span></span>`;
    }
    if ("badge" in p) {
      const bd = p;
      const colorCls = bd.color ? ` rk-narrative__badge--${bd.color}` : "";
      return `<span class="rk-narrative__badge${colorCls}">${this._esc(bd.badge)}</span>`;
    }
    return "";
  }
  _renderSparkline(data, color, height) {
    if (!data || data.length < 2) return "";
    const width = 60;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2;
    const h = height - pad * 2;
    const points = data.map((v, i) => {
      const x = i / (data.length - 1) * width;
      const y = pad + h - (v - min) / range * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const colorVar = color === "accent" ? "var(--rk-accent)" : `var(--rk-tone-${color}-border, var(--rk-accent))`;
    return `<span class="rk-narrative__sparkline"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><polyline points="${points}" fill="none" stroke="${colorVar}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  }
  _esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
};
customElements.define("rk-narrative", RkNarrative);

// packages/components/src/elements/rk-plot3d.ts
var RkPlot3d = class extends HTMLElement {
  _raw = "";
  _plotly = null;
  _container = null;
  _ro = null;
  static get observedAttributes() {
    return ["title", "height", "caption"];
  }
  connectedCallback() {
    this._raw = (this.textContent || "").trim();
    this._render();
  }
  disconnectedCallback() {
    this._cleanup();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _cleanup() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._container && this._plotly) {
      try {
        this._plotly.purge(this._container);
      } catch {
      }
    }
    this._plotly = null;
    this._container = null;
  }
  async _render() {
    this._cleanup();
    const title = this.getAttribute("title") || "";
    const height = parseInt(this.getAttribute("height") || "450", 10);
    const caption = this.getAttribute("caption") || "";
    let spec;
    try {
      spec = JSON.parse(this._raw);
    } catch (e) {
      this.innerHTML = `<div class="rk-plot3d"><div class="rk-plot3d__error">Invalid JSON: ${e.message}</div></div>`;
      return;
    }
    if (!spec.data || !Array.isArray(spec.data) || spec.data.length === 0) {
      this.innerHTML = `<div class="rk-plot3d"><div class="rk-plot3d__error">Plotly spec requires a "data" array.</div></div>`;
      return;
    }
    const container = document.createElement("div");
    container.className = "rk-plot3d__chart";
    container.style.width = "100%";
    container.style.height = height + "px";
    const wrapper = document.createElement("div");
    wrapper.className = "rk-plot3d";
    if (title) {
      const h = document.createElement("div");
      h.className = "rk-plot3d__title";
      h.textContent = title;
      wrapper.appendChild(h);
    }
    wrapper.appendChild(container);
    if (caption) {
      const c = document.createElement("div");
      c.className = "rk-plot3d__caption";
      c.textContent = caption;
      wrapper.appendChild(c);
    }
    this.innerHTML = "";
    this.appendChild(wrapper);
    this._container = container;
    try {
      this._plotly = await this._loadPlotly();
    } catch {
      this.innerHTML = `<div class="rk-plot3d"><div class="rk-plot3d__error">Failed to load Plotly.js from CDN.</div></div>`;
      return;
    }
    const textColor = getComputedStyle(this).getPropertyValue("--rk-text").trim() || "#333";
    const defaultLayout = {
      margin: { t: title ? 40 : 10, r: 10, b: 40, l: 10 },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: textColor },
      ...spec.layout || {}
    };
    const defaultConfig = {
      responsive: true,
      displayModeBar: false,
      ...spec.config || {}
    };
    try {
      await this._plotly.newPlot(container, spec.data, defaultLayout, defaultConfig);
    } catch (e) {
      container.innerHTML = `<div class="rk-plot3d__error">Plotly render error: ${e.message}</div>`;
    }
    this._ro = new ResizeObserver(() => {
      if (this._plotly && this._container) {
        try {
          this._plotly.relayout(this._container, {
            width: this._container.offsetWidth
          });
        } catch {
        }
      }
    });
    this._ro.observe(container);
  }
  _loadPlotly() {
    const win = window;
    if (win.Plotly) return Promise.resolve(win.Plotly);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-rk-plotly]");
      if (existing) {
        const check = () => {
          if (win.Plotly) resolve(win.Plotly);
          else reject(new Error("Plotly load timeout"));
        };
        existing.addEventListener("load", check);
        existing.addEventListener("error", () => reject(new Error("Plotly script error")));
        if (win.Plotly) {
          resolve(win.Plotly);
          return;
        }
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2/plotly.min.js";
      script.setAttribute("data-rk-plotly", "1");
      script.onload = () => {
        if (win.Plotly) resolve(win.Plotly);
        else reject(new Error("Plotly global not found after load"));
      };
      script.onerror = () => reject(new Error("Failed to fetch Plotly CDN"));
      document.head.appendChild(script);
    });
  }
};
customElements.define("rk-plot3d", RkPlot3d);

// packages/components/src/elements/rk-graph3d.ts
var GROUP_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4"
];
var RkGraph3d = class extends HTMLElement {
  _raw = "";
  _graph = null;
  _ro = null;
  static get observedAttributes() {
    return ["title", "height", "dag"];
  }
  connectedCallback() {
    this._raw = (this.textContent || "").trim();
    this._render();
  }
  disconnectedCallback() {
    this._cleanup();
  }
  attributeChangedCallback() {
    if (this._raw) this._render();
  }
  _cleanup() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._graph) {
      try {
        this._graph._destructor();
      } catch {
      }
      this._graph = null;
    }
  }
  async _render() {
    this._cleanup();
    const title = this.getAttribute("title") || "";
    const height = parseInt(this.getAttribute("height") || "500", 10);
    const dagAttr = this.getAttribute("dag");
    let data;
    try {
      data = JSON.parse(this._raw);
    } catch (e) {
      this.innerHTML = `<div class="rk-graph3d"><div class="rk-graph3d__error">Invalid JSON: ${e.message}</div></div>`;
      return;
    }
    if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      this.innerHTML = `<div class="rk-graph3d"><div class="rk-graph3d__error">Graph spec requires "nodes" array.</div></div>`;
      return;
    }
    if (!data.links) data.links = [];
    const container = document.createElement("div");
    container.className = "rk-graph3d__canvas";
    container.style.width = "100%";
    container.style.height = height + "px";
    const wrapper = document.createElement("div");
    wrapper.className = "rk-graph3d";
    if (title) {
      const h = document.createElement("div");
      h.className = "rk-graph3d__title";
      h.textContent = title;
      wrapper.appendChild(h);
    }
    wrapper.appendChild(container);
    this.innerHTML = "";
    this.appendChild(wrapper);
    let FG;
    try {
      FG = await this._loadLib();
    } catch {
      this.innerHTML = `<div class="rk-graph3d"><div class="rk-graph3d__error">Failed to load 3d-force-graph from CDN.</div></div>`;
      return;
    }
    try {
      const graph = FG()(container).graphData(data).nodeLabel((n) => n.label || n.id).linkLabel((l) => l.label || `${l.source} \u2192 ${l.target}`).nodeColor(
        (n) => n.color || GROUP_COLORS[(n.group || 0) % GROUP_COLORS.length]
      ).nodeVal((n) => n.size || n.val || 1).linkColor(() => "rgba(255,255,255,0.2)").linkWidth(1).linkDirectionalArrowLength(3.5).linkDirectionalArrowRelPos(1).backgroundColor("transparent").width(container.offsetWidth).height(container.offsetHeight).cooldownTicks(200);
      if (dagAttr !== null) {
        graph.dagMode("td").dagLevelDistance(50);
      }
      this._graph = graph;
      this._ro = new ResizeObserver(() => {
        if (this._graph) {
          try {
            this._graph.width(container.offsetWidth).height(container.offsetHeight);
          } catch {
          }
        }
      });
      this._ro.observe(container);
    } catch (e) {
      container.innerHTML = `<div class="rk-graph3d__error">Graph render error: ${e.message}</div>`;
    }
  }
  _loadLib() {
    const win = window;
    if (win.ForceGraph3D) return Promise.resolve(win.ForceGraph3D);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-rk-graph3d]");
      if (existing) {
        const check = () => {
          if (win.ForceGraph3D) resolve(win.ForceGraph3D);
          else reject(new Error("3d-force-graph load timeout"));
        };
        existing.addEventListener("load", check);
        existing.addEventListener("error", () => reject(new Error("3d-force-graph script error")));
        if (win.ForceGraph3D) {
          resolve(win.ForceGraph3D);
          return;
        }
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/3d-force-graph@1/dist/3d-force-graph.min.js";
      script.setAttribute("data-rk-graph3d", "1");
      script.onload = () => {
        if (win.ForceGraph3D) resolve(win.ForceGraph3D);
        else reject(new Error("ForceGraph3D global not found after load"));
      };
      script.onerror = () => reject(new Error("Failed to fetch 3d-force-graph CDN"));
      document.head.appendChild(script);
    });
  }
};
customElements.define("rk-graph3d", RkGraph3d);

// packages/components/src/elements/rk-graph.ts
var ACCENT_PALETTE = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4"
];
var RkGraph = class extends HTMLElement {
  _cy = null;
  _raw = "";
  _uid = Math.random().toString(36).slice(2, 9);
  static get observedAttributes() {
    return ["title", "height", "layout"];
  }
  connectedCallback() {
    this._raw = (this.textContent || "").trim();
    this._render();
  }
  disconnectedCallback() {
    if (this._cy) {
      this._cy.destroy();
      this._cy = null;
    }
  }
  attributeChangedCallback() {
    if (this._cy) {
      this._cy.destroy();
      this._cy = null;
    }
    this._render();
  }
  _parseData() {
    if (!this._raw) return null;
    try {
      const data = JSON.parse(this._raw);
      if (!data || !Array.isArray(data.nodes)) return null;
      return data;
    } catch {
      return null;
    }
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  async _render() {
    const height = parseInt(this.getAttribute("height") || "400", 10) || 400;
    const title = this.getAttribute("title") || "";
    const layoutName = this.getAttribute("layout") || "cose";
    const data = this._parseData();
    const containerId = `rk-graph-${this._uid}`;
    if (!data) {
      this.innerHTML = `<div class="rk-graph"><div class="rk-graph__error">Invalid JSON. Expected: {"nodes": [...], "edges": [...]}</div></div>`;
      return;
    }
    this.innerHTML = `
      <div class="rk-graph">
        ${title ? `<div class="rk-graph__title">${this._escape(title)}</div>` : ""}
        <div class="rk-graph__container" id="${containerId}" style="height:${height}px;width:100%;"></div>
        <div class="rk-graph__info">${data.nodes.length} nodes, ${data.edges.length} edges</div>
      </div>`;
    try {
      const cytoscape = await import(
        /* @vite-ignore */
        "https://cdn.jsdelivr.net/npm/cytoscape@3/dist/cytoscape.esm.min.js"
      );
      const container = this.querySelector(`#${containerId}`);
      if (!container) return;
      const groups = [...new Set(data.nodes.map((n) => n.group || "default"))];
      const groupColor = (group) => {
        const idx = groups.indexOf(group);
        return ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
      };
      const elements = [
        ...data.nodes.map((n) => ({
          data: {
            id: n.id,
            label: n.label || n.id,
            group: n.group || "default",
            color: groupColor(n.group || "default")
          }
        })),
        ...data.edges.map((e, i) => ({
          data: {
            id: `e${i}`,
            source: e.source,
            target: e.target,
            label: e.label || ""
          }
        }))
      ];
      const cy = cytoscape.default({
        container,
        elements,
        style: [
          {
            selector: "node",
            style: {
              "label": "data(label)",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "11px",
              "color": "var(--rk-text, #1e293b)",
              "background-color": "data(color)",
              "border-width": 1,
              "border-color": "var(--rk-border, #e2e8f0)",
              "width": 60,
              "height": 30,
              "shape": "round-rectangle",
              "text-wrap": "ellipsis",
              "text-max-width": "56px",
              "font-family": "system-ui, sans-serif"
            }
          },
          {
            selector: "edge",
            style: {
              "width": 1.5,
              "line-color": "var(--rk-border, #94a3b8)",
              "target-arrow-color": "var(--rk-border, #94a3b8)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              "label": "data(label)",
              "font-size": "9px",
              "text-rotation": "autorotate",
              "text-outline-width": 2,
              "text-outline-color": "var(--rk-bg, #ffffff)",
              "color": "var(--rk-muted, #64748b)",
              "font-family": "system-ui, sans-serif"
            }
          }
        ],
        layout: {
          name: layoutName,
          animate: false,
          fit: true,
          padding: 30
        }
      });
      this._cy = cy;
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-graph__error">Graph load failed: ${err.message}</div>`;
      }
    }
  }
};
customElements.define("rk-graph", RkGraph);

// packages/components/src/elements/rk-flow.ts
var NODE_DEFAULTS = { width: 120, height: 40 };
var NODE_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4"
];
var RkFlow = class extends HTMLElement {
  _graph = null;
  _raw = "";
  _uid = Math.random().toString(36).slice(2, 9);
  _scriptLoaded = false;
  static get observedAttributes() {
    return ["title", "height", "readonly"];
  }
  connectedCallback() {
    this._raw = (this.textContent || "").trim();
    this._render();
  }
  disconnectedCallback() {
    if (this._graph) {
      this._graph.dispose();
      this._graph = null;
    }
  }
  attributeChangedCallback() {
    if (this._graph) {
      this._graph.dispose();
      this._graph = null;
    }
    this._render();
  }
  _parseData() {
    if (!this._raw) return null;
    try {
      const data = JSON.parse(this._raw);
      if (!data || !Array.isArray(data.nodes)) return null;
      return data;
    } catch {
      return null;
    }
  }
  _escape(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  _loadScript() {
    return new Promise((resolve, reject) => {
      if (window.X6) {
        resolve();
        return;
      }
      const existing = document.querySelector("script[data-rk-x6]");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("X6 CDN load failed")));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@antv/x6@2/dist/x6.js";
      script.setAttribute("data-rk-x6", "");
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("X6 CDN load failed"));
      document.head.appendChild(script);
    });
  }
  async _render() {
    const height = parseInt(this.getAttribute("height") || "350", 10) || 350;
    const title = this.getAttribute("title") || "";
    const readonly = this.hasAttribute("readonly") || !this.hasAttribute("readonly") && true;
    const interactive = !this.hasAttribute("readonly") || true;
    const data = this._parseData();
    const containerId = `rk-flow-${this._uid}`;
    if (!data) {
      this.innerHTML = `<div class="rk-flow"><div class="rk-flow__error">Invalid JSON. Expected: {"nodes": [...], "edges": [...]}</div></div>`;
      return;
    }
    this.innerHTML = `
      <div class="rk-flow">
        ${title ? `<div class="rk-flow__title">${this._escape(title)}</div>` : ""}
        <div class="rk-flow__container" id="${containerId}" style="height:${height}px;width:100%;"></div>
        <div class="rk-flow__info">${data.nodes.length} nodes, ${data.edges.length} edges</div>
      </div>`;
    try {
      await this._loadScript();
      const X6 = window.X6;
      const container = this.querySelector(`#${containerId}`);
      if (!container) return;
      const positionedNodes = data.nodes.map((n, i) => {
        if (n.x !== void 0 && n.y !== void 0) return n;
        const col = i % 4;
        const row = Math.floor(i / 4);
        return { ...n, x: 40 + col * 180, y: 40 + row * 80 };
      });
      const nodeColors = {};
      positionedNodes.forEach((n, i) => {
        nodeColors[n.id] = n.color || NODE_COLORS[i % NODE_COLORS.length];
      });
      const graph = new X6.Graph({
        container,
        width: container.clientWidth,
        height,
        autoResize: true,
        background: { transparent: true },
        grid: false,
        panning: { enabled: true },
        mousewheel: { enabled: true, modifiers: [] },
        interacting: { nodeMovable: false },
        connecting: {
          anchor: "center",
          connectionPoint: "anchor",
          allowBlank: false,
          snap: true,
          createEdge() {
            return null;
          }
        }
      });
      for (const n of positionedNodes) {
        const color = nodeColors[n.id];
        const w = n.width || NODE_DEFAULTS.width;
        const h = n.height || NODE_DEFAULTS.height;
        graph.addNode({
          id: n.id,
          x: n.x,
          y: n.y,
          width: w,
          height: h,
          shape: "rect",
          attrs: {
            body: {
              fill: color,
              stroke: color,
              strokeWidth: 1,
              rx: 6,
              ry: 6
            },
            label: {
              text: n.label || n.id,
              fill: "#ffffff",
              fontSize: 12,
              fontFamily: "system-ui, sans-serif"
            }
          }
        });
      }
      for (const e of data.edges) {
        graph.addEdge({
          source: e.source,
          target: e.target,
          attrs: {
            line: {
              stroke: "var(--rk-border, #94a3b8)",
              strokeWidth: 1.5,
              targetMarker: { name: "block", width: 8, height: 6 }
            }
          },
          router: { name: "normal" },
          connector: { name: "rounded" },
          labels: e.label ? [
            {
              attrs: {
                label: {
                  text: e.label,
                  fill: "var(--rk-muted, #64748b)",
                  fontSize: 10,
                  fontFamily: "system-ui, sans-serif"
                },
                rect: {
                  fill: "var(--rk-bg, #ffffff)",
                  stroke: "var(--rk-border, #e2e8f0)",
                  strokeWidth: 0.5,
                  rx: 3,
                  ry: 3
                }
              }
            }
          ] : []
        });
      }
      graph.centerContent();
      this._graph = graph;
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-flow__error">Flow load failed: ${err.message}</div>`;
      }
    }
  }
};
customElements.define("rk-flow", RkFlow);
