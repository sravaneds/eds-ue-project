# Tabs

A container block for Universal Editor. Tabs are managed entirely inside the Tabs block. Each **Tab** item holds its settings and a **Tab Content fragment**. The fragment is a page that can hold **any** project block (Hero, Cards, Columns, default content, and blocks added in the future), loaded into the tab when it opens.

## 1. Architecture overview

```
Page section
└── Tabs (block, container)                 ← heading, description, style, theme, behaviour
    ├── Tab "Overview"  (item)               ← title, ID, icon, badge, description, thumbnail,
    │     └── Tab Content → /fragments/products/overview     analytics label, default active, disabled
    ├── Tab "Features"  (item)
    │     └── Tab Content → /fragments/products/features
    └── Tab "Resources" (item)
          └── Tab Content → /fragments/products/resources

/fragments/products/overview (fragment page, any blocks)
├── Section
│   ├── Hero
│   └── Text, Title, Button
└── Section
    └── Cards …
```

**Why fragments, not blocks inside the Tab item.** Edge Delivery markup has no nested blocks: a block's children are rows and cells, and Universal Editor only allows item components inside a block. Adobe's content-modeling guidance is explicit ("Rule #2: No nested blocks for authors… consider fragments", David's Model on aem.live). A fragment is a normal page, so it accepts every block in the project's section filter. New blocks work in tabs with no change to this block, and the blocks render exactly as they do elsewhere.

What this means for authors: tabs are added, removed, renamed, reordered, duplicated, disabled and defaulted inside the Tabs block. A tab's blocks are edited in its fragment page.

## 2. Files

```
blocks/tabs/
├── _tabs.json   # definitions, models and filter (Tabs container + Tab item)
├── tabs.js      # decoration, lazy fragment loading, lifecycle, a11y, analytics, history
├── tabs.css     # tokens, styles, themes, sizes, responsive rules
└── README.md    # this file (not served)
blocks/fragment/fragment.js   # loadFragment(), reused to load and decorate tab content
docs/tabs/                    # authoring guide (md / html / pdf) with screenshots (not served)
drafts/                       # sandbox pages and fragments (not served)
```

## 3. Universal Editor configuration and block registration

| Item | Where | Value |
|---|---|---|
| Tabs definition | `_tabs.json` | `core/franklin/components/block/v1/block`, model `tabs`, filter `tabs` |
| Tab definition | `_tabs.json` | `core/franklin/components/block/v1/block/item`, model `tabs-item`, template title "New Tab" |
| Tabs filter | `_tabs.json` | `tabs` → `["tabs-item"]` (only Tabs can be added inside Tabs) |
| Section filter | `models/_section.json` | includes `tabs` |
| Lint | `.eslintrc.js` | `xwalk/max-cells` = 11 for `tabs-item` (one cell per setting, read by position) |

The generated `component-*.json` files are rebuilt with `npm run build:json`. Never edit them by hand. No Tab Panel section model exists anymore.

## 4. Content models

### Tabs (`tabs`)

| Field | Name | Output |
|---|---|---|
| Heading / type | `title`, `titleType` (h2–h4) | row |
| Description | `description` (richtext) | row |
| Tab Style | `classes`: `standard` `underline` `pill` `card` `icon-tabs` `numbered` `image` `mega` | class |
| Orientation | `classes_orientation`: `horizontal` `vertical` | class |
| Alignment | `classes_alignment`: `align-start` `align-center` `align-end` `align-stretch` (full width) | class |
| Mobile Behaviour | `classes_mobile`: `mobile-scroll` `mobile-accordion` `mobile-dropdown` | class |
| Theme | `classes_theme`: `theme-light` `theme-dark` `theme-brand` | class |
| Size | `classes_size`: `size-default` `compact` | class |
| Toggles | `classes_icons`, `classes_deeplink` (default on), `classes_sticky`, `classes_autorotate` | class |
| Auto Rotation Speed | `interval` (3–30 s, shown only when rotation is on) | row (last) |

### Tab (`tabs-item`), shown in two property tabs

**Tab** property tab (cells 1–10):

| # | Field | Name | Notes |
|---|---|---|---|
| 1 | Title | `title` | required, ≤60 |
| 2 | Tab Content (fragment) | `fragment` | `aem-content`: the fragment page with the tab's blocks |
| 3 | Tab ID | `anchor` | `^[a-z0-9-]*$`, deep link id; defaults to the title |
| 4 | Icon | `icon` | icon name in `/icons` |
| 5 | Badge | `badge` | ≤20 |
| 6 | Description | `summary` | ≤160; Card, Image, Mega styles |
| 7 | Thumbnail | `thumbnail` | reference; Image style (decorative) |
| 8 | Default Active | `active` | boolean |
| 9 | Disabled | `disabled` | boolean |
| 10 | Analytics Label | `analytics` | sent with every tab event |

**Legacy content** property tab (cell 11, deprecated): `content_heading`, `content_headingType`, `content_image`, `content_imageAlt` and `content_richtext`. These are only used when no Tab Content fragment is set.

## 5. Rendering lifecycle

1. `decorate()` reads the block rows: single-cell rows are block settings, multi-cell rows are Tabs.
2. Each Tab row becomes its panel. Its cells are read by position and removed, and an empty `.tabs-panel-content` is added. The row keeps its Universal Editor instrumentation, so the Tab stays selectable in the Content Tree.
3. Tab buttons, accordion triggers (mobile accordion) and dropdown options are built.
4. The **opening tab** (from the URL hash, then Default Active, then the first enabled tab) is activated, and `decorate()` **awaits its fragment**. Its blocks load with the Tabs block, so its content can be the LCP element.
5. **Other tabs are not fetched.** Their fragment loads the first time they open. `loadFragment()` fetches `<path>.plain.html` and runs `decorateMain()` + `loadSections()`, so nested blocks get their normal `decorate()`, CSS and JS. Hovering a tab warms the fetch cache.
6. When a tab opens, the panel is marked `aria-busy` and keeps the outgoing panel's height while loading (no layout shift). After loading, the block dispatches `tabs:panel-shown` on the panel and a `resize` event on `window`, so carousels, maps and embeds can measure their visible size.
7. When a tab closes, `<video>`/`<audio>` in it are paused and `tabs:panel-hidden` is dispatched on the panel. Blocks keep their state, so switching back is instant.

Nested blocks initialise when their tab is first shown, which suits blocks that need real dimensions (carousels, video, maps, embeds, forms). Blocks that need to react to later show/hide can listen for `tabs:panel-shown` / `tabs:panel-hidden`.

## 6. Accessibility (WCAG 2.2 AA)

- `role="tablist"` (named by the heading), `role="tab"` with `aria-selected`, `aria-controls`, `aria-posinset`/`aria-setsize`, and `role="tabpanel"` with `aria-labelledby` (the tab title only) and `tabindex="0"`.
- **Manual activation**, recommended when panel content loads on demand: ←/→/↑/↓ move focus (RTL-aware, wrapping), Home/End jump, **Enter/Space** open the focused tab, and **Tab** moves into the panel. Focus returns to the selected tab when the visitor comes back to the tab list.
- Disabled tabs use `aria-disabled`, stay focusable and are announced. Activating one announces "… tab is unavailable".
- A polite live region announces "Features tab selected, 2 of 4" after each user selection.
- Mobile accordion: buttons with `aria-expanded` inside headings, panels are `role="region"`. Mobile dropdown: a native `<select>` with an accessible name.
- Loading panels set `aria-busy="true"`. Auto rotation has a pause/play button, pauses on hover and focus, and is off with reduced motion and in the editor. Focus rings are visible, targets are at least 44px (36px in Compact).

## 7. Analytics

Every event is dispatched on the block as a bubbling `CustomEvent` and, if `window.adobeDataLayer` exists, pushed as `{ event, eventInfo }`.

| Event | When |
|---|---|
| `tabs:clicked` | A tab is clicked or activated by Enter/Space (includes `disabled`) |
| `tabs:activated` | Any activation: `init`, `hash`, `click`, `keyboard`, `select`, `accordion`, `history`, `rotation`, `editor` |
| `tabs:changed` | The active tab changed (includes `previousTabId`, `previousTabName`) |
| `tabs:viewed` | A tab's panel is visible in the viewport (≥25%), once per tab per page view |
| `tabs:change` | Legacy event name, kept for existing listeners |

Payload: `pageName`, `componentId` (block id or `tabs-N`), `tabId`, `tabName`, `tabPosition`, `tabCount`, `analyticsLabel` (the Tab's Analytics Label, or its ID), `trigger`, `timestamp` (ISO 8601).

## 8. Deep linking and history

- With **Deep Linking** on, each user selection pushes `#tab-id` onto the history, so Back and Forward step through tabs. Going back past the first change returns to the default tab.
- A URL with `#tab-id`, or with the id of any element inside a tab, opens that tab on load. In-page links do the same.
- The active tab is kept in the URL, so reloads and shared links restore it.

## 9. Themes, styles and sizes

All existing variations are preserved: standard, underline, pill, card, icon, numbered, image, mega, vertical, sticky, auto rotation, alignment (including **full width** = Stretch), light/dark/brand themes, badges, icons, and the new **Compact** size. Theme overrides apply to the tab chrome and to default content inside panels only. Nested blocks keep their own styling. In Mega tabs, a Hero inside a panel spans the full width.

## 10. Migration strategy

| Content | Behaviour |
|---|---|
| Tabs with a **Tab Content** fragment | Fragment loads into the tab |
| Tabs authored with the previous inline fields (heading, image, rich text) | Keep rendering from the **Legacy content** fields, unchanged, with no author action needed |
| Pages that used the removed **Tab Panel** sections | Those sections render as normal sections. Recreate them as Tab items |

To move a legacy tab to the new model (per tab):
1. Create a fragment page (e.g. `/content/<site>/fragments/<page>/<tab>`) and add the content as **Title**, **Image** and **Text** (or any blocks).
2. Set the Tab's **Tab Content (fragment)** to that page. The fragment takes over immediately.
3. Clear the **Legacy content** fields. Once no content uses them, remove the `content_*` fields and the `content` entry in `CELLS`.

Moving content automatically would mean creating and editing pages in AEM author, which this code can't do. Run it as a content migration in AEM if many pages are affected.

## 11. Extensibility

- **New blocks in tabs:** add them to the project as usual. Fragment pages use the section filter, so they appear in tab content automatically.
- **New tab setting:** add a field at the end of the Tab property tab in `tabs-item` (before the legacy group), and add it at the same position in `CELLS`.
- **New style:** add an option to `classes` and one scoped rule group in `tabs.css`.
- **Block integration:** listen for `tabs:panel-shown` / `tabs:panel-hidden` on the closest `.tabs-panel`.
