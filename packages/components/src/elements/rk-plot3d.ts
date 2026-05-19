// ─── rk-plot3d — Plotly.js 3D visualization (CDN lazy-loaded) ─────

interface PlotlyModule {
  newPlot(
    container: HTMLElement,
    data: Record<string, unknown>[],
    layout: Record<string, unknown>,
    config: Record<string, unknown>,
  ): Promise<void>;
  relayout(container: HTMLElement, update: Record<string, unknown>): void;
  purge(container: HTMLElement): void;
}

class RkPlot3d extends HTMLElement {
  private _raw = '';
  private _plotly: PlotlyModule | null = null;
  private _container: HTMLDivElement | null = null;
  private _ro: ResizeObserver | null = null;
  private _renderSeq = 0;

  static get observedAttributes() {
    return ['title', 'height', 'caption'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = (this.textContent || '').trim();
    this._render();
  }

  disconnectedCallback(): void {
    this._renderSeq++;
    this._cleanup();
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
    if (this._raw) this._render();
  }

  private _cleanup(): void {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._container && this._plotly) {
      try {
        this._plotly.purge(this._container);
      } catch {
        /* best-effort */
      }
    }
    this._plotly = null;
    this._container = null;
  }

  private async _render(): Promise<void> {
    const seq = ++this._renderSeq;
    this._cleanup();

    const title = this.getAttribute('title') || '';
    const height = parseInt(this.getAttribute('height') || '450', 10);
    const caption = this.getAttribute('caption') || '';

    let spec: { data: Record<string, unknown>[]; layout?: Record<string, unknown>; config?: Record<string, unknown> };
    try {
      spec = JSON.parse(this._raw);
    } catch (e) {
      this.innerHTML = `<div class="rk-plot3d"><div class="rk-plot3d__error">Invalid JSON: ${(e as Error).message}</div></div>`;
      return;
    }

    if (!spec.data || !Array.isArray(spec.data) || spec.data.length === 0) {
      this.innerHTML = `<div class="rk-plot3d"><div class="rk-plot3d__error">Plotly spec requires a "data" array.</div></div>`;
      return;
    }

    const container = document.createElement('div');
    container.className = 'rk-plot3d__chart';
    container.style.width = '100%';
    container.style.height = height + 'px';

    const wrapper = document.createElement('div');
    wrapper.className = 'rk-plot3d';
    if (title) {
      const h = document.createElement('div');
      h.className = 'rk-plot3d__title';
      h.textContent = title;
      wrapper.appendChild(h);
    }
    wrapper.appendChild(container);
    if (caption) {
      const c = document.createElement('div');
      c.className = 'rk-plot3d__caption';
      c.textContent = caption;
      wrapper.appendChild(c);
    }
    this.innerHTML = '';
    this.appendChild(wrapper);
    this._container = container;

    // Lazy-load Plotly CDN
    try {
      this._plotly = await this._loadPlotly();
      if (seq !== this._renderSeq) return;
    } catch {
      this.innerHTML = `<div class="rk-plot3d"><div class="rk-plot3d__error">Failed to load Plotly.js from CDN.</div></div>`;
      return;
    }

    // Resolve text color from CSS variable
    const textColor =
      getComputedStyle(this).getPropertyValue('--rk-text').trim() || '#333';

    const defaultLayout: Record<string, unknown> = {
      margin: { t: title ? 40 : 10, r: 10, b: 40, l: 10 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: textColor },
      ...(spec.layout || {}),
    };

    const defaultConfig: Record<string, unknown> = {
      responsive: true,
      displayModeBar: false,
      ...(spec.config || {}),
    };

    try {
      await this._plotly.newPlot(container, spec.data, defaultLayout, defaultConfig);
      if (seq !== this._renderSeq) return;
    } catch (e) {
      container.innerHTML = `<div class="rk-plot3d__error">Plotly render error: ${(e as Error).message}</div>`;
    }

    // Resize observer
    this._ro = new ResizeObserver(() => {
      if (seq !== this._renderSeq) return;
      if (this._plotly && this._container) {
        try {
          this._plotly.relayout(this._container, {
            width: this._container.offsetWidth,
          });
        } catch {
          /* best-effort */
        }
      }
    });
    this._ro.observe(container);
  }

  private _loadPlotly(): Promise<PlotlyModule> {
    const win = window as unknown as { Plotly?: PlotlyModule };
    if (win.Plotly) return Promise.resolve(win.Plotly);
    return new Promise<PlotlyModule>((resolve, reject) => {
      const existing = document.querySelector('script[data-rk-plotly]');
      if (existing) {
        const check = () => {
          if (win.Plotly) resolve(win.Plotly);
          else reject(new Error('Plotly load timeout'));
        };
        existing.addEventListener('load', check);
        existing.addEventListener('error', () => reject(new Error('Plotly script error')));
        // Already loaded?
        if (win.Plotly) { resolve(win.Plotly); return; }
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.3/plotly.min.js';
      script.setAttribute('data-rk-plotly', '1');
      script.onload = () => {
        if (win.Plotly) resolve(win.Plotly);
        else reject(new Error('Plotly global not found after load'));
      };
      script.onerror = () => reject(new Error('Failed to fetch Plotly CDN'));
      document.head.appendChild(script);
    });
  }
}

customElements.define('rk-plot3d', RkPlot3d);
export { RkPlot3d };
