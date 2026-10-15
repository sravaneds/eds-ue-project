# Tabs

A container block for Universal Editor. Authors add **Tab** items inside the **Tabs** block. Each item holds the tab title, its settings and the panel content (heading, image, rich text). Everything is authored inside the block.

Edge Delivery does not allow blocks inside blocks ("No nested blocks for authors", David's Model), so a tab holds rich text, not other blocks. This follows the container-block pattern of Adobe's `aem-block-collection-xwalk` tabs and cards.

## Files

```
blocks/tabs/
├── _tabs.json      # Tabs + Tab definitions, models and the "tabs" filter (Universal Editor)
├── tabs.js         # decoration: items → tab buttons and panels, ARIA, keyboard, deep links, rotation, mobile modes
├── tabs.css        # tokens, styles, variations, responsive rules
└── README.md       # this file (not served, *.md is in .hlxignore)
icons/              # info.svg, star.svg, chat.svg sample tab icons
drafts/             # tabs.plain.html sandbox covering every variation (not served)
docs/tabs/          # authoring guide with screenshots (not served)
```

Registration: `tabs` is allowed in sections (`models/_section.json`), and the `tabs` filter allows only `tabs-item`. Run `npm run build:json` after changing models. Never hand-edit the generated `component-*.json` files.

## Content model

### Tabs (`tabs`): block settings

Rendered as single-cell rows before the items, plus block options (class names):

| Field | Name | Type | Output |
|---|---|---|---|
| Heading | `title` + `titleType` | text + select (h2–h4) | row, heading |
| Description | `description` | richtext | row |
| Auto Rotation Speed | `interval` | number 3–30, shown only when rotation is on | row (last) |
| Tab Style | `classes` | select | `standard` · `underline` · `pill` · `card` · `icon-tabs` · `numbered` · `image` · `mega` |
| Orientation | `classes_orientation` | select | `horizontal` · `vertical` |
| Alignment | `classes_alignment` | select | `align-start` · `align-center` · `align-end` · `align-stretch` |
| Mobile Behaviour | `classes_mobile` | select | `mobile-scroll` · `mobile-accordion` · `mobile-dropdown` |
| Theme Variant | `classes_theme` | select | `theme-light` · `theme-dark` · `theme-brand` |
| Enable Icons / Deep Linking / Sticky / Auto Rotation | `classes_icons` · `classes_deeplink` · `classes_sticky` · `classes_autorotate` | boolean | `icons` · `deeplink` · `sticky` · `autorotate` |

### Tab (`tabs-item`): one row per tab, one cell per setting

| Cell | Name | Type |
|---|---|---|
| 1 | `title` | text, required: tab label |
| 2 | `content` group: `content_heading` + `content_headingType`, `content_image` + `content_imageAlt`, `content_richtext` | panel content |
| 3 | `anchor` | text, `^[a-z0-9-]*$`: deep link id (defaults to the title) |
| 4 | `icon` | text: icon name in `/icons` |
| 5 | `badge` | text ≤20 |
| 6 | `summary` | text ≤160: tab description (Card, Image, Mega) |
| 7 | `thumbnail` | reference: tab image (Image style, decorative) |
| 8 | `active` | boolean: default active |
| 9 | `disabled` | boolean |
| 10 | `analytics` | text: analytics id |

Settings are separate cells, not a group, so the block can read each one by position even when optional ones are empty. `.eslintrc.js` raises `xwalk/max-cells` to 10 for `tabs-item` only.

## Decorated HTML

```html
<div class="tabs standard … block" data-mode="tabs">
  <div class="tabs-header"><div class="tabs-heading">…</div><div class="tabs-description">…</div></div>
  <div class="tabs-nav">
    <div class="tabs-list" role="tablist" aria-label="{heading}" aria-orientation="horizontal">
      <button type="button" role="tab" id="tab-overview" aria-controls="overview" aria-selected="true" tabindex="0">
        <span class="tabs-icon" aria-hidden="true"></span>
        <span class="tabs-tab-text"><span class="tabs-tab-label" id="tab-label-overview">Overview</span>…</span>
        <span class="tabs-badge">New</span>
      </button>
    </div>
    <select class="tabs-select">…</select>                 <!-- dropdown mode -->
    <button class="tabs-rotation" aria-label="…"></button>  <!-- auto rotation -->
  </div>
  <div class="tabs-panels">
    <h3 class="tabs-accordion-heading"><button class="tabs-accordion-trigger" aria-expanded="true">…</button></h3>
    <div class="tabs-panel" id="overview" role="tabpanel" aria-labelledby="tab-label-overview" tabindex="0">
      <div class="tabs-panel-content">heading, image, rich text (stays editable in Universal Editor)</div>
    </div>
  </div>
</div>
```

The item row itself becomes the panel, so its Universal Editor instrumentation is kept and the Tab stays selectable in the Content Tree. The settings cells are read and removed. The thumbnail is moved into the tab button with its instrumentation stripped.

## JavaScript (`tabs.js`)

- `readRows`: single-cell rows are block settings (heading, description, rotation speed); multi-cell rows are tabs.
- `readTab`: reads the cells by position, makes ids unique, and turns the row into the panel.
- `applyMode`: switches between `tabs`, `accordion` and `dropdown` on viewport changes, with matching ARIA roles.
- `activate`: one state update for all modes. It updates the hash when deep linking is on and dispatches `tabs:change` (`{ id, title, index, analyticsId, trigger }`), also pushed to `window.adobeDataLayer` when present.
- Rotation pauses on hover and focus, has a pause/play button, stops on interaction, and is off in the editor and with reduced motion.
- Editor support: `aue:ui-select` opens the tab containing the selected item. Universal Editor re-renders the whole block after edits, so no extra syncing is needed.

## CSS (`tabs.css`)

Tokens (`--tabs-*`) → base tab list and tab → panels → rotation, accordion and select controls → one rule group per style → `[data-mode]` mobile rules → sticky and mega → focus and alignment → breakpoints at 600px and 900px. Panels with an image show it beside the text from 900px. Dark and brand themes restyle buttons and links in panels. All selectors are scoped to `.tabs`.

## Accessibility

WAI-ARIA tabs pattern with roving `tabindex`; arrow, Home and End keys (RTL aware, disabled tabs skipped); panels named by the tab title only; `aria-disabled` for disabled tabs; accordion and dropdown semantics on mobile; a pause control for rotation (WCAG 2.2.2); visible focus; 44px targets.

## Extensibility

- **New tab style:** add an option to `classes` in `_tabs.json` and one scoped rule group in `tabs.css`.
- **New tab setting:** add a field to the end of the `tabs-item` model and to the end of `CELLS` in `tabs.js`.
- **Richer panel content:** add fields to the `content_` group in `tabs-item`. They render inside the panel automatically.
