'use client';
import { useCallback, useState } from 'react';

export type DrawerMode = 'comments' | 'block' | 'agent' | 'comment';

export interface MenuState {
  x: number;
  y: number;
  blockId: string;
}

export function useReviewState() {
  const [reviewMode, setReviewMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('comments');
  const [selected, setSelected] = useState<string | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);

  const openDrawer = useCallback((mode: DrawerMode, blockId?: string | null) => {
    if (blockId) setSelected(blockId);
    setReviewMode(true);
    setDrawerMode(mode);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleDrawerMode = useCallback((m: DrawerMode) => setDrawerMode(m), []);

  const openMenu = useCallback(
    (e: React.MouseEvent, blockId: string) => {
      if (!reviewMode) return;
      e.preventDefault();
      e.stopPropagation();
      setSelected(blockId);
      setMenu({ x: e.clientX || 260, y: e.clientY || 160, blockId });
    },
    [reviewMode, setSelected],
  );

  return {
    reviewMode,
    setReviewMode,
    drawerOpen,
    setDrawerOpen,
    drawerMode,
    setDrawerMode,
    selected,
    setSelected,
    outlineOpen,
    setOutlineOpen,
    menu,
    setMenu,
    openMenu,
    openDrawer,
    closeDrawer,
    handleDrawerMode,
  };
}
