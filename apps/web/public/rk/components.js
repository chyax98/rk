(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

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
      return ["tone", "title"];
    }
    connectedCallback() {
      this._raw = this.innerHTML;
      this._render();
    }
    attributeChangedCallback() {
      if (this._raw) this._render();
    }
    _render() {
      const tone = this.getAttribute("tone") || "info";
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
    async _renderEcharts(type, title, caption) {
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
        const seriesType = type === "scatter" ? "scatter" : type === "pie" ? "pie" : type === "area" ? "line" : type;
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
      }
    }
    async _renderD2() {
      const canvas = this.querySelector(".rk-diagram__canvas");
      const loading = this.querySelector(".rk-diagram__loading");
      if (!canvas || !this._raw) return;
      try {
        const mod = await import("https://cdn.jsdelivr.net/npm/@terrastruct/d2@0.1.33/dist/browser/index.js");
        const Renderer = mod.Renderer || mod.default || mod.D2 || mod;
        const renderer = new Renderer();
        const svg = await renderer.render(this._raw);
        if (loading) loading.remove();
        canvas.innerHTML = typeof svg === "string" ? svg : svg?.svg || svg?.toString() || "";
        this._makeSvgResponsive(canvas);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (loading) loading.textContent = `D2 \u6E32\u67D3\u5931\u8D25: ${message}`;
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
      }
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
})();
