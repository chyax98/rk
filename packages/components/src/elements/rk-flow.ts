// ─── rk-flow — Flow / DAG diagram (@antv/x6 CDN) ───────────────

interface FlowNode {
  id: string;
  x?: number;
  y?: number;
  label?: string;
  shape?: string;
  width?: number;
  height?: number;
  color?: string;
}

interface FlowEdge {
  source: string;
  target: string;
  label?: string;
}

interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface X6Graph {
  fromJSON: (data: Record<string, unknown>) => void;
  dispose: () => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface X6Static {
  Graph: new (opts: Record<string, unknown>) => X6Graph;
  Shape: {
    Rect: { register: () => void };
  };
}

const NODE_DEFAULTS = { width: 120, height: 40 };
const NODE_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

class RkFlow extends HTMLElement {
  _graph: X6Graph | null = null;
  _raw = '';
  _uid = Math.random().toString(36).slice(2, 9);
  _scriptLoaded = false;

  static get observedAttributes() {
    return ['title', 'height', 'readonly'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = (this.textContent || '').trim();
    this._render();
  }

  disconnectedCallback(): void {
    if (this._graph) {
      this._graph.dispose();
      this._graph = null;
    }
  }

  attributeChangedCallback(): void {
    if (!this.isConnected || !this._raw) return;
    if (this._graph) {
      this._graph.dispose();
      this._graph = null;
    }
    this._render();
  }

  _parseData(): FlowData | null {
    if (!this._raw) return null;
    try {
      const data = JSON.parse(this._raw);
      if (!data || !Array.isArray(data.nodes)) return null;
      return data;
    } catch {
      return null;
    }
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  _loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as unknown as Record<string, unknown>).X6) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-rk-x6]');
      if (existing) {
        // Wait for existing script to load
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('X6 CDN load failed')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@antv/x6@2.18.1/dist/index.js';
      script.setAttribute('data-rk-x6', '');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('X6 CDN load failed'));
      document.head.appendChild(script);
    });
  }

  async _render(): Promise<void> {
    const height = parseInt(this.getAttribute('height') || '350', 10) || 350;
    const title = this.getAttribute('title') || '';
    const readonly = this.hasAttribute('readonly') || !this.hasAttribute('readonly') && true;
    // Default: panning enabled (interactive), readonly attr disables editing only
    const interactive = !this.hasAttribute('readonly') || true;
    const data = this._parseData();
    const containerId = `rk-flow-${this._uid}`;

    if (!data) {
      this.innerHTML = `<div class="rk-flow"><div class="rk-flow__error">Invalid JSON. Expected: {"nodes": [...], "edges": [...]}</div></div>`;
      return;
    }

    this.innerHTML = `
      <div class="rk-flow">
        ${title ? `<div class="rk-flow__title">${this._escape(title)}</div>` : ''}
        <div class="rk-flow__container" id="${containerId}" style="height:${height}px;width:100%;"></div>
        <div class="rk-flow__info">${data.nodes.length} nodes, ${data.edges.length} edges</div>
      </div>`;

    try {
      await this._loadScript();

      const X6 = (window as unknown as { X6: X6Static }).X6;
      const container = this.querySelector(`#${containerId}`) as HTMLElement;
      if (!container) return;

      // Auto-layout: assign positions if nodes don't have x/y
      const positionedNodes = data.nodes.map((n, i) => {
        if (n.x !== undefined && n.y !== undefined) return n;
        // Simple left-to-right layout, wrap at 4 per row
        const col = i % 4;
        const row = Math.floor(i / 4);
        return { ...n, x: 40 + col * 180, y: 40 + row * 80 };
      });

      // Build color map for nodes
      const nodeColors: Record<string, string> = {};
      positionedNodes.forEach((n, i) => {
        nodeColors[n.id] = n.color || NODE_COLORS[i % NODE_COLORS.length];
      });

      const graph = new X6.Graph({
        container,
        width: container.clientWidth,
        height,
        autoResize: false,
        background: { transparent: true },
        grid: false,
        panning: { enabled: true },
        mousewheel: { enabled: true, modifiers: [] },
        interacting: { nodeMovable: false },
        connecting: {
          anchor: 'center',
          connectionPoint: 'anchor',
          allowBlank: false,
          snap: true,
          createEdge() { return null; },
        },
      });

      // Add nodes
      for (const n of positionedNodes) {
        const color = nodeColors[n.id];
        const w = n.width || NODE_DEFAULTS.width;
        const h = n.height || NODE_DEFAULTS.height;
        graph.addNode({
          id: n.id,
          x: n.x,
          y: n.y,
          width: w,
          height: h,
          shape: 'rect',
          attrs: {
            body: {
              fill: color,
              stroke: color,
              strokeWidth: 1,
              rx: 6,
              ry: 6,
            },
            label: {
              text: n.label || n.id,
              fill: '#ffffff',
              fontSize: 12,
              fontFamily: 'system-ui, sans-serif',
            },
          },
        });
      }

      // Add edges
      for (const e of data.edges) {
        graph.addEdge({
          source: e.source,
          target: e.target,
          attrs: {
            line: {
              stroke: 'var(--rk-border, #94a3b8)',
              strokeWidth: 1.5,
              targetMarker: { name: 'block', width: 8, height: 6 },
            },
          },
          router: { name: 'normal' },
          connector: { name: 'rounded' },
          labels: e.label
            ? [
                {
                  attrs: {
                    label: {
                      text: e.label,
                      fill: 'var(--rk-muted, #64748b)',
                      fontSize: 10,
                      fontFamily: 'system-ui, sans-serif',
                    },
                    rect: {
                      fill: 'var(--rk-bg, #ffffff)',
                      stroke: 'var(--rk-border, #e2e8f0)',
                      strokeWidth: 0.5,
                      rx: 3,
                      ry: 3,
                    },
                  },
                },
              ]
            : [],
        });
      }

      // Center content
      graph.centerContent();

      this._graph = graph;
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-flow__error">Flow load failed: ${(err as Error).message}</div>`;
      }
    }
  }
}

customElements.define('rk-flow', RkFlow);
export { RkFlow };
