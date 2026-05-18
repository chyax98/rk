// ─── rk-diagram ──────────────────────────────────────────────────
class RkDiagram extends HTMLElement {
  _raw = '';
  _observer: ResizeObserver | null = null;

  static get observedAttributes() {
    return ['title', 'caption', 'engine'];
  }

  connectedCallback(): void {
    this._raw = (this.textContent || '').trim();
    this._render();
  }

  disconnectedCallback(): void {
    this._observer?.disconnect();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const title = this.getAttribute('title') || '';
    const caption = this.getAttribute('caption') || '';
    const engine = this.getAttribute('engine') || 'mermaid';

    // !! Capture prerendered content BEFORE replacing innerHTML (Kroki SSR result)
    const existingPrerendered = this.querySelector('.rk-diagram__prerendered');
    const prerenderedHTML = existingPrerendered ? existingPrerendered.outerHTML : null;

    this.innerHTML = /* html */ `
      <div class="rk-diagram">
        ${title ? `<div class="rk-diagram__title" style="margin-bottom:var(--rk-space-3);color:var(--rk-text);font:var(--rk-type-label);letter-spacing:var(--rk-tracking-wide);text-transform:uppercase">${this._escape(title)}</div>` : ''}
        <div class="rk-diagram__loading">Loading diagram…</div>
        <div class="rk-diagram__canvas"></div>
        ${caption ? `<div class="rk-diagram__caption">${this._escape(caption)}</div>` : ''}
      </div>
    `;

    // For ALL engines: if server pre-rendered SVG existed, restore and display it
    if (prerenderedHTML) {
      const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
      if (loading) loading.style.display = 'none';
      const canvas = this.querySelector('.rk-diagram__canvas') as HTMLElement;
      if (canvas) canvas.innerHTML = prerenderedHTML;
      this._makeSvgResponsive(canvas);
      return;
    }

    if (engine === 'plantuml') {
      const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
      if (loading) {
        loading.innerHTML =
          '⚠️ PlantUML 图表需要服务端处理后查看。<br><small>在 server 启动状态下推送 artifact 即可自动渲染。</small>';
      }
      return;
    }

    if (engine === 'd2') {
      this._renderD2();
      return;
    }

    if (engine === 'graphviz' || engine === 'dot') {
      this._renderGraphviz();
      return;
    }

    // default: mermaid — pass theme context
    this._renderMermaid();
  }

