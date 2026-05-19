// ─── rk-model — 3D model viewer (Google model-viewer CDN) ─────────

class RkModel extends HTMLElement {
  private _uid = Math.random().toString(36).slice(2, 9);
  private _renderSeq = 0;

  static get observedAttributes() {
    return ['src', 'poster', 'title', 'height', 'ar', 'auto-rotate', 'camera-controls', 'shadow-intensity', 'exposure'];
  }

  connectedCallback(): void {
    this._render();
  }

  disconnectedCallback(): void {
    this._renderSeq++;
    // model-viewer handles its own cleanup when removed from DOM
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
    this._render();
  }

  private _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  private async _injectModelViewer(): Promise<void> {
    if ((window as any).customElements.get('model-viewer')) return;
    if (document.querySelector('script[data-rk-model-viewer]')) {
      // Wait for existing script to load
      return new Promise<void>((resolve) => {
        const check = () => {
          if ((window as any).customElements.get('model-viewer')) resolve();
          else setTimeout(check, 100);
        };
        check();
      });
    }
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
      script.setAttribute('data-rk-model-viewer', '');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('model-viewer CDN load failed'));
      document.head.appendChild(script);
    });
  }

  private async _render(): Promise<void> {
    const seq = ++this._renderSeq;

    const src = this.getAttribute('src') || '';
    const poster = this.getAttribute('poster') || '';
    const title = this.getAttribute('title') || '';
    const height = this.getAttribute('height') || '400';
    const ar = this.hasAttribute('ar');
    const autoRotate = this.hasAttribute('auto-rotate');
    const cameraControls = this.hasAttribute('camera-controls');
    const shadowIntensity = this.getAttribute('shadow-intensity') || '1';
    const exposure = this.getAttribute('exposure') || '';

    if (!src) {
      this.innerHTML = `
        <div class="rk-model">
          <div class="rk-model__error">Missing <code>src</code> attribute. Provide a path to a GLTF/GLB file.</div>
        </div>`;
      return;
    }

    // Build model-viewer attributes
    const mvAttrs: string[] = [
      `src="${this._escape(src)}"`,
      `style="width:100%;height:${height}px"`,
      `shadow-intensity="${shadowIntensity}"`,
    ];
    if (poster) mvAttrs.push(`poster="${this._escape(poster)}"`);
    if (ar) mvAttrs.push('ar');
    if (autoRotate) mvAttrs.push('auto-rotate');
    if (cameraControls) mvAttrs.push('camera-controls');
    if (exposure) mvAttrs.push(`exposure="${exposure}"`);
    mvAttrs.push('loading="lazy"');

    const containerId = `rk-model-${this._uid}`;
    this.innerHTML = `
      <div class="rk-model">
        ${title ? `<div class="rk-model__title">${this._escape(title)}</div>` : ''}
        <div class="rk-model__container" id="${containerId}">
          <div class="rk-model__loading">Loading 3D model viewer…</div>
        </div>
      </div>`;

    try {
      await this._injectModelViewer();
      if (seq !== this._renderSeq) return;

      const container = this.querySelector(`#${containerId}`);
      if (!container) return;

      container.innerHTML = `<model-viewer ${mvAttrs.join(' ')}></model-viewer>`;
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-model__error">Failed to load model-viewer: ${(err as Error).message}</div>`;
      }
    }
  }
}

customElements.define('rk-model', RkModel);
export { RkModel };
