'use client';
import { useState, useCallback } from 'react';

export interface QuoteAnchor {
  blockId: string;
  selector: { type: string; exact: string; prefix: string; suffix: string };
}

export interface SelectionMenuState {
  x: number;
  y: number;
  blockId: string;
}

export function useSelection() {
  const [quoteAnchor, setQuoteAnchor] = useState<QuoteAnchor | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState | null>(null);

  const captureSelection = useCallback(() => {
    const selection = window.getSelection?.();
    if (!selection) { setSelectionMenu(null); return; }
    const exact = selection.toString?.().trim();
    if (!exact || exact.length < 2) { setSelectionMenu(null); return; }

    const range = selection.rangeCount ? selection.getRangeAt(0) : null;
    const container = range?.commonAncestorContainer?.nodeType === (Node as any).ELEMENT_NODE
      ? range.commonAncestorContainer as HTMLElement
      : (range?.commonAncestorContainer as HTMLElement)?.parentElement;
    const el = container?.closest?.('[data-block-id]');
    if (!el) { setSelectionMenu(null); return; }

    const blockId = el.getAttribute('data-block-id')!;
    let prefix = '';
    let suffix = '';
    try {
      const preRange = document.createRange();
      preRange.setStart(el, 0);
      preRange.setEnd(range!.startContainer, range!.startOffset);
      prefix = preRange.toString().slice(-80);
      const postRange = document.createRange();
      postRange.setStart(range!.endContainer, range!.endOffset);
      postRange.setEnd(el, el.childNodes.length);
      suffix = postRange.toString().slice(0, 80);
    } catch {
      const blockText = (el as HTMLElement).innerText || '';
      const start = blockText.indexOf(exact);
      prefix = start > 0 ? blockText.slice(Math.max(0, start - 80), start) : '';
      suffix = start >= 0 ? blockText.slice(start + exact.length, start + exact.length + 80) : '';
    }

    const selector = {
      type: 'TextQuoteSelector',
      exact: exact.slice(0, 500),
      prefix,
      suffix,
    };
    const rect = range!.getBoundingClientRect();
    setQuoteAnchor({ blockId, selector });
    setSelectionMenu({
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 220),
      y: Math.max(16, rect.top - 48),
      blockId,
    });
  }, []);

  const clearSelectionMenu = useCallback(() => setSelectionMenu(null), []);
  const clearQuoteAnchor = useCallback(() => {
    setQuoteAnchor(null);
    setSelectionMenu(null);
  }, []);

  return {
    quoteAnchor, setQuoteAnchor,
    selectionMenu, setSelectionMenu,
    captureSelection, clearSelectionMenu, clearQuoteAnchor,
  };
}
