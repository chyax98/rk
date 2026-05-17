import { useMemo, useState } from 'react';
import RenderBlock from './RenderBlock';

interface TabDef {
  id: string;
  label?: string;
  blocks?: Array<{ id: string; type: string; props: Record<string, unknown>; [k: string]: unknown }>;
}

interface TabsBlockProps {
  title?: string;
  tabs?: TabDef[];
}

export default function TabsBlock({ title, tabs = [] }: TabsBlockProps) {
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  const [activeId, setActiveId] = useState(safeTabs[0]?.id || '');
  const active = useMemo(() => safeTabs.find(tab => tab.id === activeId) || safeTabs[0], [safeTabs, activeId]);

  if (!safeTabs.length) return <div className="rk-error-box">Tabs block requires at least one tab.</div>;

  return (
    <section className="rk-tabs-block">
      {title && <div className="rk-tabs-title">{title}</div>}
      <div className="rk-tabs-list" role="tablist" aria-label={title || 'Tabbed content'}>
        {safeTabs.map(tab => (
          <button
            key={tab.id}
            id={`rk-tab-${tab.id}`}
            role="tab"
            aria-selected={active?.id === tab.id}
            aria-controls={`rk-tab-panel-${tab.id}`}
            className={active?.id === tab.id ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label || tab.id}
          </button>
        ))}
      </div>
      <div className="rk-tabs-panel" id={`rk-tab-panel-${active?.id}`} role="tabpanel" aria-labelledby={`rk-tab-${active?.id}`}>
        {(active?.blocks || []).map((b) => <RenderBlock key={b.id} block={b} />)}
      </div>
    </section>
  );
}
