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
  controls?: () => { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean } | undefined;
  _destructor: () => void;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
}

class RkGlobe extends HTMLElement {
  private _globe: GlobeAPI | null = null;
  private _raw = '';
  private _rawCaptured = false;
  private _uid = Math.random().toString(36).slice(2, 9);

  private _renderSeq = 0;

  static get observedAttributes() {
    return ['height', 'title', 'auto-rotate'];
  }

  
connectedCallback(): void {
    if (this._rawCaptured) {
      this._render();
      return;
    }
    window.setTimeout(() => {
      if (!this.isConnected || this._rawCaptured) return;
      this._raw = (this.textContent || '').trim();
      this._rawCaptured = true;
      this._render();
    }, 0);
  }

  disconnectedCallback(): void {
    this._renderSeq++;
    this._cleanup();
  }

  attributeChangedCallback(): void {
    if (!this.isConnected || !this._rawCaptured) return;
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

  private _drawCanvasGlobe(container: HTMLElement, points: GlobePoint[], height: number): HTMLCanvasElement | null {
    const width = Math.max(container.clientWidth || 600, 320);
    const canvas = document.createElement('canvas');
    canvas.className = 'rk-globe__canvas';
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.38;
    const grd = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    grd.addColorStop(0, 'rgba(147,197,253,0.95)');
    grd.addColorStop(0.6, 'rgba(59,130,246,0.42)');
    grd.addColorStop(1, 'rgba(30,41,59,0.18)');

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(148,163,184,0.22)';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * (0.25 + Math.abs(i) * 0.16), r, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy + (i * r) / 3, r, r * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const p of points) {
      const lat = (p.lat * Math.PI) / 180;
      const lng = (p.lng * Math.PI) / 180;
      const x = cx + r * Math.cos(lat) * Math.sin(lng);
      const y = cy - r * Math.sin(lat);
      const pr = Math.max(3, (p.size || 0.8) * 4);
      ctx.fillStyle = p.color || '#6366f1';
      ctx.beginPath();
      ctx.arc(x, y, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    return canvas;
  }

  private async _loadGlobeLib(): Promise<GlobeInstance> {

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
    const seq = ++this._renderSeq;
    this._cleanup();

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
      if (seq !== this._renderSeq) return;

      const container = this.querySelector(`#${containerId}`) as HTMLElement;
      if (!container) return;

      const fallbackCanvas = this._drawCanvasGlobe(container, points, height);

      const globe = Globe(container)
        .globeImageUrl('https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg')
        .backgroundColor('rgba(0,0,0,0)')

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
        const controls = globe.controls?.();
        if (controls) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.5;
          controls.enableZoom = true;
        }
      }

      this._globe = globe;
      requestAnimationFrame(() => {
        const canvases = Array.from(container.querySelectorAll('canvas'));
        if (fallbackCanvas && canvases.length > 1) fallbackCanvas.remove();
      });

      // ResizeObserver for responsive
      this._ro = new ResizeObserver(() => {
        if (seq !== this._renderSeq) return;
        if (this._globe && container) {
          try {
            this._globe.width(container.clientWidth || 600).height(height);
            const fallback = container.querySelector('.rk-globe__canvas') as HTMLCanvasElement | null;
            if (fallback && container.querySelectorAll('canvas').length === 1) {
              fallback.remove();
              this._drawCanvasGlobe(container, points, height);
            }
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

