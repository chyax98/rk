import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { parseHTML } from 'linkedom';
import { createHighlighter, type Highlighter } from 'shiki';

export interface ProcessedAnchor {
  id: string;
  anchor: string;
  elementTag: string;
  position: number;
  textPreview: string | null;
}

export interface RenderWarning {
  engine: string;
  message: string;
}

export interface ProcessedHTML {
  processedHtml: string;
  anchors: ProcessedAnchor[];
  title: string;
  warnings: RenderWarning[];
}

const TOP_LEVEL_TAGS = new Set([
  'rk-callout',
  'rk-stat',
  'rk-summary',
  'rk-code',
  'rk-table',
  'rk-chart',
  'rk-diagram',
  'rk-decision',
  'rk-checklist',
  'rk-comparison',
  'rk-timeline',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'blockquote',
  'img',
  'figure',
  'div',
  'section',
  'table',
  'ul',
  'ol',
  'pre',
  'details',
]);

let _highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter | null> {
  if (_highlighter) return _highlighter;
  try {
    _highlighter = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['typescript', 'javascript', 'python', 'bash', 'json', 'html', 'css', 'sql'],
    });
    return _highlighter;
  } catch {
    return null;
  }
}

function generateAnchorId(tag: string, index: number, text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return slug ? `${tag}-${slug}` : `${tag}-${index}`;
}

async function preRenderCodeBlocks(document: Document): Promise<void> {
  const highlighter = await getHighlighter();
  if (!highlighter) return;

  const codeElements = document.querySelectorAll('rk-code code, pre code');
  for (const codeEl of codeElements as unknown as HTMLElement[]) {
    try {
      const lang =
        codeEl.getAttribute('data-lang') ||
        codeEl.getAttribute('class')?.match(/language-(\w+)/)?.[1] ||
        'text';
      const text = codeEl.textContent || '';
      const html = highlighter.codeToHtml(text, {
        lang: lang in highlighter.getLoadedLanguages() ? lang : 'text',
        themes: { dark: 'github-dark', light: 'github-light' },
      });
      // Replace code element content with highlighted HTML
      const temp = document.createElement('span');
      temp.innerHTML = html;
      codeEl.replaceWith(temp.firstElementChild || temp);
    } catch {
      // Code highlighting failure is non-blocking
    }
  }
}

