/**
 * anchor-dedup.test.ts
 * Verify generateAnchorId dedup in processHTML.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { processHTML } from '../apps/web/lib/html-processor.ts';

describe('anchor dedup', () => {
  it('三个相同英文 h2 递增后缀', async () => {
    const r = await processHTML('<h2>Conclusion</h2><h2>Conclusion</h2><h2>Conclusion</h2>');
    assert.equal(r.anchors.length, 3);
    assert.equal(r.anchors[0].anchor, 'h2-conclusion');
    assert.equal(r.anchors[1].anchor, 'h2-conclusion-2');
    assert.equal(r.anchors[2].anchor, 'h2-conclusion-3');
  });

  it('唯一的 h1 不加后缀', async () => {
    const r = await processHTML('<h1>Hello</h1>');
    assert.equal(r.anchors.length, 1);
    assert.equal(r.anchors[0].anchor, 'h1-hello');
  });

  it('两个不同的 h1 各自原样', async () => {
    const r = await processHTML('<h1>One</h1><h1>Two</h1>');
    assert.equal(r.anchors.length, 2);
    assert.equal(r.anchors[0].anchor, 'h1-one');
    assert.equal(r.anchors[1].anchor, 'h1-two');
  });

  it('中文标题走 position fallback 也因 dedup 保持唯一', async () => {
    const r = await processHTML('<h2>结论</h2><h2>结论</h2><h2>结论</h2>');
    assert.equal(r.anchors.length, 3);
    // Chinese chars produce empty slug → ${tag}-${index}; each index is unique so no suffix.
    assert.equal(r.anchors[0].anchor, 'h2-0');
    assert.equal(r.anchors[1].anchor, 'h2-1');
    assert.equal(r.anchors[2].anchor, 'h2-2');
  });
});
