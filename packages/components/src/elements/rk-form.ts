// ─── rk-form & rk-field ───────────────────────────────────────────────────────
// Usage:
//   <rk-form title="评审意见" submit-label="提交">
//     <rk-field label="整体评分" type="rating" max="5" required />
//     <rk-field label="主要问题" type="textarea" placeholder="描述问题..." />
//     <rk-field label="优先级" type="select" options="高,中,低" />
//     <rk-field label="你的名字" type="text" placeholder="输入姓名" />
//   </rk-form>
//
// type: text | textarea | select | rating | checkbox | number
// Submissions are logged to console as JSON (no server integration needed for MVP)

class RkField extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'type', 'max', 'placeholder', 'options', 'required', 'name', 'value'];
  }

  connectedCallback(): void { this._render(); }
  attributeChangedCallback(): void { this._render(); }

  getValue(): unknown {
    const input = this.querySelector('input,textarea,select') as HTMLInputElement | null;
    const type = this.getAttribute('type') || 'text';
    if (type === 'rating') {
      const checked = this.querySelector('.rk-field__star--active:last-of-type') as HTMLElement | null;
      return checked ? Number(checked.dataset.value) : 0;
    }
    if (type === 'checkbox') {
      return (input as HTMLInputElement)?.checked ?? false;
    }
    return input?.value ?? '';
  }

  _render(): void {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const max = Number(this.getAttribute('max') || 5);
    const placeholder = this.getAttribute('placeholder') || '';
    const options = (this.getAttribute('options') || '').split(',').map(s => s.trim()).filter(Boolean);
    const required = this.hasAttribute('required');
    const name = this.getAttribute('name') || label.toLowerCase().replace(/\s+/g, '_');

    const fieldId = `rk-field-${Math.random().toString(36).slice(2, 8)}`;

    const sharedStyle = `
      font:400 var(--rk-text-base,15px)/1.5 var(--rk-font-sans,sans-serif);
      color:var(--rk-text,#1a1a1a);
      background:var(--rk-surface,#fff);
      border:1px solid var(--rk-border,#e5e4dc);
      border-radius:var(--rk-radius-sm,6px);
      padding:var(--rk-space-2,8px) var(--rk-space-3,12px);
      width:100%;box-sizing:border-box;
      outline:none;transition:border-color 150ms;
    `;

    let control = '';
    if (type === 'textarea') {
      control = `<textarea id="${fieldId}" name="${name}" placeholder="${this._escape(placeholder)}" rows="4"
        style="${sharedStyle}min-height:96px;resize:vertical;"
        onfocus="this.style.borderColor='var(--rk-accent)'"
        onblur="this.style.borderColor='var(--rk-border)'"
      ></textarea>`;
    } else if (type === 'select') {
      const opts = options.map(o => `<option value="${this._escape(o)}">${this._escape(o)}</option>`).join('');
      control = `<select id="${fieldId}" name="${name}" style="${sharedStyle}cursor:pointer;"
        onfocus="this.style.borderColor='var(--rk-accent)'"
        onblur="this.style.borderColor='var(--rk-border)'"
      ><option value="">请选择...</option>${opts}</select>`;
    } else if (type === 'rating') {
      const stars = Array.from({ length: max }, (_, i) => {
        const v = i + 1;
        return `<button type="button" class="rk-field__star" data-value="${v}"
          style="background:none;border:none;cursor:pointer;padding:2px;font-size:22px;line-height:1;
            color:var(--rk-border-hover,#ccc);transition:color 150ms;outline:none;"
          onclick="(function(el){
            const stars=el.closest('.rk-field__stars').querySelectorAll('.rk-field__star');
            stars.forEach((s,idx)=>{
              s.style.color=idx<${v}?'#f59e0b':'var(--rk-border-hover,#ccc)';
              s.classList.toggle('rk-field__star--active',idx<${v});
              if(idx===${v}-1)s.classList.add('rk-field__star--active');
            });
          })(this)"
          onmouseover="(function(el){
            const stars=el.closest('.rk-field__stars').querySelectorAll('.rk-field__star');
            stars.forEach((s,idx)=>{s.style.color=idx<${v}?'#fbbf24':'var(--rk-border-hover,#ccc)';});
          })(this)"
          onmouseout="(function(el){
            const stars=el.closest('.rk-field__stars').querySelectorAll('.rk-field__star');
            const active=parseInt(el.closest('.rk-field__stars').dataset.rating||'0');
            stars.forEach((s,idx)=>{s.style.color=idx<active?'#f59e0b':'var(--rk-border-hover,#ccc)';});
          })(this)"
        >★</button>`;
      }).join('');
      control = `<div class="rk-field__stars" data-rating="0" style="display:flex;gap:2px;">${stars}</div>`;
    } else if (type === 'checkbox') {
      control = `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="${fieldId}" name="${name}"
          style="width:16px;height:16px;accent-color:var(--rk-accent,#0267a5);cursor:pointer;">
        <span style="font:400 var(--rk-text-sm,13px)/1.5 var(--rk-font-sans);color:var(--rk-text);">
          ${this._escape(placeholder || label)}
        </span>
      </label>`;
    } else {
      control = `<input type="${type === 'number' ? 'number' : 'text'}" id="${fieldId}" name="${name}"
        placeholder="${this._escape(placeholder)}"
        style="${sharedStyle}"
        onfocus="this.style.borderColor='var(--rk-accent)'"
        onblur="this.style.borderColor='var(--rk-border)'"
      >`;
    }

    this.innerHTML = `
      <div class="rk-field" style="margin-bottom:var(--rk-space-4,16px);">
        ${type !== 'checkbox' ? `
          <label for="${fieldId}" style="
            display:block;margin-bottom:6px;
            font:600 var(--rk-text-sm,13px)/1.4 var(--rk-font-sans,sans-serif);
            color:var(--rk-text,#1a1a1a);
          ">${this._escape(label)}${required ? ' <span style="color:var(--rk-tone-danger-border,#dc2626)">*</span>' : ''}</label>
        ` : ''}
        ${control}
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

class RkForm extends HTMLElement {
  _fieldsHTML = '';

  static get observedAttributes() {
    return ['title', 'submit-label', 'description'];
  }

  connectedCallback(): void {
    // Capture field declarations before first render
    if (!this._fieldsHTML) {
      this._fieldsHTML = Array.from(this.querySelectorAll('rk-field'))
        .map(f => f.outerHTML).join('') ||
        this.innerHTML; // fallback to raw HTML
    }
    this._render();
  }
  attributeChangedCallback(): void { if (this._fieldsHTML) this._render(); }

  _render(): void {
    const title = this.getAttribute('title') || '表单';
    const submitLabel = this.getAttribute('submit-label') || '提交';
    const description = this.getAttribute('description') || '';

    // Use cached field HTML
    const fieldHTML = this._fieldsHTML;

    this.innerHTML = `
      <div class="rk-form" style="
        background:var(--rk-surface,#fff);
        border:1px solid var(--rk-border,#e5e4dc);
        border-radius:var(--rk-radius-lg,14px);
        padding:var(--rk-space-6,24px);
        max-width:560px;
      ">
        <h3 style="
          margin:0 0 var(--rk-space-2,8px);
          font:700 var(--rk-text-lg,20px)/1.3 var(--rk-font-sans,sans-serif);
          color:var(--rk-text,#1a1a1a);
        ">${this._escape(title)}</h3>
        ${description ? `<p style="
          margin:0 0 var(--rk-space-4,16px);
          font:400 var(--rk-text-sm,13px)/1.6 var(--rk-font-sans);
          color:var(--rk-text-tertiary,#6b6b66);
        ">${this._escape(description)}</p>` : `<div style="margin-bottom:var(--rk-space-4,16px)"></div>`}
        <div class="rk-form__fields">${fieldHTML}</div>
        <button type="button" class="rk-form__submit"
          onclick="(function(btn){
            const form = btn.closest('.rk-form');
            const fields = form.querySelectorAll('rk-field');
            const result = {};
            fields.forEach(f => {
              const label = f.getAttribute('label') || f.getAttribute('name') || 'field';
              const type = f.getAttribute('type') || 'text';
              let val;
              if(type==='rating'){
                const lastActive = f.querySelector('.rk-field__star--active');
                val = lastActive ? Number(lastActive.dataset.value) : 0;
              } else if(type==='checkbox'){
                val = f.querySelector('input')?.checked ?? false;
              } else {
                val = f.querySelector('input,textarea,select')?.value ?? '';
              }
              result[label] = val;
            });
            console.log('[RenderKit Form Submission]', JSON.stringify(result, null, 2));
            btn.textContent = '✓ 已提交（见控制台）';
            btn.style.background = 'var(--rk-tone-success-bg)';
            btn.style.color = 'var(--rk-tone-success-border)';
            btn.style.borderColor = 'var(--rk-tone-success-border)';
            btn.disabled = true;
          })(this)"
          style="
            display:inline-flex;align-items:center;gap:6px;
            padding:var(--rk-space-2,8px) var(--rk-space-6,24px);
            background:var(--rk-accent,#0267a5);color:white;
            border:1px solid var(--rk-accent,#0267a5);
            border-radius:var(--rk-radius-sm,6px);
            font:600 var(--rk-text-sm,13px)/1.4 var(--rk-font-sans,sans-serif);
            cursor:pointer;transition:all 150ms;
          "
          onmouseover="if(!this.disabled)this.style.background='var(--rk-accent-hover)'"
          onmouseout="if(!this.disabled)this.style.background='var(--rk-accent)'"
        >${this._escape(submitLabel)}</button>
      </div>
    `;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-field', RkField);
customElements.define('rk-form', RkForm);