/** Render D2 source via local d2 binary (best-effort) */
async function d2Render(
  source: string,
): Promise<{ svg: string; error: null } | { svg: null; error: string }> {
  return new Promise((resolve) => {
    const proc = spawn('d2', ['--layout=elk', '--theme=0', '-'], {
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let svg = '';
    let err = '';
    proc.stdin.write(source);
    proc.stdin.end();
    proc.stdout.on('data', (d: Buffer) => (svg += d.toString()));
    proc.stderr.on('data', (d: Buffer) => (err += d.toString()));
    proc.on('close', (code) => {
      if (code === 0 && svg.includes('<svg')) resolve({ svg, error: null });
      else
        resolve({
          svg: null,
          error: err.trim().replace(/^err:\s*/gm, '').slice(0, 300) || `exit code ${String(code)}`,
        });
    });
    proc.on('error', (e) => {
      resolve({
        svg: null,
        error: `d2 not found: ${e.message}. Install: curl -fsSL https://d2lang.com/install.sh | sh`,
      });
    });
  });
}

/** Fetch SVG from Kroki for a given engine (best-effort) */
async function krokiRender(
  engine: string,
  source: string,
): Promise<{ svg: string; error: null } | { svg: null; error: string }> {
  try {
    const res = await fetch(`https://kroki.io/${engine}/svg`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: source,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      // Capture Kroki's error body — it contains the actual syntax error from PlantUML/Graphviz
      const errBody = await res.text().catch(() => `HTTP ${res.status}`);
      return { svg: null, error: errBody.trim().slice(0, 300) };
    }
    return { svg: await res.text(), error: null };
  } catch (e) {
    return { svg: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Pre-process diagrams via SSR: d2 (local binary) + plantuml/graphviz (Kroki) */
async function processPlantUML(html: string): Promise<{ html: string; warnings: RenderWarning[] }> {
  const regex =
    /<rk-diagram([^>]*engine=["'](plantuml|graphviz|dot|d2)["'][^>]*)>([\s\S]*?)<\/rk-diagram>/gi;
  const matches: Array<{ full: string; attrs: string; engine: string; source: string }> = [];
  let match = regex.exec(html);
  while (match !== null) {
    const raw = (match[2] || 'plantuml');
    const engine = raw === 'dot' ? 'graphviz' : raw;
    matches.push({ full: match[0], attrs: match[1], engine, source: match[3].trim() });
    match = regex.exec(html);
  }

  const resolved = await Promise.all(
    matches.map(async ({ full, attrs, engine, source }) => {
      const result =
        engine === 'd2'
          ? await d2Render(source)
          : await krokiRender(engine, source);
      if (!result.svg)
        return { full, replacement: full, warning: { engine, message: result.error } };
      const replacement = `<rk-diagram${attrs}><div class="rk-diagram__prerendered" style="width:100%;overflow-x:auto">${result.svg}</div></rk-diagram>`;
      return { full, replacement, warning: null };
    }),
  );

  const warnings: RenderWarning[] = resolved
    .filter((r) => r.warning !== null)
    .map((r) => r.warning as RenderWarning);

  let html2 = html;
  for (const { full, replacement } of resolved) {
    html2 = html2.replace(full, replacement);
  }
  return { html: html2, warnings };
}

/** Strip outer <html>/<head>/<body> wrapper if agent pushed a full document */
function extractBodyContent(html: string): string {
  const trimmed = html.trim();
  // Quick check — only parse if looks like a full document
  if (!/<html/i.test(trimmed)) return html;
  const { document } = parseHTML(`<!doctype html>${trimmed}`);
  const body = document.body;
  return body ? body.innerHTML : html;
}

export async function processHTML(rawHtml: string): Promise<ProcessedHTML> {
  // Strip full HTML wrapper if agent pushed a complete document
  const bodyContent = extractBodyContent(rawHtml);
  // PlantUML/Graphviz SSR via Kroki (best-effort — errors collected as warnings)
  const { html: htmlWithDiagrams, warnings } = await processPlantUML(bodyContent);
  const { document } = parseHTML(`<!doctype html><html><body>${htmlWithDiagrams}</body></html>`);

  // Pre-render code blocks with shiki (best-effort)
  await preRenderCodeBlocks(document);

  const anchors: ProcessedAnchor[] = [];
  let position = 0;

  // Extract title from <title> or first <h1>
  let title = '';
  const titleEl = document.querySelector('title');
  if (titleEl?.textContent) {
    title = titleEl.textContent.trim();
  }
  if (!title) {
    const h1 = document.querySelector('h1');
    if (h1?.textContent) {
      title = h1.textContent.trim();
    }
  }

  // Walk top-level children of body
  const body = document.body;
  if (!body) {
    return {
      processedHtml: '',
      anchors: [],
      title: title || 'Untitled',
      warnings,
    };
  }

  const children = Array.from(body.children);
  for (const child of children as unknown as HTMLElement[]) {
    const tag = child.tagName?.toLowerCase();
    if (!tag || !TOP_LEVEL_TAGS.has(tag)) continue;

    const textPreview = (child.textContent || '').trim().slice(0, 200) || null;
    const anchor = generateAnchorId(tag, position, textPreview || '');

    child.setAttribute('data-rk-anchor', anchor);

    anchors.push({
      id: `anc_${crypto.randomBytes(6).toString('hex')}`,
      anchor,
      elementTag: tag,
      position,
      textPreview,
    });

    position++;
  }

  // Serialize processed HTML from body
  const processedHtml = body.innerHTML;

  return {
    processedHtml,
    anchors,
    title: title || 'Untitled',
    warnings,
  };
}
