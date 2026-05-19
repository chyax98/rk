import { clearRenderErrors, getRenderErrors, recordRenderError } from '../../../../../lib/store.ts';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const errors = await getRenderErrors(id);
  return Response.json({ ok: true, errors });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const errors = Array.isArray(body) ? body : [body];
    if (errors.length === 0) {
      return Response.json({ ok: true, recorded: 0 });
    }
    const valid = errors.filter(
      (e: unknown) =>
        e &&
        typeof e === 'object' &&
        'engine' in (e as Record<string, unknown>) &&
        'message' in (e as Record<string, unknown>),
    );
    if (valid.length === 0) {
      return Response.json({ ok: false, error: 'No valid errors' }, { status: 400 });
    }
    await recordRenderError(
      id,
      valid as Array<{ engine: string; message: string; anchor?: string }>,
    );
    return Response.json({ ok: true, recorded: valid.length });
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await clearRenderErrors(id);
  return Response.json({ ok: true });
}
