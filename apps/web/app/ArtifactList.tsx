'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { ArtifactMeta, ArtifactSort, ArtifactView } from '@/lib/store.ts';

interface Props {
  initialArtifacts: ArtifactMeta[];
  counts: Record<ArtifactView, number>;
  allTags: string[];
  tagCounts: Record<string, number>;
  view: ArtifactView;
  sort: ArtifactSort;
  q: string;
  tag: string;
}

interface ToastState {
  message: string;
  undo?: () => Promise<void> | void;
  ts: number;
}

const VIEW_LABELS: Record<ArtifactView, string> = {
  active: '主列表',
  archived: '存档',
  test: '测试沙盒',
  deleted: '回收站',
  all: '全部',
};

const SORT_LABELS: Record<ArtifactSort, string> = {
  updated: '最近更新',
  title: '标题字典序',
};

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function startOfWeek(d: Date): number {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function timeBucket(iso: string): { key: string; label: string; order: number } {
  const t = new Date(iso).getTime();
  const now = new Date();
  const sod = startOfDay(now);
  const yod = sod - 86_400_000;
  const sow = startOfWeek(now);
  if (t >= sod) return { key: 'today', label: '今天', order: 0 };
  if (t >= yod) return { key: 'yesterday', label: '昨天', order: 1 };
  if (t >= sow) return { key: 'thisweek', label: '本周', order: 2 };
  return { key: 'earlier', label: '更早', order: 3 };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sod = startOfDay(now);
  const sow = startOfWeek(now);
  const t = d.getTime();
  if (t >= sod || t >= sod - 86_400_000) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  if (t >= sow) {
    return d.toLocaleDateString('zh-CN', { weekday: 'short' });
  }
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

export default function ArtifactList(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [artifacts, setArtifacts] = useState<ArtifactMeta[]>(props.initialArtifacts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);
  const [qInput, setQInput] = useState<string>(props.q);
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local artifacts when server props change (route navigation finishes)
  useEffect(() => {
    setArtifacts(props.initialArtifacts);
    setSelectedIds(new Set());
  }, [props.initialArtifacts]);

  useEffect(() => {
    setQInput(props.q);
  }, [props.q]);

  // ── URL helpers ──
  const buildHref = useCallback(
    (patch: { view?: ArtifactView; sort?: ArtifactSort; q?: string; tag?: string | null }) => {
      const sp = new URLSearchParams();
      const view = patch.view ?? props.view;
      const sort = patch.sort ?? props.sort;
      const q = patch.q ?? props.q;
      const tag = patch.tag === null ? '' : (patch.tag ?? props.tag);
      if (view !== 'active') sp.set('view', view);
      if (sort !== 'updated') sp.set('sort', sort);
      if (q) sp.set('q', q);
      if (tag) sp.set('tag', tag);
      const qs = sp.toString();
      return qs ? `/?${qs}` : '/';
    },
    [props.view, props.sort, props.q, props.tag],
  );

  const pushUrl = useCallback(
    (patch: Parameters<typeof buildHref>[0]) => {
      const href = buildHref(patch);
      startTransition(() => router.push(href));
    },
    [router, buildHref],
  );

  // ── Search: debounce input → URL ──
  useEffect(() => {
    if (qInput === props.q) return;
    const t = setTimeout(() => {
      pushUrl({ q: qInput });
    }, 200);
    return () => clearTimeout(t);
  }, [qInput, props.q, pushUrl]);

  // ── Global keyboard ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if (inField) {
        if (e.key === 'Escape' && document.activeElement === searchRef.current) {
          searchRef.current?.blur();
        }
        return;
      }
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Selection ──
  const allSelected = artifacts.length > 0 && artifacts.every((a) => selectedIds.has(a.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(artifacts.map((a) => a.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Toast ──
  const showToast = useCallback((t: ToastState) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(t);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Bulk actions ──
  const bulkArchive = async (archived: boolean) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setArtifacts((prev) => prev.filter((a) => !ids.includes(a.id)));
    setSelectedIds(new Set());
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/artifacts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived }),
        }),
      ),
    );
    showToast({
      message: `已${archived ? '归档' : '取消归档'} ${ids.length} 项`,
      undo: async () => {
        await Promise.all(
          ids.map((id) =>
            fetch(`/api/artifacts/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ archived: !archived }),
            }),
          ),
        );
        startTransition(() => router.refresh());
      },
      ts: Date.now(),
    });
    startTransition(() => router.refresh());
  };

  const bulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setArtifacts((prev) => prev.filter((a) => !ids.includes(a.id)));
    setSelectedIds(new Set());
    await Promise.all(
      ids.map((id) => fetch(`/api/artifacts/${id}`, { method: 'DELETE' })),
    );
    showToast({
      message: `已删除 ${ids.length} 项`,
      undo: async () => {
        await Promise.all(
          ids.map((id) =>
            fetch(`/api/artifacts/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ restore: true }),
            }),
          ),
        );
        startTransition(() => router.refresh());
      },
      ts: Date.now(),
    });
    startTransition(() => router.refresh());
  };

  const bulkPurge = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (
      !confirm(
        `永久删除 ${ids.length} 项？此操作不可撤销（${VIEW_LABELS[props.view]}里的项目会被彻底清除）。`,
      )
    )
      return;
    setArtifacts((prev) => prev.filter((a) => !ids.includes(a.id)));
    setSelectedIds(new Set());
    await Promise.all(
      ids.map((id) => fetch(`/api/artifacts/${id}?purge=1`, { method: 'DELETE' })),
    );
    showToast({ message: `已永久删除 ${ids.length} 项`, ts: Date.now() });
    startTransition(() => router.refresh());
  };

  const bulkRestore = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setArtifacts((prev) => prev.filter((a) => !ids.includes(a.id)));
    setSelectedIds(new Set());
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/artifacts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restore: true }),
        }),
      ),
    );
    showToast({ message: `已恢复 ${ids.length} 项`, ts: Date.now() });
    startTransition(() => router.refresh());
  };

  // ── Time grouping ──
  const groupedArtifacts = useMemo(() => {
    if (props.sort !== 'updated') return null;
    const groups = new Map<string, { label: string; order: number; items: ArtifactMeta[] }>();
    for (const a of artifacts) {
      const b = timeBucket(a.updatedAt);
      const g = groups.get(b.key) ?? { label: b.label, order: b.order, items: [] };
      g.items.push(a);
      groups.set(b.key, g);
    }
    return [...groups.values()].sort((a, b) => a.order - b.order);
  }, [artifacts, props.sort]);

  // ── Render ──
  return (
    <div className="rk-studio">
      <header className="rk-topbar">
        <a href="/" className="rk-topbar-logo">
          <span className="rk-logo-mark">RK</span>
          <span className="rk-logo-name">RenderKit</span>
        </a>
        <div className="rk-topbar-divider" />

        <div className="rk-search-wrap">
          <input
            ref={searchRef}
            className="rk-search-input"
            type="search"
            placeholder="搜索文档 / 标签…  ( / 或 ⌘K )"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (qInput) {
                  setQInput('');
                } else {
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }
            }}
            spellCheck={false}
          />
          {qInput && (
            <button
              type="button"
              className="rk-search-clear"
              onClick={() => setQInput('')}
              aria-label="清空搜索"
            >
              ×
            </button>
          )}
        </div>

        <div className="rk-topbar-spacer" />

        <select
          className="rk-sort-select"
          value={props.sort}
          onChange={(e) => pushUrl({ sort: e.target.value as ArtifactSort })}
          aria-label="排序"
        >
          {(Object.keys(SORT_LABELS) as ArtifactSort[]).map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>

        <div className="rk-server-status">
          <span className="rk-status-dot" />
          <span>本地运行</span>
        </div>
      </header>

      <div className="rk-app-shell">
        <aside className="rk-sidebar">
          <div className="rk-sidebar-section">
            {(['active', 'test', 'archived', 'deleted'] as ArtifactView[]).map((v) => (
              <a
                key={v}
                href={buildHref({ view: v, tag: null, q: '' })}
                className={`rk-nav-item${props.view === v ? ' is-active' : ''}`}
              >
                <span className="rk-nav-label">{VIEW_LABELS[v]}</span>
                <span className="rk-nav-count">{props.counts[v]}</span>
              </a>
            ))}
          </div>

          {props.allTags.length > 0 && (
            <div className="rk-sidebar-section">
              <div className="rk-sidebar-label">标签</div>
              {props.tag && (
                <a href={buildHref({ tag: null })} className="rk-tag-nav-item is-clear">
                  <span className="rk-tag-nav-name">清除筛选</span>
                </a>
              )}
              {props.allTags.map((t) => (
                <a
                  key={t}
                  href={buildHref({ tag: t })}
                  className={`rk-tag-nav-item${props.tag === t ? ' is-active' : ''}`}
                >
                  <span className="rk-tag-dot" />
                  <span className="rk-tag-nav-name">#{t}</span>
                  <span className="rk-tag-nav-count">{props.tagCounts[t]}</span>
                </a>
              ))}
            </div>
          )}

          <div className="rk-sidebar-footer">
            <code className="rk-sidebar-hint">rk push your-doc.html</code>
          </div>
        </aside>

        <main className="rk-main">
          <div className="rk-main-toolbar">
            <div className="rk-toolbar-left">
              <label className="rk-bulk-toggle">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="全选"
                  disabled={artifacts.length === 0}
                />
                <span className="rk-bulk-toggle-label">
                  {selectedIds.size > 0 ? `已选 ${selectedIds.size}` : `共 ${artifacts.length}`}
                </span>
              </label>

              {selectedIds.size > 0 && (
                <div className="rk-bulk-actions">
                  {props.view === 'deleted' ? (
                    <>
                      <button type="button" onClick={bulkRestore}>恢复</button>
                      <button type="button" className="is-danger" onClick={bulkPurge}>
                        永久删除
                      </button>
                    </>
                  ) : props.view === 'archived' ? (
                    <>
                      <button type="button" onClick={() => bulkArchive(false)}>取消归档</button>
                      <button type="button" className="is-danger" onClick={bulkDelete}>删除</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => bulkArchive(true)}>归档</button>
                      <button type="button" className="is-danger" onClick={bulkDelete}>删除</button>
                    </>
                  )}
                </div>
              )}
            </div>

            {isPending && <span className="rk-toolbar-spinner">加载中…</span>}
          </div>

          <div className="rk-grid-container">
            {artifacts.length === 0 ? (
              <EmptyState view={props.view} hasQ={!!props.q} hasTag={!!props.tag} />
            ) : groupedArtifacts ? (
              groupedArtifacts.map((g) => (
                <section key={g.label} className="rk-time-group">
                  <h3 className="rk-time-group-label">{g.label}</h3>
                  <CardGrid
                    items={g.items}
                    selectedIds={selectedIds}
                    onToggleOne={toggleOne}
                    onAction={(action, id) => handleSingleAction(action, id, props.view, showToast, router, startTransition, setArtifacts)}
                  />
                </section>
              ))
            ) : (
              <CardGrid
                items={artifacts}
                selectedIds={selectedIds}
                onToggleOne={toggleOne}
                onAction={(action, id) => handleSingleAction(action, id, props.view, showToast, router, startTransition, setArtifacts)}
              />
            )}
          </div>
        </main>
      </div>

      {toast && (
        <div className="rk-toast" role="status" aria-live="polite">
          <span className="rk-toast-msg">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              className="rk-toast-undo"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
            >
              撤销
            </button>
          )}
          <button
            type="button"
            className="rk-toast-close"
            onClick={() => setToast(null)}
            aria-label="关闭提示"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  view,
  hasQ,
  hasTag,
}: {
  view: ArtifactView;
  hasQ: boolean;
  hasTag: boolean;
}) {
  if (hasQ || hasTag) {
    return (
      <div className="rk-empty-state">
        <h2 className="rk-empty-title">没有匹配的文档</h2>
        <p className="rk-empty-desc">换个关键词或清除筛选试试</p>
      </div>
    );
  }
  if (view === 'test') {
    return (
      <div className="rk-empty-state">
        <h2 className="rk-empty-title">没有测试文档</h2>
        <p className="rk-empty-desc">push 时 title 前缀 rk-test- 的文档会落在这里</p>
      </div>
    );
  }
  if (view === 'archived') {
    return (
      <div className="rk-empty-state">
        <h2 className="rk-empty-title">没有归档文档</h2>
      </div>
    );
  }
  if (view === 'deleted') {
    return (
      <div className="rk-empty-state">
        <h2 className="rk-empty-title">回收站为空</h2>
        <p className="rk-empty-desc">删除的文档会保留在这里直到永久删除</p>
      </div>
    );
  }
  return (
    <div className="rk-empty-state">
      <h2 className="rk-empty-title">还没有文档</h2>
      <p className="rk-empty-desc">使用 CLI 推送第一个文档</p>
      <code className="rk-empty-code">rk push your-doc.html</code>
    </div>
  );
}

