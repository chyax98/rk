// ─── rk-plot ────────────────────────────────────────────────────
// Observable Plot Web Component for statistical charts.
// Loads @observablehq/plot from CDN, renders declarative JSON spec.

interface PlotModule {
  plot: (options: Record<string, unknown>) => SVGSVGElement;
  [mark: string]: unknown;
}

class RkPlot extends HTMLElement {
  _raw = '';
  _ro: ResizeObserver | null = null;
  _plotEl: SVGSVGElement | null = null;

  static get observedAttributes() {
    return ['title', 'caption', 'height'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.textContent?.trim() || '';
    this._render();
  }

  disconnectedCallback(): void {
    this._ro?.disconnect();
    this._ro = null;
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  async _render(): Promise<void> {
    const title = this.getAttribute('title') || '';
    const caption = this.getAttribute('caption') || '';
    const height = parseInt(this.getAttribute('height') || '300', 10);

    // Build skeleton
    this.innerHTML = /* html */ `
      <div class="rk-plot">
        ${title ? `<div class="rk-plot__title">${this._esc(title)}</div>` : ''}
        <div class="rk-plot__canvas"></div>
        ${caption ? `<div class="rk-plot__caption">${this._esc(caption)}</div>` : ''}
      </div>
    `;

    const canvas = this.querySelector('.rk-plot__canvas') as HTMLElement;
    if (!canvas) return;

    // Parse JSON spec
    let spec: Record<string, unknown>;
    try {
      spec = JSON.parse(this._raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      canvas.innerHTML = `<div class="rk-plot__error">Invalid JSON: ${this._esc(msg)}</div>`;
      return;
    }

    // Load Observable Plot from CDN
    let Plot: PlotModule;
    try {
      Plot = await this._loadPlot();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      canvas.innerHTML = `<div class="rk-plot__error">Plot library load failed: ${this._esc(msg)}</div>`;
      return;
    }

    try {
      const svg = this._buildPlot(Plot, spec, canvas.offsetWidth || 600, height);
      canvas.innerHTML = '';
      canvas.appendChild(svg);
      this._plotEl = svg;

      // ResizeObserver
      this._ro?.disconnect();
      this._ro = new ResizeObserver(() => {
        const newWidth = canvas.offsetWidth || 600;
        try {
          const updated = this._buildPlot(Plot, spec, newWidth, height);
          canvas.innerHTML = '';
          canvas.appendChild(updated);
          this._plotEl = updated;
        } catch { /* ignore resize errors */ }
      });
      this._ro.observe(canvas);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      canvas.innerHTML = `<div class="rk-plot__error">Plot render error: ${this._esc(msg)}</div>`;
    }
  }

  _buildPlot(
    Plot: PlotModule,
    spec: Record<string, unknown>,
    width: number,
    height: number,
  ): SVGSVGElement {
    const { marks: rawMarks, ...plotOpts } = spec;

    // Build mark instances from spec
    const markInstances: unknown[] = [];
    if (Array.isArray(rawMarks)) {
      for (const m of rawMarks) {
        if (!m || typeof m !== 'object') continue;
        const { type, data, ...opts } = m as Record<string, unknown>;
        const markFn = Plot[type as string] as
          | ((data: unknown, opts: Record<string, unknown>) => unknown)
          | ((opts: Record<string, unknown>) => unknown);
        if (typeof markFn !== 'function') continue;

        // Map attribute names: Plot uses camelCase, spec allows snake_case
        const mappedOpts = this._mapOpts(opts as Record<string, unknown>);

        // Some marks take (data, opts), others take just (opts)
        // If data is provided, pass as first arg
        const mark = data !== undefined
          ? (markFn as (d: unknown, o: Record<string, unknown>) => unknown)(data, mappedOpts)
          : (markFn as (o: Record<string, unknown>) => unknown)(mappedOpts);
        markInstances.push(mark);
      }
    }

    // Read theme CSS vars
    const style = getComputedStyle(this);
    const accent = style.getPropertyValue('--rk-accent').trim() || '#4f46e5';
    const textColor = style.getPropertyValue('--rk-text').trim() || '#374151';

    const options: Record<string, unknown> = {
      width,
      height,
      ...plotOpts,
      marks: markInstances,
      style: {
        color: textColor,
        ...(plotOpts.style as Record<string, unknown> || {}),
      },
    };

    // Only set color if not already in spec
    if (!options.color) {
      options.color = { scheme: 'Tableau10' };
    }

    return Plot.plot(options) as SVGSVGElement;
  }

  /** Map snake_case opts to camelCase for Plot API */
  _mapOpts(opts: Record<string, unknown>): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(opts)) {
      // Convert snake_case to camelCase
      const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      mapped[camel] = v;
    }
    return mapped;
  }

  /** Lazy-load Observable Plot from CDN (ESM dynamic import) */
  async _loadPlot(): Promise<PlotModule> {
    const mod = await import(
      'https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6.17/+esm'
    );
    return mod as unknown as PlotModule;
  }

  _esc(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-plot', RkPlot);

export { RkPlot };
