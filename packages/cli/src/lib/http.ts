export function getEndpoint(): string {
  return process.env.RENDERKIT_ENDPOINT || 'http://localhost:3737';
}