  /** Detect if current theme is dark based on CSS var */
  _isDark(): boolean {
    const bg = getComputedStyle(this).getPropertyValue('--rk-bg').trim();
    if (!bg) return false;
    if (bg.startsWith('#')) {
      const hex = bg.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      return !Number.isNaN(r) && r < 80;
    }
    return bg.includes('0b1') || bg.includes('08090a') || bg.includes('161616');
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
  _getMermaidThemeVars(): Record<string, string> {
    const cs = getComputedStyle(this);

    // Helper: read --rk-* token with fallback
    const token = (name: string, fallback: string): string =>
      cs.getPropertyValue(name).trim() || fallback;

    // Resolve background — may be a gradient in glassmorphism theme
    let bgRaw = token('--rk-bg', '#ffffff');
    // If bg is a gradient, extract first solid color or use surface
    if (bgRaw.includes('gradient') || bgRaw.includes('(')) {
      bgRaw = token('--rk-surface-solid', token('--rk-surface', '#ffffff'));
    }
    // Strip any remaining quotes
    bgRaw = bgRaw.replace(/^["']|["']$/g, '');

    const text = token('--rk-text', '#1a1a1a');
    const textSec = token('--rk-text-secondary', '#3d3d3d');
    const muted = token('--rk-muted', '#737373');
    const accent = token('--rk-accent', '#0267a5');
    const border = token('--rk-border', '#dfe3ea');
    const surface = token('--rk-surface', '#ffffff');
    const surfaceR = token('--rk-surface-raised', surface);
    const fontFamily = token('--rk-font-sans', "'Inter', 'Noto Sans SC', sans-serif");

    // Build node fill: subtle accent tint (light theme = accent at ~10%, dark = accent at ~20%)
    const isDark = this._isDark();
    const nodeFill = isDark
      ? this._mixColors(accent, bgRaw, 0.18)
      : this._mixColors(accent, bgRaw, 0.1);
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
      nodeBorder: nodeBorder,
      nodeTextColor: text,

      // Notes
      noteBkgColor: this._mixColors(accent, bgRaw, 0.08),
      noteTextColor: text,
      noteBorderColor: this._mixColors(accent, bgRaw, 0.2),
    };
  }

  /**
   * Simple two-color mix at a given ratio (0-1).
   * Returns hex string. Used to derive Mermaid theme colors from --rk-* tokens.
   */
  _mixColors(color1: string, color2: string, ratio: number): string {
    const c1 = this._parseColor(color1);
    const c2 = this._parseColor(color2);
    if (!c1 || !c2) return color1;
    const r = Math.round(c1.r * ratio + c2.r * (1 - ratio));
    const g = Math.round(c1.g * ratio + c2.g * (1 - ratio));
    const b = Math.round(c1.b * ratio + c2.b * (1 - ratio));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /** Parse a CSS color string (#hex or rgb/rgba) to {r,g,b} */
  _parseColor(s: string): { r: number; g: number; b: number } | null {
    s = s.trim();
    // Hex
    const hex = s.match(/^#?([0-9a-f]{6})$/i);
    if (hex) {
      const v = parseInt(hex[1], 16);
      return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
    }
    // Short hex
    const shex = s.match(/^#?([0-9a-f]{3})$/i);
    if (shex) {
      const v = parseInt(shex[1], 16);
      const r = ((v >> 8) & 0xf) * 17;
      const g = ((v >> 4) & 0xf) * 17;
      const b = (v & 0xf) * 17;
      return { r, g, b };
    }
    // rgb/rgba
    const rgb = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgb) {
      return { r: parseInt(rgb[1], 10), g: parseInt(rgb[2], 10), b: parseInt(rgb[3], 10) };
    }
    return null;
  }

  async _renderMermaid(): Promise<void> {
    const canvas = this.querySelector('.rk-diagram__canvas') as HTMLElement;
    const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
    if (!canvas || !this._raw) return;

    try {
      const mermaid = await import(
        'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'
      );

      // Beautiful-mermaid style: CSS variable driven themeVariables
      const isDark = this._isDark();
      const themeVars = this._getMermaidThemeVars();

      mermaid.default.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        themeVariables: themeVars,
      });

      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      const { svg } = await mermaid.default.render(id, this._raw);

      if (loading) loading.remove();
      canvas.innerHTML = svg;
      this._makeSvgResponsive(canvas);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (loading) loading.remove();
      canvas.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm);white-space:pre-wrap">Mermaid error: ${this._escape(message)}</div>`;
    }
  }

  async _renderD2(): Promise<void> {
    const canvas = this.querySelector('.rk-diagram__canvas') as HTMLElement;
    const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
    if (!canvas || !this._raw) return;
    try {
      // @ts-expect-error
      const mod = await import(
        'https://cdn.jsdelivr.net/npm/@terrastruct/d2@0.1.33/dist/browser/index.js'
      );
      const Renderer = mod.Renderer || mod.default || mod.D2 || mod;
      const renderer = new Renderer();
      const svg = await renderer.render(this._raw);
      if (loading) loading.remove();
      canvas.innerHTML = typeof svg === 'string' ? svg : svg?.svg || svg?.toString() || '';
      this._makeSvgResponsive(canvas);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      if (loading) loading.textContent = `D2 渲染失败: ${message}`;
    }
  }

  async _renderGraphviz(): Promise<void> {
    const canvas = this.querySelector('.rk-diagram__canvas') as HTMLElement;
    const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
    if (!canvas || !this._raw) return;
    try {
      // Use @viz-js/viz (same as docu.md / markdown-viewer-extension)
      // viz-standalone.js is a UMD bundle: it sets globalThis.Viz, not named ES exports
      // @ts-expect-error
      await import('https://cdn.jsdelivr.net/npm/@viz-js/viz/lib/viz-standalone.js');
      // @ts-expect-error
      const vizGlobal = globalThis as typeof globalThis & {
        Viz?: {
          instance?: () => Promise<{
            renderSVGElement: (
              source: string,
              options?: { graphAttributes?: Record<string, string> },
            ) => SVGElement;
          }>;
        };
      };
      const instanceFn = vizGlobal.Viz?.instance;
      if (!instanceFn) throw new Error('Viz.js not loaded');
      const viz = await instanceFn();

      // Dark theme support: inject graph attributes before first '{'
      const isDark = this._isDark();
      let dotCode = this._raw;
      if (isDark) {
        const prelude =
          '  graph [fontcolor="#c9d1d9" bgcolor="transparent"];\n' +
          '  node [color="#8b949e" fontcolor="#c9d1d9"];\n' +
          '  edge [color="#8b949e" fontcolor="#c9d1d9"];\n';
        dotCode = dotCode.replace('{', `{\n${prelude}`);
      }

      const svgEl = viz.renderSVGElement(dotCode, {
        graphAttributes: { bgcolor: 'transparent' },
      });
      const svgString = new XMLSerializer().serializeToString(svgEl);

      if (loading) loading.remove();
      canvas.innerHTML = svgString;
      this._makeSvgResponsive(canvas);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      if (loading) loading.textContent = `Graphviz 渲染失败: ${message}`;
    }
  }

  _makeSvgResponsive(container: HTMLElement): void {
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
      svgEl.style.width = '100%';
      svgEl.style.maxWidth = '100%';
      svgEl.style.height = 'auto';
    }
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-diagram', RkDiagram);

export { RkDiagram };
