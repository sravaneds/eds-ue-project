# Tabs

Tabs for Edge Delivery Services and Universal Editor, built as a **container section**. Authors add a **Tabs** container to the page and build every tab inside it. Each tab starts with a **Tab** (its settings) followed by its own content: any existing or future project block, authored inline with all normal Universal Editor capabilities.

Detailed design: [`docs/tabs/tabs-technical-guide.md`](../../docs/tabs/tabs-technical-guide.md). Author how-to: [`docs/tabs/tabs-authoring-guide.md`](../../docs/tabs/tabs-authoring-guide.md).

## Architecture

```
Page
└── Tabs  (container: section model "tabs-section", filter "section")
    ├── Title / Text ............. optional intro, shown above the tab bar
    ├── Tab "Overview" ........... tab settings (block "tab", key-value)
    ├── Hero, Text, Cards, CTA …  ← Overview's content section: any blocks
    ├── Tab "Features"
    ├── Cards, Columns, List …    ← Features' content section
    └── Tab "Resources"
        └── …
```

At runtime the container is restructured into `Tabs → Tab → content section → blocks`. Each Tab marker plus the blocks that follow it, up to the next marker, become one tab panel.

**Why a section container.** In Edge Delivery a block's children are rows and cells, so a block (or a block item) can't hold other blocks. Universal Editor only allows block items inside a block. The only container that holds any block is a **section**, so the Tabs container is a section type. That gives inline authoring of any block, and new blocks become available inside tabs automatically, because the container uses the standard `section` filter.

## Universal Editor models

| Component | Id | Type | Notes |
|---|---|---|---|
| Tabs | `tabs-section` | section (`core/franklin/components/section/v1/section`) | `models/_tabs-section.json`; allowed in `main`; filter `section`; settings rendered as section metadata (`data-tabs-*`) |
| Tab | `tab` | block, `key-value` | `blocks/tab/_tab.json`; allowed in any section (via the `section` filter) |
| Tabs (legacy) | `tabs` / `tabs-item` | block + item | kept so existing pages render; no longer in any filter, so it can't be added |

**Tabs settings:** Tab Style (standard, underline, pill, card, icon, numbered, image, mega), Orientation, Alignment (incl. full width), Mobile Behaviour (scroll, accordion, dropdown), Theme (light, dark, brand), Tab Size (default, compact), Enable Icons, Deep Linking (default on), Sticky Tabs, Auto Rotation and its speed.

**Tab settings:** Tab Title, Tab ID, Description, Icon, Badge, Thumbnail, Analytics Label, Default Active, Disabled.

## Files

```
blocks/tabs/tabs-core.js      shared controller: tab bar, a11y, keyboard, mobile modes, lazy loading,
                              lifecycle events, deep links + history, analytics, rotation
blocks/tabs/tabs-section.js   Tabs container: groups markers + blocks into tabs, defers closed tabs
blocks/tabs/tabs.css          all styles, themes, sizes and responsive rules
blocks/tabs/tabs.js           legacy Tabs block adapter (fragment / inline content)
blocks/tab/                   Tab marker model (+ editor notice when used outside a Tabs container)
models/_tabs-section.json     Tabs container definition and model
scripts/scripts.js            decorateTabSections(): runs before sections load
scripts/editor-support.js     rebuilds tabs after Universal Editor updates
docs/tabs/                    authoring guide, technical guide, screenshots (not served)
drafts/                       sandbox pages (not served)
```

## Nested block support

Blocks inside a tab are ordinary blocks in the container section: same markup, decoration, CSS and JS as anywhere else. Blocks in tabs that start closed are **deferred**. They load the first time their tab opens, so Carousels, Video, Maps, Forms and Embeds initialise at their real, visible size. Opening and closing a tab dispatches `tabs:panel-shown` / `tabs:panel-hidden` on the panel and a `resize` on `window`, and media in a closed tab is paused.

## Accessibility

WAI-ARIA tabs pattern: `role="tablist"` (named by the intro heading), `role="tab"` with `aria-selected`, `aria-controls`, `aria-posinset`/`aria-setsize`, and `role="tabpanel"` with `aria-labelledby`. Activation is manual: arrow keys (RTL-aware) and Home/End move focus, and Enter/Space select. A live region announces "Features tab selected, 2 of 4". Disabled tabs stay focusable, are marked `aria-disabled`, and are announced as unavailable. The mobile accordion and dropdown have their own semantics, there's a rotation pause control, focus is visible, and targets are at least 44px.

## Analytics

The `tabs:clicked`, `tabs:activated`, `tabs:changed` and `tabs:viewed` DOM events (bubbling) are also pushed to `window.adobeDataLayer` when present. Each carries `pageName`, `componentId`, `tabId`, `tabName`, `tabPosition`, `tabCount`, `analyticsLabel`, `trigger` and `timestamp`. The `tabs:change` event is kept for existing listeners.

## Migration

| Existing content | Result |
|---|---|
| Legacy Tabs block (Tab items with heading/image/rich text, or a fragment) | Still renders through `tabs.js` + `tabs-core.js`, with the same look and behaviour; no re-authoring needed |
| Tab Panel sections (first version) | Render as normal sections; recreate them inside a Tabs container |

Converting legacy content into the new structure (Tab → Title, Image and Text blocks) means rewriting pages in AEM author, which front-end code can't do. Authors can move tabs one at a time, as described in the authoring guide, or a content migration can be run in AEM. Once no page uses the legacy block, delete `blocks/tabs/tabs.js` and `_tabs.json`, and remove the `tabs-item` lint override.
