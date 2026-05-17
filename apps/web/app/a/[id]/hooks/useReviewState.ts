'use client';
import { useState, useCallback } from 'react';

export type DrawerMode = 'comments' | 'block' | 'agent' | 'comment';

export function useReviewState() {
  const [reviewMode, setReviewMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('comments');
  const [selected, setSelected] = useState<string | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);

  const openDrawer = useCallback(
    (mode: DrawerMode, blockId?: string | null) => {
      if (blockId) setSelected(blockId);
      setReviewMode(true);
      setDrawerMode(mode);
      setDrawerOpen(true);
    },
    [],
  );

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return {
    reviewMode, setReviewMode,
    drawerOpen, setDrawerOpen,
    drawerMode, setDrawerMode,
    selected, setSelected,
    outlineOpen, setOutlineOpen,
    openDrawer, closeDrawer,
  };
}
