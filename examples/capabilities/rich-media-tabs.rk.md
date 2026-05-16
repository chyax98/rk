---
title: Rich Media and Tabs Capability
theme: paper-light
surface: engineering-plan
---

# Rich Media and Tabs Capability

:::sum{id="rich-summary" title="Capability summary"}
RenderKit can now compose richer blog/document style artifacts with media figures and tabbed sections while preserving block-level review.
:::

:::image{id="architecture-hero" title="Architecture snapshot" alt="Abstract RenderKit architecture" aspect="16:9" width="wide" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23eef6ff'/%3E%3Cstop offset='1' stop-color='%23fff7ed'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='675' rx='36' fill='url(%23g)'/%3E%3Crect x='120' y='165' width='220' height='140' rx='24' fill='%23ffffff' stroke='%230267a5' stroke-width='4'/%3E%3Crect x='490' y='135' width='240' height='180' rx='28' fill='%23ffffff' stroke='%2315803d' stroke-width='4'/%3E%3Crect x='860' y='165' width='220' height='140' rx='24' fill='%23ffffff' stroke='%23a16207' stroke-width='4'/%3E%3Cpath d='M340 235 H490 M730 235 H860' stroke='%236b7280' stroke-width='6' stroke-linecap='round'/%3E%3Ctext x='230' y='245' font-family='Arial' font-size='34' text-anchor='middle' fill='%231a1a1a'%3EAgent%3C/text%3E%3Ctext x='610' y='245' font-family='Arial' font-size='34' text-anchor='middle' fill='%231a1a1a'%3ERenderKit%3C/text%3E%3Ctext x='970' y='245' font-family='Arial' font-size='34' text-anchor='middle' fill='%231a1a1a'%3EHuman%3C/text%3E%3Ctext x='600' y='470' font-family='Arial' font-size='46' text-anchor='middle' font-weight='700' fill='%23111827'%3EBeautiful technical artifacts%3C/text%3E%3C/svg%3E"}
A local-first Agent-to-UI loop: source → rendered artifact → review signal → source revision.
:::

:::::tabs{id="delivery-tabs" title="Delivery views" width="wide"}
::::tab{id="tab-reader" label="Reader view"}
:::note{id="reader-note" title="Reader-first"}
The default page should feel like a finished technical article: clean canvas, strong figures, useful tables, and no debug chrome.
:::

:::table{id="reader-checklist" title="Reader checklist"}
| Capability | Status |
|---|---|
| Wide layout | Done |
| Rich media | Done |
| Comments hidden until review | Done |
:::
::::

::::tab{id="tab-reviewer" label="Reviewer view"}
:::warn{id="reviewer-note" title="Review mode"}
Review mode activates selection comments, quote highlights, resolve/reopen, and the supporting pane.
:::

:::src{id="review-command" language="bash" title="Reviewer handoff"}
```bash
renderkit feedback examples/capabilities/rich-media-tabs.rk.md --json
```
:::
::::
:::::
