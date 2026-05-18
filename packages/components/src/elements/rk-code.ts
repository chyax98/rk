// ─── rk-code ────────────────────────────────────────────────────
class RkCode extends HTMLElement {
  _raw = '';

  static get observedAttributes() {
    return ['lang', 'title', 'frame', 'showlinenumbers', 'data-highlighted'];
  }

  
connectedCallback(): void {
    if (!this._raw) this._raw = this.textContent || '';
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();
  }

  _render(): void {
    const lang = this.getAttribute('lang') || '';
    const title = this.getAttribute('title') || '';
    const frame = this.getAttribute('frame') || 'none';
    const showLineNumbers =
      this.hasAttribute('showlinenumbers') || this.hasAttribute('showLineNumbers');
    const highlighted = this.getAttribute('data-highlighted') || '';

    let frameClass = '';
    if (frame === 'editor') frameClass = 'rk-code--frame-editor';
    else if (frame === 'terminal') frameClass = 'rk-code--frame-terminal';

    // Build header
    let headerHtml = '';
    const showHeader = frame === 'editor' || frame === 'terminal' || title || lang;
    if (showHeader) {
      let dotsHtml = '';
      if (frame === 'editor' || frame === 'terminal') {
        dotsHtml = `<span class="rk-code__dots"><i></i><i></i><i></i></span>`;
      }
      let promptHtml = '';
      if (frame === 'terminal') {
        promptHtml = `<span class="rk-code__title" style="color:var(--rk-muted)">$</span>`;
      }
      headerHtml = /* html */ `
        <div class="rk-code__header">
          ${dotsHtml}
          ${promptHtml}
          ${title ? `<span class="rk-code__title">${this._escape(title)}</span>` : ''}
          ${lang ? `<span class="rk-code__lang">${this._escape(lang)}</span>` : ''}
        </div>
      `;
    }

    // Body: prefer data-highlighted (base64 Shiki HTML), else raw code
    let bodyContent = '';
    if (highlighted) {
      try {
        bodyContent = atob(highlighted);
      } catch {
        bodyContent = this._escapeHtml(this._raw);
      }
    } else {
      bodyContent = this._escapeHtml(this._raw);
    }

    // Wrap in line numbers if requested
    if (showLineNumbers) {
      const lines = bodyContent.split('\n');
      // Remove trailing empty line
      if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
      }
      const rows = lines
        .map((line, i) => `<tr><td class="rk-ln">${i + 1}</td><td class="rk-lc">${line}</td></tr>`)
        .join('');
      bodyContent = `<table><tbody>${rows}</tbody></table>`;
    }

    this.innerHTML = /* html */ `
      <div class="rk-code ${frameClass}">
        ${headerHtml}
        <div class="rk-code__body"><code>${bodyContent}</code></div>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  _escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('rk-code', RkCode);

export { RkCode };
