const DESIGN_RESOURCES = Object.freeze([
  {
    id: "md2html",
    priority: "P0",
    repo: "haidang1810/md2html",
    url: "https://github.com/haidang1810/md2html.git",
    localPath: "research/design-assets/external-repos/md2html",
    commit: "82fa59c",
    primaryValue: "\u9605\u8BFB\u4F18\u5148\u6587\u6863\u6392\u7248\u3001\u76EE\u5F55\u3001\u6253\u5370\u3001\u65E0\u969C\u788D\u3001\u7EC4\u4EF6\u76EE\u5F55\u3002",
    integrationStatus: "partially-integrated",
    adoptedIn: ["Pass 10 reading/print/a11y CSS", "verify:browser skip-link assertions"],
    recommendedUse: ["long-form reading layout", "print stylesheet", "accessibility and content rhythm"],
    risks: ["\u4E0D\u8981\u5F15\u5165\u5B8C\u6574\u6A21\u677F\u8FD0\u884C\u65F6\uFF1B\u53EA\u5438\u6536 deterministic CSS/token/structure\u3002"]
  },
  {
    id: "html-anything",
    priority: "P0",
    repo: "nexu-io/html-anything",
    url: "https://github.com/nexu-io/html-anything.git",
    localPath: "research/design-assets/external-repos/html-anything",
    commit: "b9f2002",
    primaryValue: "\u5171\u4EAB\u53CD slop \u8BBE\u8BA1\u6307\u4EE4\u3001skill/recipe \u76EE\u5F55\u7EA6\u5B9A\u3001\u793A\u4F8B\u6A21\u677F\u5E93\u3002",
    integrationStatus: "partially-integrated",
    adoptedIn: ["Pass 9 authoring directives", "renderkit-authoring skill design-quality directives"],
    recommendedUse: ["Agent authoring rules", "recipe folder discipline", "anti-placeholder quality gates"],
    risks: ["\u4E0D\u8981\u53D8\u6210 prompt-only HTML generator\uFF1BRenderKit \u4ECD\u4EE5 .rk.md block DSL \u4E3A\u4E3B\u3002"]
  },
  {
    id: "fireworks-tech-graph",
    priority: "P1",
    repo: "yizhiyanhua-ai/fireworks-tech-graph",
    url: "https://github.com/yizhiyanhua-ai/fireworks-tech-graph.git",
    localPath: "research/design-assets/external-repos/fireworks-tech-graph",
    commit: "9e68925",
    primaryValue: "\u56FE\u8868\u8BED\u4E49\u5F62\u72B6\u3001\u7BAD\u5934\u8BED\u4E49\u30017 \u79CD\u98CE\u683C\u3001SVG \u5E03\u5C40\u89C4\u5219\u3002",
    integrationStatus: "spec-integrated",
    adoptedIn: ["Pass 8 diagram visual language", "examples/capabilities/diagram-visual-language.rk.md"],
    recommendedUse: ["architecture diagrams", "semantic arrow vocabulary", "Notion-clean diagram style"],
    risks: ["\u4E0D\u8981\u5F15\u5165\u4E0D\u53D7\u63A7 SVG \u751F\u6210\u5668\uFF1B\u4FDD\u6301 sanitizer \u548C local-first renderer\u3002"]
  },
  {
    id: "thesvg",
    priority: "P1",
    repo: "glincker/thesvg",
    url: "https://github.com/glincker/thesvg.git",
    localPath: "research/design-assets/external-repos/thesvg",
    commit: "955931d3",
    primaryValue: "6,030+ \u54C1\u724C/\u4E91 SVG \u56FE\u6807\u3001\u53D8\u4F53\u3001CDN/\u5305\u6A21\u5F0F\u3002",
    integrationStatus: "documented-not-bundled",
    adoptedIn: ["design resource manifest", "diagram/icon source planning"],
    recommendedUse: ["future icon helper", "cloud/service diagram labels", "brand icon metadata reference"],
    risks: ["\u5546\u6807\u8BB8\u53EF\u548C\u54C1\u724C\u4F7F\u7528\u89C4\u5219\u5FC5\u987B\u4FDD\u7559\u5143\u6570\u636E\uFF1B\u4E0D\u8981\u76F4\u63A5 vendoring \u5927\u578B\u56FE\u6807\u5E93\u3002"]
  },
  {
    id: "ui-ux-pro-max-skill",
    priority: "P1",
    repo: "nextlevelbuilder/ui-ux-pro-max-skill",
    url: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git",
    localPath: "research/design-assets/external-repos/ui-ux-pro-max-skill",
    commit: "b7e3af8",
    primaryValue: "\u8BBE\u8BA1\u667A\u80FD\u6570\u636E\u5E93\u3001\u914D\u8272/\u6392\u7248/UX \u89C4\u5219\u3001\u5B57\u4F53\u548C\u8C03\u8272\u53C2\u8003\u3002",
    integrationStatus: "mapped-to-tokens",
    adoptedIn: ["renderkit-1.0-design-token-source-map.md", "shared design resource CLI"],
    recommendedUse: ["token naming review", "palette/typography guidance", "future design recommend command"],
    risks: ["\u907F\u514D\u628A\u5927\u91CF\u8BBE\u8BA1 DB \u76F4\u63A5\u585E\u8FDB runtime\uFF1B\u5E94\u62BD\u8C61\u4E3A\u5C0F\u578B deterministic recommendations\u3002"]
  },
  {
    id: "guizang-ppt-skill",
    priority: "P2",
    repo: "op7418/guizang-ppt-skill",
    url: "https://github.com/op7418/guizang-ppt-skill.git",
    localPath: "research/design-assets/external-repos/guizang-ppt-skill",
    commit: "3d87acc",
    primaryValue: "\u6F14\u793A/\u5E7B\u706F\u7247\u89C6\u89C9\u7CFB\u7EDF\u3001\u6A2A\u5411\u7FFB\u9875\u7F51\u9875 PPT\u3001\u9501\u5B9A\u5E03\u5C40\u7EAA\u5F8B\u3002",
    integrationStatus: "researched-future-surface",
    adoptedIn: ["renderkit-1.0-guizang-deck-surface-research.md"],
    recommendedUse: ["future surface: deck", "locked layout validation", "presentation-specific visual rhythm"],
    risks: ["\u5F53\u524D RenderKit \u8303\u56F4\u662F\u6587\u6863\u9605\u8BFB/\u8BC4\u8BBA\uFF1Bdeck surface \u53EA\u80FD\u4F5C\u4E3A future opt-in\u3002"]
  }
]);
const RESOURCE_BY_ID = new Map(DESIGN_RESOURCES.map((resource) => [resource.id, resource]));
const PRIORITY_ORDER = ["P0", "P1", "P2", "P3"];
function listDesignResources({ priority } = {}) {
  return DESIGN_RESOURCES.filter((resource) => !priority || resource.priority === priority).slice().sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) || a.id.localeCompare(b.id));
}
function getDesignResource(id) {
  return RESOURCE_BY_ID.get(id) || null;
}
function listDesignResourcePriorities() {
  return [...new Set(DESIGN_RESOURCES.map((resource) => resource.priority))].sort((a, b) => PRIORITY_ORDER.indexOf(a) - PRIORITY_ORDER.indexOf(b));
}
export {
  DESIGN_RESOURCES,
  getDesignResource,
  listDesignResourcePriorities,
  listDesignResources
};
