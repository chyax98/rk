// ─── rk-scroll-story ────────────────────────────────────────────
// Scroll-driven narrative sections using Scrollama.
// Steps scroll into view → active class toggle → highlight/transition.
//
// CDN: https://cdn.jsdelivr.net/npm/scrollama@3/build/scrollama.module.js
//
// Usage:
//   <rk-scroll-story offset="0.5">
//     <rk-step>...</rk-step>
//     <rk-step>...</rk-step>
//   </rk-scroll-story>

const SCROLLAMA_CDN = 'https://cdn.jsdelivr.net/npm/scrollama@3/build/scrollama.module.js';

function loadScrollama(): Promise<any> {
  if ((window as any).__scrollama__) return Promise.resolve((window as any).__scrollama__);
  return import(SCROLLAMA_CDN).then((mod) => {
    const lib = mod.default || mod;
    (window as any).__scrollama__ = lib;
    return lib;
  });
}

class RkScrollStory extends HTMLElement {
  private _scroller: any = null;
  private _loaded = false;

  static get observedAttributes() {
    return ['offset'];
  }

  connectedCallback() {
    if (!this._loaded) {
      this._loaded = true;
      this._init();
    }
  }

  async _init() {
    const offset = parseFloat(this.getAttribute('offset') || '0.5');
    const sticky = this.hasAttribute('sticky');

    try {
      const scrollama = await loadScrollama();
      const steps = this.querySelectorAll('rk-step');
      if (steps.length === 0) return;

      // Sticky layout: wrap in grid
      if (sticky) {
        this.classList.add('rk-scroll-story--sticky');
        // Move steps into right column if not already wrapped
        const right = this.querySelector('.rk-scroll-story__steps');
        if (!right) {
          const stepsDiv = document.createElement('div');
          stepsDiv.className = 'rk-scroll-story__steps';
          const graphic = document.createElement('div');
          graphic.className = 'rk-scroll-story__graphic';
          // Collect existing non-step content into graphic
          const kids = Array.from(this.childNodes);
          for (const kid of kids) {
            if (kid instanceof HTMLElement && kid.tagName === 'RK-STEP') {
              stepsDiv.appendChild(kid);
            } else if (kid instanceof Text && kid.textContent?.trim() === '') {
              continue;
            } else {
              graphic.appendChild(kid);
            }
          }
          this.appendChild(graphic);
          this.appendChild(stepsDiv);
        }
      }

      this._scroller = scrollama()
        .setup({
          step: this.querySelectorAll('rk-step'),
          offset: Math.max(0, Math.min(1, offset)),
          once: false,
          progress: true,
        })
        .onStepEnter(({ element }: { element: HTMLElement }) => {
          element.classList.add('is-active');
        })
        .onStepExit(({ element }: { element: HTMLElement }) => {
          element.classList.remove('is-active');
        })
        .onStepProgress(({ element, progress }: { element: HTMLElement; progress: number }) => {
          element.style.setProperty('--rk-step-progress', String(progress));
        });

      // Trigger resize in case layout settled after init
      window.addEventListener('resize', this._onResize);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.innerHTML = `<div class="rk-scroll-story__error">Scrollama load failed: ${msg}</div>`;
    }
  }

  private _onResize = () => {
    if (this._scroller) this._scroller.resize();
  };

  disconnectedCallback() {
    if (this._scroller) {
      this._scroller.destroy();
      this._scroller = null;
    }
    window.removeEventListener('resize', this._onResize);
  }
}

// ─── rk-step ────────────────────────────────────────────────────
// Sub-component: each narrative section inside rk-scroll-story.
// Gets .is-active class when in viewport (scroll-driven).

class RkStep extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  connectedCallback() {
    // Ensure proper class
    if (!this.classList.contains('rk-step')) {
      this.classList.add('rk-step');
    }
  }
}

customElements.define('rk-scroll-story', RkScrollStory);
customElements.define('rk-step', RkStep);

export { RkScrollStory, RkStep };
