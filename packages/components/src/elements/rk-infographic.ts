// ─── rk-infographic ──────────────────────────────────────────────
// Renders AntV Infographic syntax to SVG in the browser.
// CDN: @antv/infographic → window.AntVInfographic

type InfographicInstance = {
  render: (syntax: string) => void;
  destroy?: () => void;
};

type AntVInfographicLib = {
  Infographic: new (opts: {
    container: HTMLElement;
    width?: string | number;
    height?: string | number;
    editable?: boolean;
    theme?: string;
  }) => InfographicInstance;
  getThemes?: () => string[];
  VERSION?: string;
};

declare global {
  interface Window {
    AntVInfographic?: AntVInfographicLib;
  }
}

let _libLoaded: Promise<AntVInfographicLib> | null = null;

function loadLib(): Promise<AntVInfographicLib> {
  if (_libLoaded) return _libLoaded;
  _libLoaded = new Promise<AntVInfographicLib>((resolve, reject) => {
    if (window.AntVInfographic) {
      resolve(window.AntVInfographic);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@antv/infographic@0.2.19/dist/infographic.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      if (window.AntVInfographic) {
        resolve(window.AntVInfographic);
      } else {
        reject(new Error('AntVInfographic not found after script load'));
      }
    };
    s.onerror = () => reject(new Error('Failed to load @antv/infographic from CDN'));
    document.head.appendChild(s);
  });
  return _libLoaded;
}

class RkInfographic extends HTMLElement {
  _raw = '';
  _instance: InfographicInstance | null = null;
  _ro: ResizeObserver | null = null;

  static get observedAttributes() {
    return ['title', 'height', 'theme'] as string[];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.textContent || '';
    this._render();
  }

  disconnectedCallback(): void {
    this._cleanup();
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
    if (this._raw) this._render();
  }

  _cleanup(): void {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._instance) {
      this._instance.destroy?.();
      this._instance = null;
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

  async _render(): Promise<void> {
    const title = this.getAttribute('title') || '';
    const height = this.getAttribute('height') || '400';
    const theme = this.getAttribute('theme') || '';
    const syntax = this._raw.trim();
    const uid = this._uid();

    if (!syntax) {
      this.innerHTML = `<div class="rk-infographic"><p style="color:var(--rk-muted)">No infographic syntax provided.</p></div>`;
      return;
    }

    // Build shell
    this.innerHTML = /* html */ `
      <div class="rk-infographic">
        ${title ? `<div class="rk-infographic__title">${this._escape(title)}</div>` : ''}
        <div class="rk-infographic__canvas" id="infographic-${uid}"></div>
      </div>
    `;

    const container = this.querySelector(`#infographic-${uid}`) as HTMLElement;
    if (!container) return;
    container.style.height = `${parseInt(height, 10) || 400}px`;

    try {
      const lib = await loadLib();

      // Cleanup previous instance
      this._cleanup();

      const opts: Record<string, unknown> = {
        container,
        width: '100%',
        height: parseInt(height, 10) || 400,
        editable: false,
      };

      if (theme) {
        opts.theme = theme;
      }

      this._instance = new lib.Infographic(opts as ConstructorParameters<typeof lib.Infographic>[0]);
      this._instance.render(syntax);

      // ResizeObserver for responsive sizing
      this._ro = new ResizeObserver(() => {
        // Re-render is expensive; Infographic handles internal resize
        // via width: '100%' so we just need to trigger a re-layout
        const svg = container.querySelector('svg');
        if (svg) {
          svg.setAttribute('width', '100%');
        }
      });
      this._ro.observe(container);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      container.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm)">Infographic load failed: ${this._escape(message)}</div>`;
    }
  }
}

customElements.define('rk-infographic', RkInfographic);

export { RkInfographic };
