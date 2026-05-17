'use client';
import { useEffect } from 'react';
import type { Comment } from './useComments';

function cssEscape(value: string) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
}

function normalizeSpace(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function overlapScore(text: string, anchor: string, side: 'start' | 'end') {
  if (!anchor) return 0;
  const a = normalizeSpace(anchor);
  const t = normalizeSpace(text);
  if (!a || !t) return 0;
  const max = Math.min(a.length, t.length, 80);
  for (let n = max; n >= 4; n--) {
    const fragment = side === 'end' ? a.slice(-n) : a.slice(0, n);
    const target = side === 'end' ? t.slice(-n) : t.slice(0, n);
    if (fragment === target) return n;
  }
  return 0;
}

function findTextRange(root: HTMLElement, selector: Comment['selector']): Range | null {
  const exact = String(selector?.exact || '').trim();
  if (!exact) return null;
  const prefix = String(selector?.prefix || '');
  const suffix = String(selector?.suffix || '');

  const candidates: { range: Range; node: Text; start: number }[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Text) {
      if (!node.nodeValue?.includes(exact)) return NodeFilter.FILTER_REJECT;
      if ((node.parentElement as HTMLElement)?.closest?.('.rk-block-tools,.rk-comment-card,.rk-context-menu,.rk-selection-menu')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    let start = node.nodeValue!.indexOf(exact);
    while (start >= 0) {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + exact.length);
      candidates.push({ range, node, start });
      start = node.nodeValue!.indexOf(exact, start + exact.length);
    }
  }

  if (!candidates.length) return null;
  if (candidates.length === 1 || (!prefix && !suffix)) return candidates[0].range;

  const scored = candidates.map(candidate => {
    const before = candidate.node.nodeValue!.slice(Math.max(0, candidate.start - 120), candidate.start);
    const after = candidate.node.nodeValue!.slice(candidate.start + exact.length, candidate.start + exact.length + 120);
    return { ...candidate, score: overlapScore(before, prefix, 'end') + overlapScore(after, suffix, 'start') };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].range;
}

function ensureHighlightStyle() {
  if (document.getElementById('rk-comment-highlight-style')) return;
  const style = document.createElement('style');
  style.id = 'rk-comment-highlight-style';
  style.textContent = '::highlight(rk-comment-quotes){background:rgba(255,214,102,.55);color:inherit;}';
  document.head.appendChild(style);
}

function clearCommentHighlights() {
  try { (CSS as any).highlights?.delete?.('rk-comment-quotes'); } catch {}
}

function applyCommentHighlights(comments: Comment[]) {
  ensureHighlightStyle();
  clearCommentHighlights();
  if (typeof window === 'undefined' || !(CSS as any).highlights || typeof (globalThis as any).Highlight === 'undefined') return;
  const ranges: Range[] = [];
  for (const comment of comments || []) {
    if (comment.status !== 'open' || !comment.selector?.exact) continue;
    const block = document.querySelector(`[data-block-id="${cssEscape(comment.blockId)}"]`) as HTMLElement | null;
    const range = block ? findTextRange(block, comment.selector) : null;
    if (range) ranges.push(range);
  }
  if (ranges.length) (CSS as any).highlights.set('rk-comment-quotes', new (globalThis as any).Highlight(...ranges));
}

export function useHighlights(comments: Comment[]) {
  useEffect(() => {
    applyCommentHighlights(comments);
    return () => clearCommentHighlights();
  }, [comments]);
}
