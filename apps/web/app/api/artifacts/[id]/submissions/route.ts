import { addFormSubmission } from '../../../../../lib/store.ts';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { formTitle = '', fields = [] } = body;

  if (!Array.isArray(fields)) {
    return Response.json({ ok: false, error: 'fields must be array' }, { status: 400 });
  }

  try {
    const result = await addFormSubmission(id, formTitle, fields);
    return Response.json({ ok: true, submissionId: result.id });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
