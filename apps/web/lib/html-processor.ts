import crypto from 'node:crypto';
import { parseHTML } from 'linkedom';
import { createHighlighter, type Highlighter } from 'shiki';

export interface ProcessedAnchor {
  id: string;
  anchor: string;
  elementTag: string;
  position: number;
  textPreview: string | null;
}

export interface ProcessedHTML {
  processedHtml: string;
  anchors: ProcessedAnchor[];
  title: string;
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

/** Fetch SVG from Kroki for a given engine (best-effort) */
async function krokiRender(engine: string, source: string): Promise<string | null> {
  try {
    const res = await fetch(`https://kroki.io/${engine}/svg`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: source,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Pre-process diagrams via Kroki SSR: plantuml + graphviz (best-effort, failures are silent) */
async function processPlantUML(html: string): Promise<string> {
  const regex = /<rk-diagram([^>]*engine=["'](plantuml|graphviz|dot)["'][^>]*)>([\s\S]*?)<\/rk-diagram>/gi;
  const matches: Array<{ full: string; attrs: string; engine: string; source: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const engine = (m[2] || 'plantuml').replace('dot', 'graphviz');
    matches.push({ full: m[0], attrs: m[1], engine, source: m[3].trim() });
  }
  if (matches.length === 0) return html;

  const resolved = await Promise.all(
    matches.map(async ({ full, attrs, engine, source }) => {
      const svg = await krokiRender(engine, source);
      if (!svg) return { full, replacement: full };
      const replacement = `<rk-diagram${attrs}><div class="rk-diagram__prerendered" style="width:100%;overflow-x:auto">${svg}</div></rk-diagram>`;
      return { full, replacement };
    })
  );

  let result = html;
  for (const { full, replacement } of resolved) {
    result = result.replace(full, replacement);
  }
  return result;
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
  // PlantUML SSR via Kroki (before DOM parsing)
  const htmlWithDiagrams = await processPlantUML(bodyContent);
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
  };
}
