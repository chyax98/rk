/**
 * anchor 命名统一测试
 * 验证评论 API 只接受 anchor；验证 anchor 删除后评论会变 orphaned。
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const testHome = mkdtempSync(join(tmpdir(), 'renderkit-anchor-test-'));
process.env.HOME = testHome;

let closeDb: (() => void) | undefined;
let pushHTML: ((rawHtml: string, file?: string) => Promise<{ artifactId: string }>) | undefined;
let getArtifact:
  | ((id: string) => Promise<{
      anchors: Array<{ anchor: string }>;
      comments: Array<{ status: string }>;
    } | null>)
  | undefined;
let getComments:
  | ((artifactId: string) => Promise<Array<{ anchor: string; status: string }>>)
  | undefined;
let addComment:
  | ((
      artifactId: string,
      anchor: string,
      text: string,
    ) => Promise<{ ok: true; comment: { anchor: string } } | { ok: false; error: string }>)
  | undefined;
let commentRoutePost:
  | ((req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>)
  | undefined;

before(async () => {
  ({ closeDb } = await import('../apps/web/lib/db.ts'));
  ({ pushHTML, getArtifact, getComments, addComment } = await import('../apps/web/lib/store.ts'));
  ({ POST: commentRoutePost } = await import(
    '../apps/web/app/api/artifacts/[id]/comments/route.ts'
  ));
});

after(() => {
  closeDb?.();
  rmSync(testHome, { recursive: true, force: true });
});

describe('comment anchor contract', () => {
  it('comments route accepts anchor, rejects legacy request key', async () => {
    const pushed = await pushHTML('<h1>Anchor API</h1><p>body</p>', 'anchor-api.html');
    const artifact = await getArtifact(pushed.artifactId);
    assert.ok(artifact);
    const anchor = artifact.anchors[0]?.anchor;
    assert.ok(anchor, 'should have anchor');

    const okRes = await commentRoutePost(
      new Request('http://localhost/api/artifacts/x/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anchor, text: 'new comment' }),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );
    assert.equal(okRes.status, 200);
    const okJson = await okRes.json();
    assert.equal(okJson.ok, true);
    assert.equal(okJson.comment.anchor, anchor);

    const legacyRes = await commentRoutePost(
      new Request('http://localhost/api/artifacts/x/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ['block' + 'Id']: anchor, text: 'legacy comment' }),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );

    const legacyJson = await legacyRes.json();
    assert.deepEqual(legacyJson, { ok: false, error: 'anchor is required' });
  });

  it('removed anchor marks open comments orphaned', async () => {
    assert.ok(pushHTML && getArtifact && getComments && addComment);

    const file = 'anchor-orphaned.html';
    const first = await pushHTML('<h1>First Title</h1><p>same body</p>', file);
    const artifact1 = await getArtifact(first.artifactId);
    assert.ok(artifact1);
    const anchor = artifact1.anchors[0]?.anchor;
    assert.ok(anchor, 'should have anchor before update');

    const addResult = await addComment(first.artifactId, anchor, 'watch this anchor');
    assert.equal(addResult.ok, true);

    await pushHTML('<h1>Second Title</h1><p>same body</p>', file);
    const comments = await getComments(first.artifactId);
    assert.equal(comments.length, 1);
    assert.equal(comments[0].anchor, anchor);
    assert.equal(comments[0].status, 'orphaned');
  });
});
