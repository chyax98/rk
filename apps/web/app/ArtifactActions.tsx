'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  artifactId: string;
  archived: boolean;
}

export default function ArtifactActions({ artifactId, archived }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleArchive(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    await fetch(`/api/artifacts/${artifactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !archived }),
    });
    router.refresh();
    setBusy(false);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    if (!confirm('删除此文档？此操作不可撤销。')) return;
    setBusy(true);
    await fetch(`/api/artifacts/${artifactId}`, { method: 'DELETE' });
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="rk-artifact-actions">
      <button
        type="button"
        className="rk-artifact-action-btn"
        onClick={handleArchive}
        disabled={busy}
        title={archived ? '取消归档' : '归档'}
        aria-label={archived ? '取消归档' : '归档'}
      >
        {archived ? '↩' : '⊟'}
      </button>
      <button
        type="button"
        className="rk-artifact-action-btn rk-artifact-action-btn--danger"
        onClick={handleDelete}
        disabled={busy}
        title="删除"
        aria-label="删除"
      >
        ✕
      </button>
    </div>
  );
}
