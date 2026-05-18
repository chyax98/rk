/**
 * store + route 深度测试
 * 覆盖 artifact/comment/revision/submission/feedback 关键成功与错误分支。
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';

const testHome = mkdtempSync(join(tmpdir(), 'renderkit-store-routes-'));
process.env.HOME = testHome;

let closeDb: (() => void) | undefined;
let store: typeof import('../apps/web/lib/store.ts');
let artifactsRoute: typeof import('../apps/web/app/api/artifacts/route.ts');
let artifactRoute: typeof import('../apps/web/app/api/artifacts/[id]/route.ts');
let commentsRoute: typeof import('../apps/web/app/api/artifacts/[id]/comments/route.ts');
let commentRoute: typeof import('../apps/web/app/api/artifacts/[id]/comments/[commentId]/route.ts');
let feedbackRoute: typeof import('../apps/web/app/api/artifacts/[id]/feedback/route.ts');
let revisionsRoute: typeof import('../apps/web/app/api/artifacts/[id]/revisions/route.ts');
let revisionsListRoute: typeof import('../apps/web/app/api/artifacts/[id]/revisions/list/route.ts');
let revisionRoute: typeof import('../apps/web/app/api/artifacts/[id]/revisions/[rev]/route.ts');
let submissionsRoute: typeof import('../apps/web/app/api/artifacts/[id]/submissions/route.ts');

async function resetDb() {
  closeDb?.();
  rmSync(join(testHome, '.renderkit'), { recursive: true, force: true });
}

async function jsonOf<T = unknown>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

async function makeArtifact(html = '<h1>Doc</h1><p>Body</p>', file = 'doc.html') {
  const pushed = await store.pushHTML(html, file);
  const artifact = await store.getArtifact(pushed.artifactId);
  assert.ok(artifact, 'artifact should exist');
  return { pushed, artifact };
}

before(async () => {
  ({ closeDb } = await import('../apps/web/lib/db.ts'));
  store = await import('../apps/web/lib/store.ts');
  artifactsRoute = await import('../apps/web/app/api/artifacts/route.ts');
  artifactRoute = await import('../apps/web/app/api/artifacts/[id]/route.ts');
  commentsRoute = await import('../apps/web/app/api/artifacts/[id]/comments/route.ts');
  commentRoute = await import('../apps/web/app/api/artifacts/[id]/comments/[commentId]/route.ts');
  feedbackRoute = await import('../apps/web/app/api/artifacts/[id]/feedback/route.ts');
  revisionsRoute = await import('../apps/web/app/api/artifacts/[id]/revisions/route.ts');
  revisionsListRoute = await import('../apps/web/app/api/artifacts/[id]/revisions/list/route.ts');
  revisionRoute = await import('../apps/web/app/api/artifacts/[id]/revisions/[rev]/route.ts');
  submissionsRoute = await import('../apps/web/app/api/artifacts/[id]/submissions/route.ts');
});

after(async () => {
  await resetDb();
});

beforeEach(async () => {
  await resetDb();
});

describe('store: artifact lifecycle', () => {
  it('listArtifacts/getArtifactMeta/getArtifact 初始为空', async () => {
    assert.deepEqual(await store.listArtifacts(), []);
    assert.equal(await store.getArtifactMeta('missing'), null);
    assert.equal(await store.getArtifact('missing'), null);
  });

  it('pushHTML 创建 artifact 并生成 anchors / revision', async () => {
    const { pushed, artifact } = await makeArtifact('<h1>Alpha</h1><p>Beta</p>', 'alpha.html');
    assert.match(pushed.artifactId, /^art_/);
    assert.equal(pushed.revision, 1);
    assert.equal(artifact.meta.currentRevision, 1);
    assert.equal(artifact.meta.title, 'alpha.html');
    assert.ok((artifact.revision.processedHtml || '').includes('data-rk-anchor'));
    assert.equal(artifact.anchors.length, 2);
  });

  it('同文件二次 push 递增 revision', async () => {
    const first = await store.pushHTML('<h1>V1</h1>', 'same-file.html');
    const second = await store.pushHTML('<h1>V2</h1>', 'same-file.html');
    assert.equal(second.artifactId, first.artifactId);
    assert.equal(second.revision, 2);

    const artifact = await store.getArtifact(first.artifactId);
    assert.equal(artifact?.meta.currentRevision, 2);
    assert.ok((artifact?.revision.processedHtml || '').includes('V2'));
  });

  it('softDeleteArtifact 标记 deleted_at，restoreArtifact 恢复，purgeArtifact 彻底清除', async () => {
    const { pushed, artifact } = await makeArtifact();
    const anchor = artifact.anchors[0].anchor;
    const c = await store.addComment(pushed.artifactId, anchor, 'delete me');
    assert.equal(c.ok, true);
    await store.addFormSubmission(pushed.artifactId, 'Form', [{ name: 'n', label: 'N', value: 1 }]);

    // soft delete keeps related rows
    assert.equal(await store.softDeleteArtifact(pushed.artifactId), true);
    const softDeleted = await store.getArtifactMeta(pushed.artifactId);
    assert.ok(softDeleted?.deletedAt);
    assert.equal((await store.getComments(pushed.artifactId)).length, 1);

    // listArtifacts default view hides deleted
    const activeList = await store.listArtifacts({ view: 'active' });
    assert.equal(activeList.length, 0);
    const deletedList = await store.listArtifacts({ view: 'deleted' });
    assert.equal(deletedList.length, 1);

    // restore
    assert.equal(await store.restoreArtifact(pushed.artifactId), true);
    const restored = await store.getArtifactMeta(pushed.artifactId);
    assert.equal(restored?.deletedAt, null);

    // purge wipes everything
    assert.equal(await store.purgeArtifact(pushed.artifactId), true);
    assert.equal(await store.getArtifact(pushed.artifactId), null);
    assert.deepEqual(await store.getComments(pushed.artifactId), []);
    assert.deepEqual(await store.getFormSubmissions(pushed.artifactId), []);
    assert.equal(await store.purgeArtifact(pushed.artifactId), false);
  });
});

describe('store: comments / feedback / submissions', () => {
  it('addComment 校验 artifact 与 anchor', async () => {
    const missingArtifact = await store.addComment('missing', 'a', 'x');
    assert.deepEqual(missingArtifact, {
      ok: false,
      status: 404,
      error: 'artifact not found',
    });

    const { pushed } = await makeArtifact();
    const missingAnchor = await store.addComment(pushed.artifactId, 'not-exist', 'x');
    assert.deepEqual(missingAnchor, {
      ok: false,
      status: 400,
      error: 'anchor not found',
    });
  });

  it('addComment 规范化 selector 并持久化', async () => {
    const { pushed, artifact } = await makeArtifact(
      '<h1>Selector</h1><p>Body</p>',
      'selector.html',
    );
    const anchor = artifact.anchors[0].anchor;
    const selector = {
      type: 'TextQuoteSelector',
      exact: `  ${'x'.repeat(520)}  `,
      prefix: 'p'.repeat(100),
      suffix: 's'.repeat(100),
    };
    const result = await store.addComment(pushed.artifactId, anchor, 'hello', { selector });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.comment.selector?.exact.length, 500);
    assert.equal(result.comment.selector?.prefix.length, 80);
    assert.equal(result.comment.selector?.suffix.length, 80);

    const comments = await store.getComments(pushed.artifactId);
    assert.equal(comments.length, 1);
    assert.equal(comments[0].anchor, anchor);
    assert.equal(comments[0].text, 'hello');
  });

  it('updateCommentText / updateCommentStatus 覆盖错误与状态切换', async () => {
    const { pushed, artifact } = await makeArtifact();
    const anchor = artifact.anchors[0].anchor;
    const add = await store.addComment(pushed.artifactId, anchor, 'first');
    assert.equal(add.ok, true);
    if (!add.ok) return;

    assert.deepEqual(await store.updateCommentText(pushed.artifactId, add.comment.id, '   '), {
      ok: false,
      status: 400,
      error: 'text required',
    });
    assert.deepEqual(await store.updateCommentText(pushed.artifactId, 'missing', 'x'), {
      ok: false,
      status: 404,
      error: 'comment not found',
    });

    const edited = await store.updateCommentText(pushed.artifactId, add.comment.id, ' edited ');
    assert.equal(edited.ok, true);
    if (edited.ok) assert.equal(edited.comment.text, 'edited');

    const badStatus = await store.updateCommentStatus(
      pushed.artifactId,
      add.comment.id,
      // @ts-expect-error: deliberate bad value
      'bad',
    );
    assert.equal(badStatus.ok, false);
    if (!badStatus.ok) {
      assert.equal(badStatus.status, 400);
      assert.match(badStatus.error, /invalid transition/);
    }
    assert.deepEqual(await store.updateCommentStatus(pushed.artifactId, 'missing', 'resolved'), {
      ok: false,
      status: 404,
      error: 'comment not found',
    });

    const resolved = await store.updateCommentStatus(pushed.artifactId, add.comment.id, 'resolved');
    assert.equal(resolved.ok, true);
    if (resolved.ok) {
      assert.equal(resolved.comment.status, 'resolved');
      assert.equal(resolved.comment.resolvedBy, 'human');
      assert.ok(resolved.comment.resolvedAt);
    }

    const reopened = await store.updateCommentStatus(pushed.artifactId, add.comment.id, 'open');
    assert.equal(reopened.ok, true);
    if (reopened.ok) {
      assert.equal(reopened.comment.status, 'open');
      assert.ok(reopened.comment.reopenedAt);
    }
  });

  it('pushHTML 删除 anchor 后 comment 变 orphaned，feedback 返回 orphaned + submissions', async () => {
    const first = await store.pushHTML('<h1>Keep</h1><p>Drop me</p>', 'orph.html');
    const artifact1 = await store.getArtifact(first.artifactId);
    assert.ok(artifact1);
    const anchor = artifact1.anchors[1].anchor;

    const add = await store.addComment(first.artifactId, anchor, 'watch');
    assert.equal(add.ok, true);
    await store.addFormSubmission(first.artifactId, 'Survey', [
      { name: 'score', label: 'Score', value: 5 },
    ]);

    const second = await store.pushHTML('<h1>Keep</h1>', 'orph.html');
    assert.equal(second.revision, 2);

    const comments = await store.getComments(first.artifactId);
    assert.equal(comments.length, 1);
    assert.equal(comments[0].status, 'orphaned');

    const feedback = await store.getFeedback(first.artifactId);
    assert.ok(feedback);
    assert.equal(feedback.openComments.length, 1);
    assert.equal(feedback.openComments[0].status, 'orphaned');
    assert.equal(feedback.submissions.length, 1);
    assert.equal(feedback.submissions[0].formTitle, 'Survey');
  });
});

describe('routes: artifacts/comments/revisions/submissions/feedback', () => {
  it('artifacts route create + list + detail + delete', async () => {
    const createRes = await artifactsRoute.POST(
      new Request('http://localhost/api/artifacts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          html: '<h1>Route Doc</h1><p>A</p>',
          title: 'route-doc',
        }),
      }),
    );
    assert.equal(createRes.status, 200);
    const created = await jsonOf(createRes);
    assert.equal(created.ok, true);

    const listRes = await artifactsRoute.GET(
      new Request('http://localhost/api/artifacts'),
    );
    const listed = await jsonOf(listRes);
    assert.equal(listed.ok, true);
    assert.equal(listed.artifacts.length, 1);
    assert.equal(listed.counts.active, 1);

    const detailRes = await artifactRoute.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: created.artifactId }),
    });
    const detail = await jsonOf(detailRes);
    assert.equal(detail.ok, true);
    assert.equal(detail.revision, 1);
    assert.equal(detail.anchors.length, 2);
    assert.deepEqual(detail.comments, { open: 0, addressed: 0, resolved: 0, orphaned: 0 });

    // soft delete (default)
    const softRes = await artifactRoute.DELETE(
      new Request(`http://localhost/api/artifacts/${created.artifactId}`),
      { params: Promise.resolve({ id: created.artifactId }) },
    );
    assert.equal(softRes.status, 200);
    assert.deepEqual(await jsonOf(softRes), {
      ok: true,
      artifactId: created.artifactId,
      purged: false,
    });

    // soft-deleted artifact still readable via GET (page handles deletedAt)
    const stillThere = await store.getArtifactMeta(created.artifactId);
    assert.ok(stillThere?.deletedAt);

    // purge query
    const purgeRes = await artifactRoute.DELETE(
      new Request(`http://localhost/api/artifacts/${created.artifactId}?purge=1`),
      { params: Promise.resolve({ id: created.artifactId }) },
    );
    assert.equal(purgeRes.status, 200);
    assert.equal((await jsonOf(purgeRes)).purged, true);

    const missingRes = await artifactRoute.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: created.artifactId }),
    });
    assert.equal(missingRes.status, 404);
  });

  it('comments route 校验 anchor/text/unknown anchor，并支持 patch text/status', async () => {
    const { pushed, artifact } = await makeArtifact(
      '<h1>Comment Route</h1><p>B</p>',
      'comment-route.html',
    );
    const anchor = artifact.anchors[0].anchor;

    const noAnchor = await commentsRoute.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'x' }),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );
    assert.deepEqual(await jsonOf(noAnchor), {
      ok: false,
      error: 'anchor is required',
    });

    const noText = await commentsRoute.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anchor }),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );
    assert.deepEqual(await jsonOf(noText), {
      ok: false,
      error: 'text required',
    });

    const badAnchor = await commentsRoute.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anchor: 'bad-anchor', text: 'x' }),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );
    assert.equal(badAnchor.status, 400);
    assert.deepEqual(await jsonOf(badAnchor), {
      ok: false,
      error: 'anchor not found',
    });

    const ok = await commentsRoute.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anchor, text: 'hello route' }),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );
    const created = await jsonOf(ok);
    assert.equal(created.ok, true);
    assert.equal(created.comment.anchor, anchor);

    const patchMissing = await commentRoute.PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      {
        params: Promise.resolve({
          id: pushed.artifactId,
          commentId: created.comment.id,
        }),
      },
    );
    assert.deepEqual(await jsonOf(patchMissing), {
      ok: false,
      error: 'provide text or status',
    });

    const patchText = await commentRoute.PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'edited route' }),
      }),
      {
        params: Promise.resolve({
          id: pushed.artifactId,
          commentId: created.comment.id,
        }),
      },
    );
    const patchedText = await jsonOf(patchText);
    assert.equal(patchedText.ok, true);
    assert.equal(patchedText.comment.text, 'edited route');

    const patchStatus = await commentRoute.PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      }),
      {
        params: Promise.resolve({
          id: pushed.artifactId,
          commentId: created.comment.id,
        }),
      },
    );
    const patchedStatus = await jsonOf(patchStatus);
    assert.equal(patchedStatus.ok, true);
    assert.equal(patchedStatus.comment.status, 'resolved');
  });

  it('feedback route 404 / ok，submissions route 校验 fields', async () => {
    const missingFeedback = await feedbackRoute.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'missing' }),
    });
    assert.equal(missingFeedback.status, 404);

    const { pushed } = await makeArtifact('<h1>Feedback</h1>', 'feedback.html');
    const badFields = await submissionsRoute.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ formTitle: 'Bad', fields: {} }),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );
    assert.equal(badFields.status, 400);
    assert.deepEqual(await jsonOf(badFields), {
      ok: false,
      error: 'fields must be array',
    });

    const goodFields = await submissionsRoute.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          formTitle: 'Good',
          fields: [{ name: 'a', label: 'A', value: 1 }],
        }),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );
    const submission = await jsonOf(goodFields);
    assert.equal(submission.ok, true);
    assert.match(submission.submissionId, /^sub_/);

    const feedback = await feedbackRoute.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: pushed.artifactId }),
    });
    const json = await jsonOf(feedback);
    assert.equal(json.ok, true);
    assert.equal(json.submissions.length, 1);
    assert.equal(json.submissions[0].formTitle, 'Good');
  });

  it('revisions route 覆盖错误分支、list/detail 与 orphaned', async () => {
    const { pushed, artifact } = await makeArtifact('<h1>Rev 1</h1><p>Gone</p>', 'rev-route.html');
    const removeAnchor = artifact.anchors[1].anchor;
    const add = await store.addComment(pushed.artifactId, removeAnchor, 'to orphan');
    assert.equal(add.ok, true);

    const missingBody = await revisionsRoute.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );
    assert.equal(missingBody.status, 400);

    const missingArtifact = await revisionsRoute.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html: '<h1>x</h1>' }),
      }),
      { params: Promise.resolve({ id: 'missing' }) },
    );
    assert.equal(missingArtifact.status, 404);

    const update = await revisionsRoute.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html: '<h1>Rev 2</h1>' }),
      }),
      { params: Promise.resolve({ id: pushed.artifactId }) },
    );
    const updated = await jsonOf(update);
    assert.equal(updated.ok, true);
    assert.equal(updated.revision, 2);

    const list = await revisionsListRoute.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: pushed.artifactId }),
    });
    const listed = await jsonOf(list);
    assert.equal(listed.ok, true);
    assert.equal(listed.revisions.length, 2);
    assert.equal(listed.revisions[0].revisionNumber, 2);
    assert.equal(listed.revisions[1].revisionNumber, 1);

    const badRev = await revisionRoute.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: pushed.artifactId, rev: 'abc' }),
    });
    assert.equal(badRev.status, 400);

    const missingRev = await revisionRoute.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: pushed.artifactId, rev: '99' }),
    });
    assert.equal(missingRev.status, 404);

    const rev1 = await revisionRoute.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: pushed.artifactId, rev: '1' }),
    });
    const rev1Json = await jsonOf(rev1);
    assert.equal(rev1Json.ok, true);
    assert.ok(rev1Json.processedHtml.includes('Gone'));

    const comments = await store.getComments(pushed.artifactId);
    assert.equal(comments[0].status, 'orphaned');
  });
});
