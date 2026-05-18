// ─── rk-globe — 3D globe visualization (Globe.gl CDN) ─────────────

interface GlobePoint {
  lat: number;
  lng: number;
  size?: number;
  color?: string;
  label?: string;
}

interface GlobeInstance {
  (container: HTMLElement): GlobeAPI;
}

interface GlobeAPI {
  globeImageUrl: (url: string) => GlobeAPI;
  pointsData: (data: GlobePoint[]) => GlobeAPI;
  pointLat: (fn: (d: GlobePoint) => number) => GlobeAPI;
  pointLng: (fn: (d: GlobePoint) => number) => GlobeAPI;
  pointAltitude: (fn: (d: GlobePoint) => number) => GlobeAPI;
  pointRadius: (fn: (d: GlobePoint) => number) => GlobeAPI;
  pointColor: (fn: (d: GlobePoint) => string) => GlobeAPI;
  pointLabel: (fn: (d: GlobePoint) => string) => GlobeAPI;
  backgroundColor: (color: string) => GlobeAPI;
  atmosphereColor: (color: string) => GlobeAPI;
  atmosphereAltitude: (val: number) => GlobeAPI;
  width: (w: number) => GlobeAPI;
  height: (h: number) => GlobeAPI;
  controls: () => { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean };
  _destructor: () => void;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
}

class RkGlobe extends HTMLElement {
  private _globe: GlobeAPI | null = null;
  private _raw = '';
  private _uid = Math.random().toString(36).slice(2, 9);
  private _ro: ResizeObserver | null = null;

  static get observedAttributes() {
    return ['height', 'title', 'auto-rotate'];
  }

  connectedCallback(): void {
    this._raw = (this.textContent || '').trim();
    this._render();
  }

  disconnectedCallback(): void {
    this._cleanup();
  }

  attributeChangedCallback(): void {
    this._cleanup();
    this._render();
  }

  private _cleanup(): void {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._globe) {
      try { this._globe._destructor(); } catch { /* ignore */ }
      this._globe = null;
    }
  }

  private _parsePoints(): GlobePoint[] {
    if (!this._raw) return [];
    try {
      const data = JSON.parse(this._raw);
      if (!Array.isArray(data)) return [];
      return data.filter(
        (p: unknown) =>
          typeof p === 'object' &&
          p !== null &&
          typeof (p as GlobePoint).lat === 'number' &&
          typeof (p as GlobePoint).lng === 'number',
      ) as GlobePoint[];
    } catch {
      return [];
    }
  }

  private _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  private async _loadGlobeLib(): Promise<GlobeInstance> {
    if ((window as any).Globe) return (window as any).Globe as GlobeInstance;
    if (document.querySelector('script[data-rk-globe]')) {
      return new Promise<GlobeInstance>((resolve, reject) => {
        const check = () => {
          if ((window as any).Globe) resolve((window as any).Globe);
          else setTimeout(check, 100);
          // timeout after 15s
        };
        setTimeout(() => reject(new Error('Globe.gl load timeout')), 15000);
        check();
      });
    }
    return new Promise<GlobeInstance>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/globe.gl@2.31.0/dist/globe.gl.min.js';
      script.setAttribute('data-rk-globe', '');
      script.onload = () => {
        if ((window as any).Globe) resolve((window as any).Globe);
        else reject(new Error('Globe.gl global not found after load'));
      };
      script.onerror = () => reject(new Error('Globe.gl CDN load failed'));
      document.head.appendChild(script);
    });
  }

  private async _render(): Promise<void> {
    const height = parseInt(this.getAttribute('height') || '500', 10) || 500;
    const title = this.getAttribute('title') || '';
    const autoRotate = this.hasAttribute('auto-rotate');
    const points = this._parsePoints();

    const containerId = `rk-globe-${this._uid}`;
    this.innerHTML = `
      <div class="rk-globe">
        ${title ? `<div class="rk-globe__title">${this._escape(title)}</div>` : ''}
        <div class="rk-globe__container" id="${containerId}" style="height:${height}px;width:100%;"></div>
        ${points.length > 0 ? `<div class="rk-globe__info">${points.length} point${points.length > 1 ? 's' : ''}</div>` : ''}
      </div>`;

    try {
      const Globe = await this._loadGlobeLib();
      const container = this.querySelector(`#${containerId}`) as HTMLElement;
      if (!container) return;

      const globe = Globe(container)
        .globeImageUrl('https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg')
        .backgroundColor('rgba(0,0,0,0)')
        .atmosphereColor('#6366f1')
        .atmosphereAltitude(0.15)
        .width(container.clientWidth || 600)
        .height(height);

      if (points.length > 0) {
        globe
          .pointsData(points)
          .pointLat((d: GlobePoint) => d.lat)
          .pointLng((d: GlobePoint) => d.lng)
          .pointAltitude((d: GlobePoint) => d.size || 0.5)
          .pointRadius((d: GlobePoint) => (d.size || 0.5) * 0.6)
          .pointColor((d: GlobePoint) => d.color || '#6366f1')
          .pointLabel((d: GlobePoint) => d.label || `${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}`);
      }

      if (autoRotate) {
        const controls = globe.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
      }

      this._globe = globe;

      // ResizeObserver for responsive
      this._ro = new ResizeObserver(() => {
        if (this._globe && container) {
          try {
            this._globe.width(container.clientWidth || 600).height(height);
          } catch { /* ignore resize errors */ }
        }
      });
      this._ro.observe(container);
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-globe__error">Globe load failed: ${(err as Error).message}</div>`;
      }
    }
  }
}

customElements.define('rk-globe', RkGlobe);
export { RkGlobe };