function CardGrid({
  items,
  selectedIds,
  onToggleOne,
  onAction,
}: {
  items: ArtifactMeta[];
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onAction: (action: 'archive' | 'unarchive' | 'delete' | 'restore', id: string) => void;
}) {
  return (
    <div className="rk-card-grid">
      {items.map((a) => (
        <ArtifactCard
          key={a.id}
          artifact={a}
          selected={selectedIds.has(a.id)}
          onToggle={() => onToggleOne(a.id)}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

function ArtifactCard({
  artifact: a,
  selected,
  onToggle,
  onAction,
}: {
  artifact: ArtifactMeta;
  selected: boolean;
  onToggle: () => void;
  onAction: (action: 'archive' | 'unarchive' | 'delete' | 'restore', id: string) => void;
}) {
  const title = a.title || '未命名文档';
  return (
    <a
      href={`/a/${a.id}`}
      className={`rk-card${selected ? ' is-selected' : ''}${a.archived ? ' rk-card--archived' : ''}${a.deletedAt ? ' rk-card--deleted' : ''}`}
      title={a.id}
    >
      <div
        className="rk-card-select"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          aria-label={`选择 ${title}`}
        />
      </div>

      <div className="rk-card-body">
        <h3 className="rk-card-title">{title}</h3>
        {a.tags.length > 0 && (
          <div className="rk-card-tags">
            {a.tags.map((t) => (
              <span key={t} className="rk-card-tag">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="rk-card-footer">
          <span className="rk-card-time">{formatTime(a.updatedAt)}</span>
          <span className="rk-card-rev-badge">v{a.currentRevision}</span>
        </div>
      </div>

      <div
        className="rk-card-actions"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {a.deletedAt ? (
          <button
            type="button"
            className="rk-card-action-btn"
            onClick={() => onAction('restore', a.id)}
            title="恢复"
            aria-label="恢复"
          >
            ↩
          </button>
        ) : (
          <>
            <button
              type="button"
              className="rk-card-action-btn"
              onClick={() => onAction(a.archived ? 'unarchive' : 'archive', a.id)}
              title={a.archived ? '取消归档' : '归档'}
              aria-label={a.archived ? '取消归档' : '归档'}
            >
              {a.archived ? '↩' : '⊟'}
            </button>
            <button
              type="button"
              className="rk-card-action-btn is-danger"
              onClick={() => onAction('delete', a.id)}
              title="删除"
              aria-label="删除"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </a>
  );
}

function handleSingleAction(
  action: 'archive' | 'unarchive' | 'delete' | 'restore',
  id: string,
  view: ArtifactView,
  showToast: (t: ToastState) => void,
  router: ReturnType<typeof useRouter>,
  startTransition: (cb: () => void) => void,
  setArtifacts: (updater: (prev: ArtifactMeta[]) => ArtifactMeta[]) => void,
) {
  if (action === 'archive' || action === 'unarchive') {
    const archived = action === 'archive';
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/artifacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    }).then(() => startTransition(() => router.refresh()));
    showToast({
      message: archived ? '已归档' : '已取消归档',
      undo: async () => {
        await fetch(`/api/artifacts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: !archived }),
        });
        startTransition(() => router.refresh());
      },
      ts: Date.now(),
    });
    return;
  }
  if (action === 'delete') {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/artifacts/${id}`, { method: 'DELETE' }).then(() =>
      startTransition(() => router.refresh()),
    );
    showToast({
      message: '已删除',
      undo: async () => {
        await fetch(`/api/artifacts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restore: true }),
        });
        startTransition(() => router.refresh());
      },
      ts: Date.now(),
    });
    return;
  }
  if (action === 'restore') {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/artifacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    }).then(() => startTransition(() => router.refresh()));
    showToast({ message: '已恢复', ts: Date.now() });
  }
}
