# Tabs

A container tabs block for Universal Editor. Every tab is a **Tab Panel section**, so each tab is a full drop zone that accepts any block in the section filter, including blocks added to the project later.

## Why panels are sections

Edge Delivery markup does not allow a block inside another block. A block's children are rows, not blocks. Sections are the only containers that can hold any block, so this block follows Adobe's reference pattern for Universal Editor tabs ([aem-boilerplate-xwalk #69](https://github.com/adobe-rnd/aem-boilerplate-xwalk/pull/69)):

- The **Tabs** block holds the configuration (heading, style, behaviour).
- The **Tab Panel** sections that directly follow the section containing the Tabs block become its tabs.
- At runtime the block builds the tab list from the panels' metadata and moves the panels into itself.

Tab Panels use the `section` filter. Any block added to `models/_section.json` becomes available inside every tab with no change to this block.

## Files

```
blocks/tabs/
├── _tabs.json      # Tabs block definition + model (Universal Editor)
├── tabs.js         # decoration: panel discovery, ARIA, keyboard, deep links, rotation, mobile modes
├── tabs.css        # tokens, styles, variations, responsive rules
└── README.md       # this file (not served, *.md is in .hlxignore)
models/
└── _tab-panel.json # Tab Panel section definition + model
icons/
└── info.svg, star.svg, chat.svg  # sample tab icons
drafts/
└── tabs.plain.html # local sandbox covering every variation (not served)
```

Registration (sources only, never hand-edit the generated `component-*.json`):

| Source file | Change |
|---|---|
| `models/_component-definition.json` | `tab-panel` added to the **Sections** group |
| `models/_component-models.json` | `_tab-panel.json` models included |
| `models/_component-filters.json` | `tab-panel` allowed in `main` |
| `models/_section.json` | `tabs` allowed in sections |
| `.eslintrc.js` | `xwalk/max-cells` raised for `tab-panel` only (section metadata is key-value, not cells) |

Run `npm run build:json` after changing any of these.

## Content hierarchy

```
Page (main)
├── Section                      ← regular section
│   ├── Default content (optional)
│   └── Tabs block               ← configuration
├── Tab Panel "Overview"         ← tab 1, drop zone
│   ├── Text / Image / Button
│   └── Columns
├── Tab Panel "Features"         ← tab 2, drop zone
│   ├── Cards
│   └── Any future block
├── Tab Panel "Support"          ← tab 3, drop zone
│   └── Hero
└── Section                      ← first non-panel section ends the tab group
```

## Authoring in Universal Editor

| Task | How |
|---|---|
| Create tabs | Add a **Tabs** block to a section, then add **Tab Panel** sections directly after that section (Add → Sections → Tab Panel). New panels start with the title "New Tab". |
| Add a tab | Add another Tab Panel next to the existing ones. |
| Delete a tab | Delete the Tab Panel section. |
| Reorder tabs | Drag Tab Panels in the Content Tree. Tab order = section order. |
| Rename a tab | Edit **Tab Title** on the panel. |
| Default active tab | Turn on **Default Active** on the panel (first one wins). |
| Add content to a tab | Select the panel and add blocks. Selecting a component in the Content Tree opens its tab on the canvas. |

Notes:
- Universal Editor inserts one component at a time, so adding a Tabs block can't create panels automatically. Until panels exist, the block shows a hint on the canvas in the editor.
- Keep panels consecutive. A regular section between two panels ends the tab group, and later panels render as normal sections.
- Tabs inside a tab panel are not supported. The nested block shows a notice in the editor and does nothing on the live page.
- Auto rotation is turned off inside the editor.

## Models

### Tabs block (`tabs`)

Rendered as 3 rows plus block options (class names):

| Field | Name | Type | Output |
|---|---|---|---|
| Heading | `title` + `titleType` | text + select (h2–h4) | row 1, heading |
| Description | `description` | richtext | row 2 |
| Tab Style | `classes` | select | `standard` · `underline` · `pill` · `card` · `icon-tabs` · `numbered` · `image` · `mega` |
| Orientation | `classes_orientation` | select | `horizontal` · `vertical` |
| Alignment | `classes_alignment` | select | `align-start` · `align-center` · `align-end` · `align-stretch` |
| Mobile Behaviour | `classes_mobile` | select | `mobile-scroll` · `mobile-accordion` · `mobile-dropdown` |
| Theme Variant | `classes_theme` | select | `theme-light` · `theme-dark` · `theme-brand` |
| Enable Icons | `classes_icons` | boolean | `icons` |
| Deep Linking | `classes_deeplink` | boolean (default on) | `deeplink` |
| Sticky Tabs | `classes_sticky` | boolean | `sticky` |
| Auto Rotation | `classes_autorotate` | boolean | `autorotate` |
| Auto Rotation Speed | `interval` | number, 3–30 s, shown only when rotation is on | row 3 |

### Tab Panel section (`tab-panel`)

Rendered as section metadata, read by the block from `data-*` attributes:

| Field | Name | Type | Notes |
|---|---|---|---|
| Section Name | `name` | text | Content Tree label |
| Tab Title | `tab-title` | text, required, ≤60 | Tab label, panel name |
| Tab ID | `tab-id` | text, `^[a-z0-9-]*$` | Deep link `#tab-id`; defaults to the title; made unique automatically |
| Icon | `tab-icon` | text | Icon name in `/icons` |
| Badge | `tab-badge` | text, ≤20 | e.g. "New" |
| Description | `tab-description` | text, ≤160 | Card, Image and Mega styles |
| Image Thumbnail | `tab-thumbnail` | reference | Image style; decorative (`alt=""`) because the title labels the tab |
| Default Active | `tab-active` | boolean | |
| Disabled | `tab-disabled` | boolean | Shown but not selectable |
| Analytics Identifier | `tab-analytics` | text | Sent with `tabs:change` |
| Style | `style` | multiselect | Same section styles as regular sections |

## Variations

| Variation | How to get it |
|---|---|
| Standard horizontal | Tab Style **Standard** |
| Vertical | Orientation **Vertical** (any style; horizontal below 900px) |
| Pill | Tab Style **Pill** |
| Underline | Tab Style **Underline** |
| Icon | Tab Style **Icon** (icon above label), or **Enable Icons** on any style |
| Numbered | Tab Style **Numbered** |
| Card | Tab Style **Card** + panel descriptions |
| Image | Tab Style **Image** + panel thumbnails |
| Sticky | **Sticky Tabs** on any style |
| Mega | Tab Style **Mega**: full-bleed block, full-width panels for heroes, cards, forms, video or custom blocks |

## Sample authored content

Delivered markup for one tab group (see `drafts/tabs.plain.html` for all variations):

```html
<div>
  <div class="tabs standard horizontal align-start mobile-accordion theme-light icons deeplink">
    <div><div><h2>Standard tabs with icons</h2></div></div>
    <div><div><p>Pick a topic.</p></div></div>
  </div>
</div>
<div>
  <h3>Overview</h3>
  <p>Default content, columns and buttons work inside a panel.</p>
  <div class="columns">…</div>
  <div class="section-metadata">
    <div><div>tab-title</div><div>Overview</div></div>
    <div><div>tab-id</div><div>overview</div></div>
    <div><div>tab-icon</div><div>info</div></div>
  </div>
</div>
<div>
  <div class="cards">…</div>
  <div class="section-metadata">
    <div><div>tab-title</div><div>Features</div></div>
    <div><div>tab-badge</div><div>New</div></div>
  </div>
</div>
```

Preview locally: `npx aem up --html-folder drafts --port 3001`, then open `/drafts/tabs`.

## Decorated HTML

```html
<div class="tabs standard … block" data-mode="tabs">
  <div class="tabs-header">
    <div class="tabs-heading">…<h2>…</h2></div>
    <div class="tabs-description">…</div>
  </div>
  <div class="tabs-nav">
    <div class="tabs-list" role="tablist" aria-label="{heading}" aria-orientation="horizontal">
      <button type="button" role="tab" id="tab-overview" aria-controls="overview"
              aria-selected="true" tabindex="0" data-analytics-id="…">
        <span class="tabs-icon" aria-hidden="true"></span>
        <span class="tabs-tab-text">
          <span class="tabs-tab-label" id="tab-label-overview">Overview</span>
          <span class="tabs-tab-description">…</span>
        </span>
        <span class="tabs-badge">New</span>
      </button>
      …
    </div>
    <select class="tabs-select" aria-label="{heading}">…</select>   <!-- dropdown mode -->
    <button class="tabs-rotation" aria-label="Pause automatic tab rotation"></button>
  </div>
  <div class="tabs-panels">
    <h3 class="tabs-accordion-heading"><button class="tabs-accordion-trigger" aria-expanded="true" aria-controls="overview">…</button></h3>
    <div class="section tabs-panel" id="overview" role="tabpanel"
         aria-labelledby="tab-label-overview" tabindex="0" data-tab-title="Overview">
      … any blocks …
    </div>
    …
  </div>
</div>
```

## JavaScript architecture (`tabs.js`)

- `findPanels`: collects the consecutive Tab Panel sections after the block's section (`data-tab-title`, or `data-aue-model="tab-panel"` in the editor).
- `readRows` / `readTab`: read block rows and panel metadata. Ids come from Tab ID or the title and are kept unique.
- `build`: creates the tab buttons, accordion triggers and dropdown options from the current panels, and picks the active tab (current → URL hash → Default Active → first enabled). It runs again whenever panels change.
- `applyMode`: switches between `tabs`, `accordion` and `dropdown` on viewport changes and swaps the ARIA roles to match.
- `activate`: one state update for all modes. It updates the hash when deep linking is on and dispatches `tabs:change`.
- Rotation: `setInterval` with hover/focus pause, a pause/play button, and a permanent stop on any user interaction.
- Editor support: a `aue:ui-select` listener opens the tab containing the selected component. A `MutationObserver` rebuilds the tabs when Universal Editor re-renders a panel.

Events: `tabs:change` (bubbles) with `{ id, title, index, analyticsId, trigger }`. If `window.adobeDataLayer` exists, the same payload is pushed as `{ event: 'tabs:change', eventInfo }`.

## CSS architecture (`tabs.css`)

1. Tokens on `.tabs` (`--tabs-*`); themes only override tokens.
2. Base tab list, tab, badge, icon (CSS mask, follows `currentcolor`) and thumbnail.
3. Panels, rotation control, accordion trigger and select.
4. One rule group per Tab Style.
5. Mobile mode rules keyed on `[data-mode]`.
6. Sticky and mega layout (mega makes its section wrapper full-bleed and constrains header, nav and panel content to 1200px, letting heroes stay full width).
7. Focus styles and alignment.
8. Breakpoints: `600px` (tablet) and `900px` (desktop: vertical layout, card sizing).

All selectors are scoped to `.tabs`. Style values avoid generic class names (the Icon style is `icon-tabs` because the global `.icon` utility would shrink the block).

## Accessibility (WCAG 2.2 AA)

- WAI-ARIA tabs pattern: `role="tablist"` with an `aria-label` (heading text), `role="tab"` buttons with `aria-selected` and `aria-controls`, and `role="tabpanel"` with `aria-labelledby`. Panels are named by the tab title only, without the badge or description.
- Roving `tabindex`: one tab stop for the list. Selection follows focus.
- Keys: ←/→ and ↑/↓ move between tabs (wrapping), Home/End jump to the first or last tab, disabled tabs are skipped, and arrow directions are mirrored in RTL.
- `aria-orientation="vertical"` only when vertical tabs are actually laid out vertically.
- Disabled tabs use `aria-disabled`, so they stay discoverable but can't be activated.
- Accordion mode: buttons with `aria-expanded` and `aria-controls` inside headings one level below the block heading; panels are `role="region"`. Dropdown mode: a native `<select>` with an accessible name; panels are labelled regions.
- Auto rotation complies with 2.2.2 Pause, Stop, Hide: a pause/play button, pause on hover and focus, a stop on interaction, and no rotation with `prefers-reduced-motion`.
- Visible `:focus-visible` outlines. Tabs are at least 44px tall (2.5.8 Target Size). Selected state uses an indicator or fill, not colour alone.

## Responsive behaviour

| Viewport | Behaviour |
|---|---|
| ≥ 900px | Horizontal, vertical (side nav) or card layouts |
| 600–899px | Horizontal; overflowing tab lists scroll sideways with snap points |
| < 600px | Author choice: **Scrollable tabs**, **Accordion** or **Dropdown** |

## Performance and SEO

- No dependencies. Code is split per block and only loads on pages with tabs.
- All panel content is in the delivered HTML (indexable). Inactive panels use `hidden`, so there's no layout cost.
- Thumbnails go through `createOptimizedPicture` and load lazily. Icons are small SVGs.
- Deep links (`#tab-id`) and in-page anchors inside a panel open the right tab. `history.replaceState` avoids filling the history with tab changes.

## Extensibility

- **New blocks in tabs**: add the block to the `section` filter. Tab Panels use the same filter.
- **New tab styles**: add an option to `classes` in `_tabs.json` and one scoped rule group in `tabs.css`.
- **New panel fields**: add a `tab-*` field to `_tab-panel.json` and read it in `readTab`.
- **Analytics**: listen for `tabs:change` or consume the data layer push.
- **Personalisation and experiments**: panels are regular sections, so section-level targeting and fragments work.
- **Possible next steps**: lazy-load blocks in hidden panels, sync multiple tab groups, a "show all" print mode.
