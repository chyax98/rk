'use client';
import { useEffect } from 'react';

interface UseKeyboardOptions {
  menu: any;
  closeMenu: () => void;
  selectionMenu: any;
  clearSelectionMenu: () => void;
  drawerOpen: boolean;
  closeDrawer: () => void;
  outlineOpen: boolean;
  setOutlineOpen: (v: boolean) => void;
  clearSelection: () => void;
}

export function useKeyboard(opts: UseKeyboardOptions) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (opts.menu) opts.closeMenu();
        else if (opts.selectionMenu) opts.clearSelectionMenu();
        else if (opts.drawerOpen) opts.closeDrawer();
        else if (opts.outlineOpen) opts.setOutlineOpen(false);
        else opts.clearSelection();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opts.menu, opts.drawerOpen, opts.outlineOpen, opts.selectionMenu]);
}
