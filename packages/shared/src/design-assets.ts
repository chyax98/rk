export type DesignResourcePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type DesignResourceIntegrationStatus =
  | 'partially-integrated'
  | 'spec-integrated'
  | 'documented-not-bundled'
  | 'mapped-to-tokens'
  | 'researched-future-surface';

export interface DesignResource {
  id: string;
  priority: DesignResourcePriority;
  repo: string;
  url: string;
  localPath: string;
  commit: string;
  primaryValue: string;
  integrationStatus: DesignResourceIntegrationStatus;
  adoptedIn: readonly string[];
  recommendedUse: readonly string[];
  risks: readonly string[];
}

export const DESIGN_RESOURCES: readonly DesignResource[] = Object.freeze([
  {
    id: 'md2html',
    priority: 'P0',
    repo: 'haidang1810/md2html',
    url: 'https://github.com/haidang1810/md2html.git',
    localPath: 'research/design-assets/external-repos/md2html',
    commit: '82fa59c',
    primaryValue: '阅读优先文档排版、目录、打印、无障碍、组件目录。',
    integrationStatus: 'partially-integrated',
    adoptedIn: ['Pass 10 reading/print/a11y CSS', 'verify:browser skip-link assertions'],
    recommendedUse: ['long-form reading layout', 'print stylesheet', 'accessibility and content rhythm'],
    risks: ['不要引入完整模板运行时；只吸收 deterministic CSS/token/structure。'],
  },
  {
    id: 'html-anything',
    priority: 'P0',
    repo: 'nexu-io/html-anything',
    url: 'https://github.com/nexu-io/html-anything.git',
    localPath: 'research/design-assets/external-repos/html-anything',
    commit: 'b9f2002',
    primaryValue: '共享反 slop 设计指令、skill/recipe 目录约定、示例模板库。',
    integrationStatus: 'partially-integrated',
    adoptedIn: ['Pass 9 authoring directives', 'renderkit-authoring skill design-quality directives'],
    recommendedUse: ['Agent authoring rules', 'recipe folder discipline', 'anti-placeholder quality gates'],
    risks: ['不要变成 prompt-only HTML generator；RenderKit 仍以 .rk.md block DSL 为主。'],
  },
  {
    id: 'fireworks-tech-graph',
    priority: 'P1',
    repo: 'yizhiyanhua-ai/fireworks-tech-graph',
    url: 'https://github.com/yizhiyanhua-ai/fireworks-tech-graph.git',
    localPath: 'research/design-assets/external-repos/fireworks-tech-graph',
    commit: '9e68925',
    primaryValue: '图表语义形状、箭头语义、7 种风格、SVG 布局规则。',
    integrationStatus: 'spec-integrated',
    adoptedIn: ['Pass 8 diagram visual language', 'examples/capabilities/diagram-visual-language.rk.md'],
    recommendedUse: ['architecture diagrams', 'semantic arrow vocabulary', 'Notion-clean diagram style'],
    risks: ['不要引入不受控 SVG 生成器；保持 sanitizer 和 local-first renderer。'],
  },
  {
    id: 'thesvg',
    priority: 'P1',
    repo: 'glincker/thesvg',
    url: 'https://github.com/glincker/thesvg.git',
    localPath: 'research/design-assets/external-repos/thesvg',
    commit: '955931d3',
    primaryValue: '6,030+ 品牌/云 SVG 图标、变体、CDN/包模式。',
    integrationStatus: 'documented-not-bundled',
    adoptedIn: ['design resource manifest', 'diagram/icon source planning'],
    recommendedUse: ['future icon helper', 'cloud/service diagram labels', 'brand icon metadata reference'],
    risks: ['商标许可和品牌使用规则必须保留元数据；不要直接 vendoring 大型图标库。'],
  },
  {
    id: 'ui-ux-pro-max-skill',
    priority: 'P1',
    repo: 'nextlevelbuilder/ui-ux-pro-max-skill',
    url: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git',
    localPath: 'research/design-assets/external-repos/ui-ux-pro-max-skill',
    commit: 'b7e3af8',
    primaryValue: '设计智能数据库、配色/排版/UX 规则、字体和调色参考。',
    integrationStatus: 'mapped-to-tokens',
    adoptedIn: ['renderkit-1.0-design-token-source-map.md', 'shared design resource CLI'],
    recommendedUse: ['token naming review', 'palette/typography guidance', 'future design recommend command'],
    risks: ['避免把大量设计 DB 直接塞进 runtime；应抽象为小型 deterministic recommendations。'],
  },
  {
    id: 'guizang-ppt-skill',
    priority: 'P2',
    repo: 'op7418/guizang-ppt-skill',
    url: 'https://github.com/op7418/guizang-ppt-skill.git',
    localPath: 'research/design-assets/external-repos/guizang-ppt-skill',
    commit: '3d87acc',
    primaryValue: '演示/幻灯片视觉系统、横向翻页网页 PPT、锁定布局纪律。',
    integrationStatus: 'researched-future-surface',
    adoptedIn: ['renderkit-1.0-guizang-deck-surface-research.md'],
    recommendedUse: ['future surface: deck', 'locked layout validation', 'presentation-specific visual rhythm'],
    risks: ['当前 RenderKit 范围是文档阅读/评论；deck surface 只能作为 future opt-in。'],
  },
]);

const RESOURCE_BY_ID = new Map<string, DesignResource>(DESIGN_RESOURCES.map(resource => [resource.id, resource]));
const PRIORITY_ORDER: DesignResourcePriority[] = ['P0', 'P1', 'P2', 'P3'];

export function listDesignResources({ priority }: { priority?: DesignResourcePriority } = {}): DesignResource[] {
  return DESIGN_RESOURCES
    .filter(resource => !priority || resource.priority === priority)
    .slice()
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) || a.id.localeCompare(b.id));
}

export function getDesignResource(id: string): DesignResource | null {
  return RESOURCE_BY_ID.get(id) || null;
}

export function listDesignResourcePriorities(): DesignResourcePriority[] {
  return [...new Set(DESIGN_RESOURCES.map(resource => resource.priority))].sort((a, b) => PRIORITY_ORDER.indexOf(a) - PRIORITY_ORDER.indexOf(b)) as DesignResourcePriority[];
}
