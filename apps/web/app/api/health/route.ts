export async function GET() {
  return Response.json({ ok: true, name: 'renderkit', version: '0.0.2-alpha.0' });
}
