// ─── rk-diagram ──────────────────────────────────────────────────
class RkDiagram extends HTMLElement {
  _raw = '';
  _observer: ResizeObserver | null = null;

  static get observedAttributes() {
    return ['title', 'caption', 'engine'];
  }

  connectedCallback(): void {
    this._raw = (this.textContent || '').trim();
    this._render();
  }

  disconnectedCallback(): void {
    this._observer?.disconnect();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const title = this.getAttribute('title') || '';
    const caption = this.getAttribute('caption') || '';
    const engine = this.getAttribute('engine') || 'mermaid';

    this.innerHTML = /* html */ `
      <div class="rk-diagram">
        ${title ? `<div class="rk-diagram__title" style="margin-bottom:var(--rk-space-3);color:var(--rk-text);font:var(--rk-type-label);letter-spacing:var(--rk-tracking-wide);text-transform:uppercase">${this._escape(title)}</div>` : ''}
        <div class="rk-diagram__loading">Loading diagram…</div>
        <div class="rk-diagram__canvas"></div>
        ${caption ? `<div class="rk-diagram__caption">${this._escape(caption)}</div>` : ''}
      </div>
    `;

    if (engine === 'plantuml') {
      const prerendered = this.querySelector('.rk-diagram__prerendered');
      if (prerendered) {
        const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
        if (loading) loading.style.display = 'none';
      } else {
        const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
        if (loading) {
          loading.innerHTML = '⚠️ PlantUML 图表需要服务端处理后查看。<br><small>在 server 启动状态下推送 artifact 即可自动渲染。</small>';
        }
      }
      return;
    }

    if (engine === 'd2') {
      this._renderD2();
      return;
    }

    if (engine === 'graphviz' || engine === 'dot') {
      this._renderGraphviz();
      return;
    }

    // default: mermaid
    this._renderMermaid();
  }

  async _renderMermaid(): Promise<void> {
    const canvas = this.querySelector('.rk-diagram__canvas') as HTMLElement;
    const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
    if (!canvas || !this._raw) return;

    try {
      const mermaid = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      });

      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      const { svg } = await mermaid.default.render(id, this._raw);

      if (loading) loading.remove();
      canvas.innerHTML = svg;
      this._makeSvgResponsive(canvas);
    } catch (err: any) {
      if (loading) loading.remove();
      canvas.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm);white-space:pre-wrap">Mermaid error: ${this._escape(err?.message || String(err))}</div>`;
    }
  }

  async _renderD2(): Promise<void> {
    const canvas = this.querySelector('.rk-diagram__canvas') as HTMLElement;
    const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
    if (!canvas || !this._raw) return;
    try {
      // @ts-ignore
      const mod = await import('https://cdn.jsdelivr.net/npm/@terrastruct/d2@0.1.33/dist/browser/index.js');
      const Renderer = mod.Renderer || mod.default || mod.D2 || mod;
      const renderer = new Renderer();
      const svg = await renderer.render(this._raw);
      if (loading) loading.remove();
      canvas.innerHTML = typeof svg === 'string' ? svg : (svg?.svg || svg?.toString() || '');
      this._makeSvgResponsive(canvas);
    } catch (e: any) {
      if (loading) loading.textContent = `D2 渲染失败: ${e?.message || String(e)}`;
    }
  }

  async _renderGraphviz(): Promise<void> {
    const canvas = this.querySelector('.rk-diagram__canvas') as HTMLElement;
    const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
    if (!canvas || !this._raw) return;
    try {
      // @ts-ignore
      const { Graphviz } = await import('https://cdn.jsdelivr.net/npm/@hpcc-js/wasm-graphviz/dist/index.js');
      const graphviz = await Graphviz.load();
      const svg = graphviz.dot(this._raw);
      if (loading) loading.remove();
      canvas.innerHTML = svg;
      this._makeSvgResponsive(canvas);
    } catch (e: any) {
      if (loading) loading.textContent = `Graphviz 渲染失败: ${e?.message || String(e)}`;
    }
  }

  _makeSvgResponsive(container: HTMLElement): void {
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
      svgEl.style.width = '100%';
      svgEl.style.maxWidth = '100%';
      svgEl.style.height = 'auto';
    }
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-diagram', RkDiagram);

export { RkDiagram };
