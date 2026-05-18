// ─── rk-sketch — Hand-drawn SVG diagrams via Rough.js CDN ────────

interface RoughSVG {
  circle: (x: number, y: number, d: number, opts?: RoughOpts) => SVGGElement;
  ellipse: (x: number, y: number, w: number, h: number, opts?: RoughOpts) => SVGGElement;
  line: (x1: number, y1: number, x2: number, y2: number, opts?: RoughOpts) => SVGGElement;
  rectangle: (x: number, y: number, w: number, h: number, opts?: RoughOpts) => SVGGElement;
  path: (d: string, opts?: RoughOpts) => SVGGElement;
}

interface RoughOpts {
  roughness?: number;
  bowing?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  fillStyle?: string;
  fillWeight?: number;
  hachureAngle?: number;
  hachureGap?: number;
}

interface SketchShape {
  type: string;
  // rect
  x?: number; y?: number; w?: number; h?: number;
  // circle
  cx?: number; cy?: number; r?: number;
  // ellipse
  rx?: number; ry?: number;
  // line / arrow
  x1?: number; y1?: number; x2?: number; y2?: number;
  // path
  d?: string;
  // common
  label?: string;
  fill?: string;
  stroke?: string;
  roughness?: number;
  strokeWidth?: number;
  fillStyle?: string;
}

class RkSketch extends HTMLElement {
  _raw = '';
  _ro: ResizeObserver | null = null;
  _loaded = false;

  static get observedAttributes() {
    return ['width', 'height', 'roughness', 'title'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = (this.textContent || '').trim();
    this._render();
  }

  disconnectedCallback(): void {
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
    if (this._loaded || this._raw) this._render();
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  _parseSpec(): { shapes: SketchShape[] } | null {
    if (!this._raw) return null;
    try {
      const data = JSON.parse(this._raw);
      if (!data || !Array.isArray(data.shapes)) return null;
      return data;
    } catch {
      return null;
    }
  }

  _makeOpts(shape: SketchShape, globalRoughness: number): RoughOpts {
    return {
      roughness: shape.roughness ?? globalRoughness,
      stroke: shape.stroke || 'currentColor',
      strokeWidth: shape.strokeWidth ?? 1.5,
      fill: shape.fill || undefined,
      fillStyle: shape.fillStyle || (shape.fill ? 'hachure' : undefined),
    };
  }

  _drawArrowHead(svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, color: string): void {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 10;
    const x3 = x2 - size * Math.cos(angle - Math.PI / 6);
    const y3 = y2 - size * Math.sin(angle - Math.PI / 6);
    const x4 = x2 - size * Math.cos(angle + Math.PI / 6);
    const y4 = y2 - size * Math.sin(angle + Math.PI / 6);
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    head.setAttribute('points', `${x2},${y2} ${x3},${y3} ${x4},${y4}`);
    head.setAttribute('fill', color);
    head.setAttribute('stroke', color);
    svg.appendChild(head);
  }

  _addLabel(svg: SVGSVGElement, x: number, y: number, text: string): void {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.setAttribute('x', String(x));
    el.setAttribute('y', String(y));
    el.setAttribute('text-anchor', 'middle');
    el.setAttribute('dominant-baseline', 'central');
    el.setAttribute('font-size', '13');
    el.setAttribute('font-family', 'inherit');
    el.setAttribute('fill', 'currentColor');
    el.textContent = text;
    svg.appendChild(el);
  }

  async _render(): Promise<void> {
    const width = parseInt(this.getAttribute('width') || '500', 10) || 500;
    const height = parseInt(this.getAttribute('height') || '300', 10) || 300;
    const roughness = parseFloat(this.getAttribute('roughness') || '1.5') || 1.5;
    const title = this.getAttribute('title') || '';
    const spec = this._parseSpec();

    if (!spec) {
      this.innerHTML = `<div class="rk-sketch"><div class="rk-sketch__error">Invalid JSON spec. Expected: {"shapes": [...]}</div></div>`;
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'rk-sketch';
    if (title) {
      const t = document.createElement('div');
      t.className = 'rk-sketch__title';
      t.textContent = title;
      wrapper.appendChild(t);
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'rk-sketch__svg');
    wrapper.appendChild(svg);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'rk-sketch__error';
    errorDiv.style.display = 'none';
    wrapper.appendChild(errorDiv);

    this.innerHTML = '';
    this.appendChild(wrapper);

    try {
      // Lazy load Rough.js ESM
      const rough = (await import(
        /* @vite-ignore */
        'https://cdn.jsdelivr.net/npm/roughjs@4/bundled/rough.esm.js'
      )) as unknown as { default: { svg: (el: SVGSVGElement) => RoughSVG } };

      const rc = (rough.default || rough) as { svg: (el: SVGSVGElement) => RoughSVG };
      const drawer = rc.svg(svg);

      for (const shape of spec.shapes) {
        const opts = this._makeOpts(shape, roughness);

        switch (shape.type) {
          case 'rect':
            drawer.rectangle(shape.x ?? 0, shape.y ?? 0, shape.w ?? 100, shape.h ?? 60, opts);
            if (shape.label) {
              this._addLabel(svg,
                (shape.x ?? 0) + (shape.w ?? 100) / 2,
                (shape.y ?? 0) + (shape.h ?? 60) / 2,
                shape.label);
            }
            break;

          case 'circle':
            drawer.circle(shape.cx ?? 50, shape.cy ?? 50, (shape.r ?? 30) * 2, opts);
            if (shape.label) {
              this._addLabel(svg, shape.cx ?? 50, shape.cy ?? 50, shape.label);
            }
            break;

          case 'ellipse':
            drawer.ellipse(
              shape.cx ?? 50, shape.cy ?? 50,
              (shape.rx ?? 50) * 2, (shape.ry ?? 30) * 2, opts);
            if (shape.label) {
              this._addLabel(svg, shape.cx ?? 50, shape.cy ?? 50, shape.label);
            }
            break;

          case 'line':
            drawer.line(shape.x1 ?? 0, shape.y1 ?? 0, shape.x2 ?? 100, shape.y2 ?? 100, opts);
            if (shape.label) {
              this._addLabel(svg,
                ((shape.x1 ?? 0) + (shape.x2 ?? 100)) / 2,
                ((shape.y1 ?? 0) + (shape.y2 ?? 100)) / 2 - 10,
                shape.label);
            }
            break;

          case 'arrow': {
            const ax1 = shape.x1 ?? 0, ay1 = shape.y1 ?? 0;
            const ax2 = shape.x2 ?? 100, ay2 = shape.y2 ?? 100;
            drawer.line(ax1, ay1, ax2, ay2, opts);
            this._drawArrowHead(svg, ax1, ay1, ax2, ay2, shape.stroke || 'currentColor');
            if (shape.label) {
              this._addLabel(svg, (ax1 + ax2) / 2, (ay1 + ay2) / 2 - 12, shape.label);
            }
            break;
          }

          case 'path':
            if (shape.d) {
              drawer.path(shape.d, opts);
            }
            break;

          default:
            break;
        }
      }

      this._loaded = true;

      // ResizeObserver
      if (!this._ro) {
        this._ro = new ResizeObserver(() => {
          // rough.js SVG uses fixed viewBox, no re-render needed
        });
        this._ro.observe(wrapper);
      }
    } catch (err) {
      errorDiv.textContent = `Sketch render failed: ${(err as Error).message}`;
      errorDiv.style.display = 'block';
    }
  }
}

customElements.define('rk-sketch', RkSketch);
export { RkSketch };
