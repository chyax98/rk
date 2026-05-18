// ─── rk-zdog — Pseudo-3D illustration via Zdog CDN ──────────────

interface ZdogIllustration {
  rotateGraph: () => void;
  updateRenderGraph: () => void;
  destroy: () => void;
}

interface ZdogShape {
  type: string;
  // common
  color?: string;
  translate?: { x?: number; y?: number; z?: number };
  rotate?: { x?: number; y?: number; z?: number };
  // box
  width?: number; height?: number; depth?: number;
  topFace?: string; bottomFace?: string;
  leftFace?: string; rightFace?: string;
  frontFace?: string; rearFace?: string;
  // sphere
  diameter?: number;
  // cylinder / cone
  length?: number;
  // rect
  // uses width, height
  // ellipse
  // uses diameter
  // polygon
  sides?: number; radius?: number;
}

type ZdogConstructor = {
  Illustration: new (opts: Record<string, unknown>) => ZdogIllustration;
  Box: new (opts: Record<string, unknown>) => unknown;
  Sphere: new (opts: Record<string, unknown>) => unknown;
  Cylinder: new (opts: Record<string, unknown>) => unknown;
  Cone: new (opts: Record<string, unknown>) => unknown;
  Rect: new (opts: Record<string, unknown>) => unknown;
  Ellipse: new (opts: Record<string, unknown>) => unknown;
  Polygon: new (opts: Record<string, unknown>) => unknown;
  Shape: new (opts: Record<string, unknown>) => unknown;
  Anchor: new (opts: Record<string, unknown>) => unknown;
  TAU: number;
};

class RkZdog extends HTMLElement {
  _raw = '';
  _illo: ZdogIllustration | null = null;
  _raf: number | null = null;
  _Zdog: ZdogConstructor | null = null;

  static get observedAttributes() {
    return ['width', 'height', 'rotate', 'zoom', 'title'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = (this.textContent || '').trim();
    this._render();
  }

  disconnectedCallback(): void {
    this._cleanup();
  }

  attributeChangedCallback(): void {
    if (this._Zdog && this._raw) {
      this._cleanup();
      this._render();
    }
  }

  _cleanup(): void {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this._illo = null;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  _parseSpec(): { shapes: ZdogShape[] } | null {
    if (!this._raw) return null;
    try {
      const data = JSON.parse(this._raw);
      if (!data || !Array.isArray(data.shapes)) return null;
      return data;
    } catch {
      return null;
    }
  }

  _toTranslate(t?: { x?: number; y?: number; z?: number }): Record<string, number> {
    if (!t) return {};
    return {
      ...(t.x !== undefined ? { x: t.x } : {}),
      ...(t.y !== undefined ? { y: t.y } : {}),
      ...(t.z !== undefined ? { z: t.z } : {}),
    };
  }

  _toRotate(r?: { x?: number; y?: number; z?: number }): Record<string, number> {
    if (!r) return {};
    return {
      ...(r.x !== undefined ? { x: (r.x * Math.PI) / 180 } : {}),
      ...(r.y !== undefined ? { y: (r.y * Math.PI) / 180 } : {}),
      ...(r.z !== undefined ? { z: (r.z * Math.PI) / 180 } : {}),
    };
  }

  _loadScript(): Promise<ZdogConstructor> {
    return new Promise((resolve, reject) => {
      if ((window as any).Zdog) {
        resolve((window as any).Zdog);
        return;
      }
      // Check if script already loading
      const existing = document.querySelector('script[data-rk-zdog]');
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any).Zdog));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/zdog@1/js/zdog.dist.min.js';
      script.setAttribute('data-rk-zdog', '');
      script.onload = () => resolve((window as any).Zdog);
      script.onerror = () => reject(new Error('Failed to load Zdog'));
      document.head.appendChild(script);
    });
  }

  async _render(): Promise<void> {
    const width = parseInt(this.getAttribute('width') || '300', 10) || 300;
    const height = parseInt(this.getAttribute('height') || '300', 10) || 300;
    const rotate = this.hasAttribute('rotate');
    const zoom = parseFloat(this.getAttribute('zoom') || '1') || 1;
    const title = this.getAttribute('title') || '';
    const spec = this._parseSpec();

    if (!spec) {
      this.innerHTML = `<div class="rk-zdog"><div class="rk-zdog__error">Invalid JSON spec. Expected: {"shapes": [...]}</div></div>`;
      return;
    }

    const canvasId = `rk-zdog-canvas-${Math.random().toString(36).slice(2, 9)}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'rk-zdog';
    if (title) {
      const t = document.createElement('div');
      t.className = 'rk-zdog__title';
      t.textContent = title;
      wrapper.appendChild(t);
    }

    const canvas = document.createElement('canvas');
    canvas.id = canvasId;
    canvas.width = width;
    canvas.height = height;
    canvas.className = 'rk-zdog__canvas';
    wrapper.appendChild(canvas);

    this.innerHTML = '';
    this.appendChild(wrapper);

    try {
      const Z = await this._loadScript();
      this._Zdog = Z;

      const illo = new Z.Illustration({
        element: `#${canvasId}`,
        zoom,
        dragRotate: true,
        resize: false,
      }) as ZdogIllustration;

      this._illo = illo;

      // Build shapes
      for (const shape of spec.shapes) {
        const baseOpts: Record<string, unknown> = {
          addTo: illo,
          color: shape.color || '#636',
          ...(Object.keys(this._toTranslate(shape.translate)).length > 0
            ? { translate: this._toTranslate(shape.translate) }
            : {}),
          ...(Object.keys(this._toRotate(shape.rotate)).length > 0
            ? { rotate: this._toRotate(shape.rotate) }
            : {}),
        };

        switch (shape.type) {
          case 'box':
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
              rearFace: shape.rearFace,
            });
            break;

          case 'sphere':
            new Z.Sphere({
              ...baseOpts,
              diameter: shape.diameter ?? 80,
            });
            break;

          case 'cylinder':
            new Z.Cylinder({
              ...baseOpts,
              diameter: shape.diameter ?? 40,
              length: shape.length ?? 60,
            });
            break;

          case 'cone':
            new Z.Cone({
              ...baseOpts,
              diameter: shape.diameter ?? 40,
              length: shape.length ?? 60,
            });
            break;

          case 'rect':
            new Z.Rect({
              ...baseOpts,
              width: shape.width ?? 80,
              height: shape.height ?? 80,
            });
            break;

          case 'ellipse':
            new Z.Ellipse({
              ...baseOpts,
              diameter: shape.diameter ?? 80,
            });
            break;

          case 'polygon':
            new Z.Polygon({
              ...baseOpts,
              sides: shape.sides ?? 6,
              radius: shape.radius ?? 40,
            });
            break;

          default:
            break;
        }
      }

      // Animate
      const animate = () => {
        if (rotate) {
          illo.rotateGraph();
        }
        illo.updateRenderGraph();
        this._raf = requestAnimationFrame(animate);
      };
      animate();
    } catch (err) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'rk-zdog__error';
      errorDiv.textContent = `Zdog render failed: ${(err as Error).message}`;
      wrapper.appendChild(errorDiv);
    }
  }
}

customElements.define('rk-zdog', RkZdog);
export { RkZdog };
