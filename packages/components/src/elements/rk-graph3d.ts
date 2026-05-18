// ─── rk-graph3d — 3D force-directed graph (3d-force-graph CDN) ────

interface GraphNode {
  id: string;
  label?: string;
  group?: number;
  color?: string;
  size?: number;
  val?: number;
}

interface GraphLink {
  source: string;
  target: string;
  label?: string;
  color?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface FGInstance {
  graphData: (d: GraphData) => FGInstance;
  nodeLabel: (fn: string | ((n: GraphNode) => string)) => FGInstance;
  linkLabel: (fn: string | ((l: GraphLink) => string)) => FGInstance;
  nodeColor: (fn: string | ((n: GraphNode) => string)) => FGInstance;
  linkColor: (fn: string | ((l: GraphLink) => string)) => FGInstance;
  nodeVal: (fn: string | ((n: GraphNode) => number)) => FGInstance;
  linkWidth: (fn: number | ((l: GraphLink) => number)) => FGInstance;
  linkDirectionalArrowLength: (v: number) => FGInstance;
  linkDirectionalArrowRelPos: (v: number) => FGInstance;
  backgroundColor: (c: string) => FGInstance;
  dagMode: (m: string) => FGInstance;
  dagLevelDistance: (d: number) => FGInstance;
  width: (w: number) => FGInstance;
  height: (h: number) => FGInstance;
  cooldownTicks: (t: number) => FGInstance;
  warmupTicks: (t: number) => FGInstance;
  _destructor: () => void;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
}

interface FGConstructor {
  (opts?: Record<string, unknown>): FGInstance;
}

// Accent palette for group-based coloring
const GROUP_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

class RkGraph3d extends HTMLElement {
  private _raw = '';
  private _graph: FGInstance | null = null;
  private _ro: ResizeObserver | null = null;

  static get observedAttributes() {
    return ['title', 'height', 'dag'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = (this.textContent || '').trim();
    this._render();
  }

  disconnectedCallback(): void {
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
    if (this._graph) {
      try {
        this._graph._destructor();
      } catch {
        /* best-effort */
      }
      this._graph = null;
    }
  }

  private async _render(): Promise<void> {
    this._cleanup();
    const title = this.getAttribute('title') || '';
    const height = parseInt(this.getAttribute('height') || '500', 10);
    const dagAttr = this.getAttribute('dag');

    let data: GraphData;
    try {
      data = JSON.parse(this._raw);
    } catch (e) {
      this.innerHTML = `<div class="rk-graph3d"><div class="rk-graph3d__error">Invalid JSON: ${(e as Error).message}</div></div>`;
      return;
    }

    if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      this.innerHTML = `<div class="rk-graph3d"><div class="rk-graph3d__error">Graph spec requires "nodes" array.</div></div>`;
      return;
    }
    if (!data.links) data.links = [];

    const container = document.createElement('div');
    container.className = 'rk-graph3d__canvas';
    container.style.width = '100%';
    container.style.height = height + 'px';

    const wrapper = document.createElement('div');
    wrapper.className = 'rk-graph3d';
    if (title) {
      const h = document.createElement('div');
      h.className = 'rk-graph3d__title';
      h.textContent = title;
      wrapper.appendChild(h);
    }
    wrapper.appendChild(container);
    this.innerHTML = '';
    this.appendChild(wrapper);

    // Lazy-load 3d-force-graph CDN
    let FG: FGConstructor;
    try {
      FG = await this._loadLib();
    } catch {
      this.innerHTML = `<div class="rk-graph3d"><div class="rk-graph3d__error">Failed to load 3d-force-graph from CDN.</div></div>`;
      return;
    }

    try {
      const graph = FG()(container)
        .graphData(data)
        .nodeLabel((n: GraphNode) => n.label || n.id)
        .linkLabel((l: GraphLink) => l.label || `${l.source} → ${l.target}`)
        .nodeColor((n: GraphNode) =>
          n.color || GROUP_COLORS[(n.group || 0) % GROUP_COLORS.length],
        )
        .nodeVal((n: GraphNode) => n.size || n.val || 1)
        .linkColor(() => 'rgba(255,255,255,0.2)')
        .linkWidth(1)
        .linkDirectionalArrowLength(3.5)
        .linkDirectionalArrowRelPos(1)
        .backgroundColor('transparent')
        .width(container.offsetWidth)
        .height(container.offsetHeight)
        .cooldownTicks(200);

      if (dagAttr !== null) {
        graph.dagMode('td').dagLevelDistance(50);
      }

      this._graph = graph;

      // Resize observer
      this._ro = new ResizeObserver(() => {
        if (this._graph) {
          try {
            this._graph.width(container.offsetWidth).height(container.offsetHeight);
          } catch {
            /* best-effort */
          }
        }
      });
      this._ro.observe(container);
    } catch (e) {
      container.innerHTML = `<div class="rk-graph3d__error">Graph render error: ${(e as Error).message}</div>`;
    }
  }

  private _loadLib(): Promise<FGConstructor> {
    const win = window as unknown as { ForceGraph3D?: FGConstructor };
    if (win.ForceGraph3D) return Promise.resolve(win.ForceGraph3D);
    return new Promise<FGConstructor>((resolve, reject) => {
      const existing = document.querySelector('script[data-rk-graph3d]');
      if (existing) {
        const check = () => {
          if (win.ForceGraph3D) resolve(win.ForceGraph3D);
          else reject(new Error('3d-force-graph load timeout'));
        };
        existing.addEventListener('load', check);
        existing.addEventListener('error', () => reject(new Error('3d-force-graph script error')));
        if (win.ForceGraph3D) { resolve(win.ForceGraph3D); return; }
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/3d-force-graph@1/dist/3d-force-graph.min.js';
      script.setAttribute('data-rk-graph3d', '1');
      script.onload = () => {
        if (win.ForceGraph3D) resolve(win.ForceGraph3D);
        else reject(new Error('ForceGraph3D global not found after load'));
      };
      script.onerror = () => reject(new Error('Failed to fetch 3d-force-graph CDN'));
      document.head.appendChild(script);
    });
  }
}

customElements.define('rk-graph3d', RkGraph3d);
export { RkGraph3d };
