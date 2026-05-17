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

    this.innerHTML = /* html */ `
      <div class="rk-diagram">
        ${title ? `<div class="rk-diagram__title" style="margin-bottom:var(--rk-space-3);color:var(--rk-text);font:var(--rk-type-label);letter-spacing:var(--rk-tracking-wide);text-transform:uppercase">${this._escape(title)}</div>` : ''}
        <div class="rk-diagram__loading">Loading diagram…</div>
        <div class="rk-diagram__canvas"></div>
        ${caption ? `<div class="rk-diagram__caption">${this._escape(caption)}</div>` : ''}
      </div>
    `;

    this._renderMermaid();
  }

  async _renderMermaid(): Promise<void> {
    const canvas = this.querySelector('.rk-diagram__canvas') as HTMLElement;
    const loading = this.querySelector('.rk-diagram__loading') as HTMLElement;
    if (!canvas || !this._raw) return;

    try {
      const mermaid = await import('mermaid');
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      });

      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      const { svg } = await mermaid.default.render(id, this._raw);

      if (loading) loading.remove();
      canvas.innerHTML = svg;

      // Ensure SVG is responsive
      const svgEl = canvas.querySelector('svg');
      if (svgEl) {
        svgEl.style.maxWidth = '100%';
        svgEl.style.height = 'auto';
      }
    } catch (err: any) {
      if (loading) loading.remove();
      canvas.innerHTML = `<div style="padding:var(--rk-space-3);color:var(--rk-tone-danger-border);font-size:var(--rk-text-sm);white-space:pre-wrap">Mermaid error: ${this._escape(err?.message || String(err))}</div>`;
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
