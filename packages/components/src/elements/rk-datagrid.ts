// ─── rk-datagrid ────────────────────────────────────────────────
// AG Grid Community integration – enterprise data table
// Loads AG Grid + theme CSS from CDN at runtime.

interface AgGridApi {
  destroy: () => void;
}

interface AgGridModule {
  createGrid: (
    el: HTMLElement,
    options: Record<string, unknown>,
  ) => { api: AgGridApi };
}

class RkDatagrid extends HTMLElement {
  _raw = '';
  _gridApi: AgGridApi | null = null;
  _resizeObserver: ResizeObserver | null = null;

  static get observedAttributes() {
    return ['title', 'height', 'theme', 'pagination', 'page-size'];
  }

  connectedCallback(): void {
    this._raw = this.textContent?.trim() || '';
    this._render();
  }

  disconnectedCallback(): void {
    this._destroy();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _destroy(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._gridApi) {
      this._gridApi.destroy();
      this._gridApi = null;
    }
  }

  async _render(): Promise<void> {
    const title = this.getAttribute('title') || '';
    const height = parseInt(this.getAttribute('height') || '400', 10);
    const rawTheme = this.getAttribute('theme') || 'alpine';
    const pagination = this.hasAttribute('pagination');
    const pageSize = parseInt(this.getAttribute('page-size') || '20', 10);

    // Parse JSON data
    let columnDefs: Record<string, unknown>[] = [];
    let rowData: Record<string, unknown>[] = [];

    try {
      const json = JSON.parse(this._raw) as {
        columns?: Record<string, unknown>[];
        rows?: Record<string, unknown>[];
      };
      columnDefs = json.columns || [];
      rowData = json.rows || [];
    } catch {
      this.innerHTML = /* html */ `
        <div class="rk-datagrid">
          ${title ? `<div class="rk-datagrid__title">${this._esc(title)}</div>` : ''}
          <div class="rk-datagrid__error">
            <p style="color:var(--rk-muted)">Invalid JSON. Expected: {"columns": [...], "rows": [...]}</p>
          </div>
        </div>
      `;
      return;
    }

    if (columnDefs.length === 0) {
      this.innerHTML = /* html */ `
        <div class="rk-datagrid">
          ${title ? `<div class="rk-datagrid__title">${this._esc(title)}</div>` : ''}
          <div class="rk-datagrid__empty">
            <p style="color:var(--rk-muted)">No columns defined</p>
          </div>
        </div>
      `;
      return;
    }

    // Determine theme — auto-detect dark from CSS var
    let theme = rawTheme;
    if (theme === 'alpine') {
      try {
        const bg = getComputedStyle(this).getPropertyValue('--rk-bg').trim();
        if (bg && this._isDarkColor(bg)) {
          theme = 'alpine-dark';
        }
      } catch {
        /* keep alpine */
      }
    }

    // Build DOM
    this.innerHTML = /* html */ `
      <div class="rk-datagrid">
        ${title ? `<div class="rk-datagrid__title">${this._esc(title)}</div>` : ''}
        <div class="rk-datagrid__container" style="height:${height}px"></div>
      </div>
    `;

    const container = this.querySelector('.rk-datagrid__container') as HTMLElement;
    if (!container) return;

    // Apply AG Grid theme class
    const themeClass = `ag-theme-${theme}`;
    container.classList.add(themeClass);

    try {
      // Load AG Grid CSS + theme CSS
      await this._loadStylesheet(
        'https://cdn.jsdelivr.net/npm/ag-grid-community@32/styles/ag-grid.css',
      );
      await this._loadStylesheet(
        `https://cdn.jsdelivr.net/npm/ag-grid-community@32/styles/ag-theme-${theme}.css`,
      );

      // Load AG Grid JS
      const agGrid = await this._loadAgGrid();

      // Auto-add defaultColDef for sortable/filter if columns don't specify
      const gridOptions: Record<string, unknown> = {
        columnDefs,
        rowData,
        animateRows: true,
        defaultColDef: {
          sortable: true,
          filter: true,
          resizable: true,
        },
      };

      if (pagination) {
        gridOptions.pagination = true;
        gridOptions.paginationPageSize = pageSize;
      }

      const { api } = agGrid.createGrid(container, gridOptions);
      this._gridApi = api;

      // Resize observer for container size changes
      this._resizeObserver = new ResizeObserver(() => {
        // AG Grid auto-resizes with container, but notify just in case
        if (this._gridApi) {
          // Force layout recalculation by dispatching resize event
          window.dispatchEvent(new Event('resize'));
        }
      });
      this._resizeObserver.observe(container);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = /* html */ `
        <div style="padding:var(--rk-space-3,12px);color:var(--rk-tone-danger-border,#e53e3e);font-size:var(--rk-text-sm,14px)">
          AG Grid load failed: ${this._esc(message)}
        </div>
      `;
    }
  }

  /** Load AG Grid from CDN as ESM */
  _loadAgGrid(): Promise<AgGridModule> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as Record<string, unknown>).agGrid) {
        resolve((window as Record<string, unknown>).agGrid as AgGridModule);
        return;
      }

      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/ag-grid-community@32/dist/ag-grid-community.min.js';
      script.onload = () => {
        if ((window as Record<string, unknown>).agGrid) {
          resolve((window as Record<string, unknown>).agGrid as AgGridModule);
        } else {
          reject(new Error('agGrid not found on window after script load'));
        }
      };
      script.onerror = () =>
        reject(new Error('Failed to load AG Grid script from CDN'));
      document.head.appendChild(script);
    });
  }

  /** Inject a stylesheet link if not already present */
  _loadStylesheet(url: string): Promise<void> {
    // Check if already loaded
    const existing = document.querySelector(
      `link[rel="stylesheet"][href="${url}"]`,
    );
    if (existing) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
      document.head.appendChild(link);
    });
  }

  /** Rough check if a CSS color value is "dark" */
  _isDarkColor(color: string): boolean {
    const el = document.createElement('div');
    el.style.color = color;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);

    // Parse rgb(r, g, b)
    const match = computed.match(/(\d+)/g);
    if (!match || match.length < 3) return false;
    const [r, g, b] = match.map(Number);
    // Luminance formula
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum < 0.5;
  }

  _esc(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-datagrid', RkDatagrid);

export { RkDatagrid };
