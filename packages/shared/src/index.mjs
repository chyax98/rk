import { listDesignResources } from "./design-assets.mjs";
import { BLOCK_ALIASES } from "./contracts.mjs";
export * from "./contracts.mjs";
export * from "./design-assets.mjs";
const RK_VERSION = "1.0";
const DEFAULT_PORT = 3737;
const DEFAULT_ENDPOINT = "http://localhost:3737";
const RECIPES = {
  "engineering-plan": {
    label: "Engineering Plan",
    description: "Structured technical proposal for refactors, migrations, or new features. Dense, reviewable, decision-anchored.",
    recommendedTheme: "paper-light",
    recommendedBlocks: ["summary", "stat", "checklist", "callout", "decision-card", "code", "diagram", "image", "table", "tabs", "grid", "comparison", "timeline"],
    structure: [
      "Front-matter with title, theme, surface.",
      "Executive summary block.",
      "Decision cards for each major choice.",
      "Code blocks for interface changes or CLI usage.",
      "Diagram for architecture or flow.",
      "Callouts for risks, assumptions, and open questions."
    ],
    antiPatterns: [
      "Long paragraphs \u2014 use summary blocks instead.",
      "Decisions without alternatives \u2014 always show what was rejected and why.",
      "Missing diagram for multi-component changes.",
      "Using dark-pro as the default \u2014 keep normal review documents light unless a stakeholder explicitly requests dark mode."
    ]
  },
  "decision-brief": {
    label: "Decision Brief",
    description: "Focused decision document: one question, one chosen path, rationale, and alternatives. Minimal prose.",
    recommendedTheme: "paper-light",
    recommendedBlocks: ["summary", "decision-card", "callout", "comparison"],
    structure: [
      "Front-matter with title and surface.",
      "Summary block framing the decision context.",
      "One or more decision-card blocks with question, chosen, rationale, and alternatives.",
      "Callouts for blockers, dependencies, or escalation notes."
    ],
    antiPatterns: [
      "More than 3 decision cards \u2014 split into separate briefs or use engineering-plan.",
      "Omitting alternatives \u2014 a brief without alternatives is an announcement, not a decision.",
      "Code blocks \u2014 usually irrelevant to a pure decision. Use engineering-plan instead."
    ]
  },
  "review-report": {
    label: "Review Report",
    description: "Audit or code review findings. Finding per callout, severity-driven, actionable.",
    recommendedTheme: "paper-light",
    recommendedBlocks: ["summary", "callout", "code", "table", "checklist"],
    structure: [
      "Front-matter with title, theme (paper-light recommended), surface.",
      "Summary block with scope and top-line findings.",
      "Callout blocks per finding, tone mapped to severity (danger \u2192 critical, warning \u2192 medium, info \u2192 low).",
      "Code blocks showing problematic or recommended patterns."
    ],
    antiPatterns: [
      "Using dark-pro for long review reports \u2014 paper-light is easier to read at length.",
      "Findings without code snippets \u2014 show the exact code, not descriptions of it.",
      "Mixing finding callouts with narrative paragraphs \u2014 keep findings in callouts."
    ]
  },
  "runbook": {
    label: "Runbook",
    description: "Operational procedure: step-by-step instructions, prerequisites, rollback, and escalation.",
    recommendedTheme: "amber-terminal",
    recommendedBlocks: ["summary", "code", "callout", "diagram", "checklist"],
    structure: [
      "Front-matter with title, theme (amber-terminal recommended), surface.",
      "Summary block with purpose and scope.",
      "Code blocks for every command the operator must run.",
      "Callouts for warnings, prerequisites, and rollback steps.",
      "Diagram for the operational flow or system topology."
    ],
    antiPatterns: [
      "Prose-heavy steps \u2014 if it is a command, put it in a code block.",
      "Missing rollback section \u2014 always include a rollback or undo callout.",
      "Using decision-card \u2014 runbooks are procedural, not deliberative."
    ]
  },
  "data-report-lite": {
    label: "Data Report Lite",
    description: "Lightweight data summary: key metrics, trends, anomalies. No full BI, just the signal.",
    recommendedTheme: "paper-light",
    recommendedBlocks: ["summary", "stat", "table", "diagram", "code"],
    structure: [
      "Front-matter with title, theme (paper-light recommended), surface.",
      "Summary block with key takeaways.",
      "Code blocks with query results, metric snapshots, or data snippets."
    ],
    antiPatterns: [
      "Embedding large datasets in code blocks \u2014 summarize and link.",
      "Using diagram for simple metric tables \u2014 code blocks with formatted text work better.",
      "Over-decorating with callouts \u2014 keep it lean."
    ]
  },
  "proposal": {
    label: "Proposal",
    description: "Readable balanced proposal for product or implementation direction. Less dense than engineering-plan, stronger than a plain memo.",
    recommendedTheme: "paper-light",
    recommendedBlocks: ["summary", "decision-card", "comparison", "timeline", "callout", "table"],
    structure: [
      "Front-matter with title, theme (paper-light recommended), surface.",
      "Summary block stating recommendation and why now.",
      "Decision-card for the proposed direction.",
      "Comparison or table for alternatives and tradeoffs.",
      "Timeline/checklist for execution and review gates."
    ],
    antiPatterns: [
      "Overusing dashboards or metadata chrome \u2014 proposal should read as one document.",
      "Skipping alternatives \u2014 proposals need contrast.",
      "Turning it into a slide deck \u2014 use future deck surface only when explicitly requested."
    ]
  },
  "documentation": {
    label: "Documentation",
    description: "Blog/Notion-style explanatory document: prose-forward, relaxed rhythm, light review affordances.",
    recommendedTheme: "editorial-kami",
    recommendedBlocks: ["summary", "quote", "image", "diagram", "table", "tabs", "callout"],
    structure: [
      "Front-matter with title, editorial theme, and documentation surface.",
      "Readable heading hierarchy with short paragraphs.",
      "Summary for the core takeaway.",
      "Images/diagrams/tables only when they improve explanation.",
      "Callouts for caveats and reviewer prompts."
    ],
    antiPatterns: [
      "Dense engineering grids \u2014 documentation should privilege prose and comprehension.",
      "Uncaptioned images or diagrams.",
      "Using raw Markdown tables for complex comparisons when comparison/table blocks are clearer."
    ]
  }
};
function getRecipe(surface) {
  return RECIPES[surface] || null;
}
function listRecipeSurfaces() {
  return Object.keys(RECIPES);
}
function getDesignRecommendation(surface = "engineering-plan") {
  const recipe = getRecipe(surface);
  const surfaceName = surface;
  if (!recipe) return null;
  const resources = resourcesForSurface(surface, recipe);
  return {
    surface: surfaceName,
    recipe,
    theme: recipe.recommendedTheme,
    blocks: recipe.recommendedBlocks,
    structure: recipe.structure,
    antiPatterns: recipe.antiPatterns,
    suggestedFrontmatter: {
      title: "<\u586B\u5199\u6807\u9898>",
      theme: recipe.recommendedTheme,
      surface: surfaceName
    },
    suggestedBlockOrder: recipe.recommendedBlocks.map((blockType) => ({
      blockType,
      alias: aliasForBlock(blockType),
      purpose: blockPurposeHint(blockType, surface)
    })),
    designResources: resources.map((resource) => ({
      id: resource.id,
      priority: resource.priority,
      primaryValue: resource.primaryValue,
      integrationStatus: resource.integrationStatus,
      recommendedUse: resource.recommendedUse,
      risks: resource.risks
    })),
    authoringRules: [
      "Use .rk.md blocks; do not generate raw HTML or MDX.",
      "Keep the Web artifact reading-first; comments and metadata stay secondary.",
      "Prefer deterministic local renderers and mature modules already integrated by RenderKit.",
      "Use stable block ids because human comments anchor to block ids and text selectors.",
      "Use real data only; do not invent placeholder metrics or lorem ipsum."
    ],
    validation: [
      "renderkit validate <file> --json",
      "renderkit push <file> --json",
      "renderkit feedback <file> --json"
    ]
  };
}
function resourcesForSurface(surface, recipe) {
  const resources = listDesignResources();
  const always = /* @__PURE__ */ new Set(["html-anything", "md2html"]);
  const bySurface = {
    "engineering-plan": ["fireworks-tech-graph", "ui-ux-pro-max-skill", "thesvg"],
    "decision-brief": ["ui-ux-pro-max-skill"],
    "review-report": ["md2html", "ui-ux-pro-max-skill"],
    "runbook": ["fireworks-tech-graph", "md2html", "thesvg"],
    "data-report-lite": ["ui-ux-pro-max-skill", "fireworks-tech-graph", "thesvg"],
    "proposal": ["ui-ux-pro-max-skill", "md2html"],
    "documentation": ["md2html", "html-anything", "fireworks-tech-graph", "thesvg"]
  };
  const wanted = /* @__PURE__ */ new Set([...bySurface[surface] || [], ...always]);
  if (recipe?.recommendedBlocks?.includes("diagram")) wanted.add("thesvg");
  return resources.filter((resource) => wanted.has(resource.id));
}
function aliasForBlock(blockType) {
  const entries = Object.entries(BLOCK_ALIASES).filter(([, value]) => value.name === blockType).map(([alias]) => alias);
  if (!entries.length) return void 0;
  if (blockType === "callout") return entries.join("/");
  return entries[0];
}
function blockPurposeHint(blockType, surface) {
  const hints = {
    summary: "State the conclusion and reading promise up front.",
    stat: "Surface key quantitative signals without turning the document into a dashboard.",
    checklist: "Make readiness gates and follow-up work reviewable.",
    callout: "Highlight risks, assumptions, caveats, or reviewer prompts.",
    "decision-card": "Capture the decision, chosen path, rationale, and alternatives.",
    code: "Show exact commands, APIs, configs, or snippets the Agent expects humans to verify.",
    diagram: "Explain architecture, flows, or data movement with a local-first visual block.",
    image: "Use a captioned screenshot or figure when it improves comprehension.",
    table: "Compare status, owners, risks, or options in a dense but readable matrix.",
    tabs: "Keep alternate reader/reviewer or before/after views dense without overwhelming the default read.",
    grid: "Compose dense technical sections while keeping each block commentable.",
    comparison: "Contrast alternatives and trade-offs explicitly.",
    timeline: "Show rollout, migration, or review sequence.",
    quote: "Create a blog-style pull quote or principle that anchors the narrative."
  };
  if (surface === "documentation" && blockType === "quote") return "Use a pull quote to create blog-style rhythm and emphasis.";
  if (surface === "proposal" && blockType === "decision-card") return "Make the recommendation concrete and reviewable.";
  return hints[blockType] || "Recommended block for this surface.";
}
export {
  DEFAULT_ENDPOINT,
  DEFAULT_PORT,
  RECIPES,
  RK_VERSION,
  getDesignRecommendation,
  getRecipe,
  listRecipeSurfaces
};
