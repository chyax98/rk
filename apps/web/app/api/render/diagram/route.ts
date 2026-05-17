import { spawn } from 'node:child_process';
import { join } from 'node:path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let payload;
  try { payload = await req.json(); }
  catch { return json({ ok: false, error: 'Invalid JSON body' }, 400); }

  const engine = String(payload?.engine || '').toLowerCase();
  const code = String(payload?.code || '');
  if (!code.trim()) return json({ ok: false, error: 'Missing diagram code' }, 400);

  try {
    if (engine === 'd2') return json({ ok: true, engine, svg: sanitizeSvg(await renderD2(code)) });
    if (engine === 'plantuml') return json({ ok: true, engine, svg: sanitizeSvg(await renderPlantUML(code)) });
    return json({ ok: false, error: `Unsupported server diagram engine: ${engine}` }, 400);
  } catch (e: any) {
    return json({ ok: false, engine, error: String(e?.message || e) }, 200);
  }
}

async function renderD2(code: string) {
  const { D2 } = await import('@terrastruct/d2');
  const d2 = new D2();
  const result = await d2.compile(code, { layout: 'dagre' });
  return await d2.render(result.diagram, { ...result.renderOptions, noXMLTag: true, pad: 32 });
}

async function renderPlantUML(code: string) {
  const jar = join(process.cwd(), 'node_modules', 'plantuml', 'vendor', 'plantuml.jar');
  return await new Promise<string>((resolve, reject) => {
    const child = spawn('java', ['-jar', '-Djava.awt.headless=true', jar, '-tsvg', '-pipe'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code: number | null) => {
      if (code !== 0) reject(new Error(stderr || `PlantUML exited ${code}`));
      else if (!stdout.trim()) reject(new Error(stderr || 'PlantUML returned empty SVG'));
      else resolve(stdout);
    });
    child.stdin.end(code);
  });
}

function sanitizeSvg(svg: string) {
  let s = String(svg || '').trim().replace(/^<\?xml[\s\S]*?\?>\s*/i, '');
  const start = s.search(/<svg[\s>]/i);
  if (start > 0) s = s.slice(start);
  if (!/^<svg[\s>]/i.test(s)) return '';
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}

function json(data: any, status = 200) {
  return Response.json(data, { status });
}
