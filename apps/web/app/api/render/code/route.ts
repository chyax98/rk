export const runtime = 'nodejs';

let highlighterPromise: Promise<any> | null = null;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const { createHighlighter } = await import('shiki');
      const highlighter = await createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'bash', 'json', 'yaml', 'css', 'html', 'markdown', 'sql', 'rust', 'go', 'java', 'diff'],
      });
      return highlighter;
    })();
  }
  return highlighterPromise;
}

export async function POST(req: Request) {
  let payload: { code?: string; language?: string; theme?: string };
  try { payload = await req.json(); }
  catch { return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 }); }

  const code = String(payload?.code || '');
  const language = String(payload?.language || 'text');
  const theme = String(payload?.theme || 'github-light');

  if (!code.trim()) return Response.json({ ok: false, error: 'Missing code' }, { status: 400 });

  try {
    const highlighter = await getHighlighter();

    // Resolve language — shiki uses different IDs than hljs
    const langId = resolveLangId(language);
    const availableLangs = highlighter.getLoadedLanguages();
    const lang = availableLangs.includes(langId) ? langId : 'text';

    const html = highlighter.codeToHtml(code, { lang, theme });
    return Response.json({ ok: true, html });
  } catch (e) {
    return Response.json({ ok: false, error: String((e as Error).message || e) });
  }
}

function resolveLangId(lang: string): string {
  const map: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'sh': 'bash',
    'shell': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'text': 'text',
  };
  return map[lang.toLowerCase()] || lang.toLowerCase();
}
