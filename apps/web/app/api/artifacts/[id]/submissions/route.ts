import { addFormSubmission } from '../../../../../lib/store.ts';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { formTitle?: string; fields?: unknown };
  const formTitle = typeof body.formTitle === 'string' ? body.formTitle : '';
  const fields = body.fields ?? [];

  if (!Array.isArray(fields)) {
    return Response.json({ ok: false, error: 'fields must be array' }, { status: 400 });
  }

  try {
    const result = await addFormSubmission(id, formTitle, fields);
    return Response.json({ ok: true, submissionId: result.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'internal error';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
