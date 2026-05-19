import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatFeedbackMarkdown } from '../packages/cli/src/utils.mjs';

describe('CLI feedback markdown formatting', () => {
  it('renders thread-folded v2 feedback instead of legacy openComments', () => {
    const markdown = formatFeedbackMarkdown(
      {
        artifactId: 'art_123',
        currentRevision: 7,
        url: '/a/art_123',
        comments: [
          {
            id: 'cmt_root',
            anchor: 'h1-1',
            text: '请补一行说明',
            author: 'human',
            status: 'addressed',
            createdAt: '2026-05-18T08:00:00.000Z',
            waitingFor: 'human',
            replies: [
              {
                id: 'cmt_reply',
                author: 'agent',
                text: '已补充',
                createdAt: '2026-05-18T08:05:00.000Z',
              },
            ],
          },
        ],
      },
      'https://diagram.example.com',
    );

    assert.match(markdown, /artifactId: art_123/);
    assert.match(markdown, /## 待处理 Threads（1 条）/);
    assert.match(markdown, /### cmt_root · h1-1/);
    assert.match(markdown, /- \*\*等待方\*\*: human/);
    assert.match(markdown, /- \*\*回复数\*\*: 1/);
    assert.match(markdown, /cmt_reply · agent · 2026-05-18T08:05:00.000Z · 已补充/);
    assert.doesNotMatch(markdown, /openComments/);
  });
});
