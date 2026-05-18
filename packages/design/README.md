# @renderkit/design

RenderKit shared design system: tokens, themes, content typography.

## Files

| File | Audience | Status |
|---|---|---|
| `tokens.css` | shared (web app + CLI standalone) | active |
| `themes.css` | shared — 8 themes (paper-light, dark-pro, notion-clean, linear-app, amber-terminal, glassmorphism, ibm-enterprise, editorial-kami) | active |
| `surfaces.css` | shared — cards / panels base | active |
| `blocks.css` | rendered content typography (h1/p/.rk-callout title) | active |
| `chrome.css` | early web app shell (.rk-shell / .rk-artifact / .rk-rail) | **DEPRECATED** |
| `index.css` | aggregates all of the above | **do not import in web app** (pulls in chrome.css) |

## Usage

### Web review app

```css
@import '@renderkit/design/tokens.css';
@import '@renderkit/design/themes.css';
@import '@renderkit/design/surfaces.css';
@import '@renderkit/design/blocks.css';
```

### CLI standalone artifact

CLI-pushed standalone HTML loads `/rk/theme.css` + `/rk/components.css` from `apps/web/public/rk/` (pre-generated). No direct import from this package needed.

## Why chrome.css was deprecated

Its `.rk-artifact` / `.rk-shell` / `.rk-rail` were the original web app shell. The new web app moved to `.rk-doc-app / .rk-doc-frame / .rk-doc-topbar`. The two shared the `.rk-artifact` class name, causing chrome.css's `max-width: 1320px; padding: 32px 24px` to be injected into the new app's root container, breaking fullscreen layout.

New code must:
- **Not** `@import '@renderkit/design/chrome.css'` or `index.css` in the web app.
- Use `apps/web/app/style/doc-app.css` for review layout.
