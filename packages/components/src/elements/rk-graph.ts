// ─── rk-graph — 2D network / knowledge graph (Cytoscape.js CDN) ─

interface GraphNode {
  id: string;
  label?: string;
  group?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface CyInstance {
  destroy: () => void;
}

type CytoscapeModule = {
  default: (opts: Record<string, unknown>) => CyInstance;
};

const ACCENT_PALETTE = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

class RkGraph extends HTMLElement {
  _cy: CyInstance | null = null;
  _raw = '';
  _uid = Math.random().toString(36).slice(2, 9);

  static get observedAttributes() {
    return ['title', 'height', 'layout'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = (this.textContent || '').trim();
    this._render();
  }

  disconnectedCallback(): void {
    if (this._cy) {
      this._cy.destroy();
      this._cy = null;
    }
  }

  attributeChangedCallback(): void {
    if (!this.isConnected || !this._raw) return;
    if (this._cy) {
      this._cy.destroy();
      this._cy = null;
    }
    this._render();
  }

  _parseData(): GraphData | null {
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

  async _render(): Promise<void> {
    const height = parseInt(this.getAttribute('height') || '400', 10) || 400;
    const title = this.getAttribute('title') || '';
    const layoutName = this.getAttribute('layout') || 'cose';
    const data = this._parseData();
    const containerId = `rk-graph-${this._uid}`;

    if (!data) {
      this.innerHTML = `<div class="rk-graph"><div class="rk-graph__error">Invalid JSON. Expected: {"nodes": [...], "edges": [...]}</div></div>`;
      return;
    }

    this.innerHTML = `
      <div class="rk-graph">
        ${title ? `<div class="rk-graph__title">${this._escape(title)}</div>` : ''}
        <div class="rk-graph__container" id="${containerId}" style="height:${height}px;width:100%;"></div>
        <div class="rk-graph__info">${data.nodes.length} nodes, ${data.edges.length} edges</div>
      </div>`;

    try {
      const cytoscape = (await import(
        /* @vite-ignore */
        'https://cdn.jsdelivr.net/npm/cytoscape@3/dist/cytoscape.esm.min.js'
      )) as unknown as CytoscapeModule;

      const container = this.querySelector(`#${containerId}`) as HTMLElement;
      if (!container) return;

      // Build group → color map
      const groups = [...new Set(data.nodes.map((n) => n.group || 'default'))];
      const groupColor = (group: string): string => {
        const idx = groups.indexOf(group);
        return ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
      };

      const elements = [
        ...data.nodes.map((n) => ({
          data: {
            id: n.id,
            label: n.label || n.id,
            group: n.group || 'default',
            color: groupColor(n.group || 'default'),
          },
        })),
        ...data.edges.map((e, i) => ({
          data: {
            id: `e${i}`,
            source: e.source,
            target: e.target,
            label: e.label || '',
          },
        })),
      ];

      const cy = cytoscape.default({
        container,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '11px',
              'color': 'var(--rk-text, #1e293b)',
              'background-color': 'data(color)',
              'border-width': 1,
              'border-color': 'var(--rk-border, #e2e8f0)',
              'width': 60,
              'height': 30,
              'shape': 'round-rectangle',
              'text-wrap': 'ellipsis',
              'text-max-width': '56px',
              'font-family': 'system-ui, sans-serif',
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 1.5,
              'line-color': 'var(--rk-border, #94a3b8)',
              'target-arrow-color': 'var(--rk-border, #94a3b8)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '9px',
              'text-rotation': 'autorotate',
              'text-outline-width': 2,
              'text-outline-color': 'var(--rk-bg, #ffffff)',
              'color': 'var(--rk-muted, #64748b)',
              'font-family': 'system-ui, sans-serif',
            },
          },
        ],
        layout: {
          name: layoutName,
          animate: false,
          fit: true,
          padding: 30,
        } as Record<string, unknown>,
      });

      this._cy = cy;
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-graph__error">Graph load failed: ${(err as Error).message}</div>`;
      }
    }
  }
}

customElements.define('rk-graph', RkGraph);
export { RkGraph };
