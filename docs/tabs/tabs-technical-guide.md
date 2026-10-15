# Tabs: Technical Guide

For developers and architects. Covers component design, the container architecture, Universal Editor configuration, the rendering lifecycle, deep linking and analytics.

---

## 1. Component design

| Layer | File | Responsibility |
|---|---|---|
| Container | `models/_tabs-section.json` | "Tabs" section definition and settings model |
| Tab marker | `blocks/tab/_tab.json` | "Tab" key-value block with the tab's settings |
| Section decorator | `blocks/tabs/tabs-section.js` | Groups markers and blocks into tabs, defers closed tabs |
| Controller | `blocks/tabs/tabs-core.js` | Tab bar, ARIA, keyboard, mobile modes, lazy loading, lifecycle events, history, analytics, rotation |
| Styles | `blocks/tabs/tabs.css` | Tokens, styles, themes, sizes, responsive rules |
| Page hook | `scripts/scripts.js` → `decorateTabSections()` | Runs the decorator before sections load (code fetched only when a Tabs container exists) |
| Editor hook | `scripts/editor-support.js` | Rebuilds tabs after Universal Editor updates |
| Legacy adapter | `blocks/tabs/tabs.js` | Renders the old Tabs block with the same controller |

## 2. Container architecture

### Why a section, not a block

- Edge Delivery markup is sections → blocks → rows → cells. A block cannot contain another block.
- Universal Editor container blocks can only hold their own item components (`block/v1/block/item`). An item can't hold Hero, Cards or other blocks.
- The section is the only container that hosts any block. Making Tabs a section type gives inline authoring of any block, and new blocks are available in tabs as soon as they're added to the `section` filter.

### Authored structure (JCR / delivered markup)

```html
<div>                                   <!-- section, model tabs-section -->
  <h2>Products</h2><p>Intro…</p>          <!-- optional intro -->
  <div class="tab">                       <!-- marker: key-value rows -->
    <div><div>title</div><div>Overview</div></div>
    <div><div>anchor</div><div>overview</div></div>
    <div><div>icon</div><div>info</div></div>
  </div>
  <div class="hero">…</div>               <!-- Overview content -->
  <p>Text…</p>
  <div class="tab">…Features…</div>
  <div class="cards">…</div>              <!-- Features content -->
  <div class="section-metadata">          <!-- container settings -->
    <div><div>tabs-style</div><div>pill</div></div>
    <div><div>tabs-theme</div><div>theme-dark</div></div>
  </div>
</div>
```

### Decorated structure

```html
<div class="section tabs-section" data-tabs-style="pill" data-tabs-status="decorated">
  <div class="tabs-wrapper">
    <div class="tabs pill horizontal align-start mobile-scroll theme-dark size-default deeplink" data-mode="tabs">
      <div class="tabs-header">intro wrappers</div>
      <div class="tabs-nav">
        <div class="tabs-list" role="tablist" aria-label="Products">
          <button role="tab" id="tab-overview" aria-controls="overview" aria-selected="true"
                  aria-posinset="1" aria-setsize="2">…</button>
        </div>
        <select class="tabs-select">…</select>
      </div>
      <div class="tabs-panels">
        <h3 class="tabs-accordion-heading">…</h3>
        <div class="tabs-panel" id="overview" role="tabpanel" aria-labelledby="tab-label-overview" tabindex="0">
          <div class="tabs-panel-content">
            <div class="hero-wrapper"><div class="hero block">…</div></div>
            <div class="default-content-wrapper"><p>Text…</p></div>
          </div>
        </div>
        <div class="tabs-panel" id="features" hidden>
          <div class="tabs-panel-content">
            <div class="cards-wrapper"><div class="cards tabs-deferred-block">…</div></div>
          </div>
        </div>
      </div>
      <p class="tabs-status" aria-live="polite"></p>
    </div>
  </div>
</div>
```

The root carries `data-block-status="loaded"` so `decorateBlocks()`/`loadBlock()` never treat it as a block.

## 3. Universal Editor configuration

| Source file | Setting |
|---|---|
| `models/_tabs-section.json` | Definition "Tabs": section resourceType, model `tabs-section`, **filter `section`**, template defaults (`tabs-style: standard`, `tabs-deeplink: true`, …) |
| `models/_component-definition.json` | `_tabs-section.json` added to the **Sections** group |
| `models/_component-models.json` | `_tabs-section.json` models included |
| `models/_component-filters.json` | `main`: `section`, `tabs-section` |
| `models/_section.json` | `section` filter: all project blocks + `tab` (legacy `tabs` removed) |
| `blocks/tab/_tab.json` | Definition "Tab": block, `key-value: true`, template title "New Tab" |
| `blocks/tabs/_tabs.json` | Legacy "Tabs (legacy)" / "Tab (legacy)", kept for rendering only |
| `.eslintrc.js` | `xwalk/max-cells`: `tabs-section` 13 (key-value section metadata), `tabs-item` 11 (legacy) |

Run `npm run build:json` after changing these. Never edit the generated `component-*.json` files.

**Future blocks:** add the block to the `section` filter as usual. Because the Tabs container uses the same filter, the block is available inside tabs too, with no Tabs change.

**Trade-off:** `tab` sits in the shared `section` filter, so it is also offered in normal sections. There it does nothing on the page and shows an editor notice (`blocks/tab/tab.js`).

## 4. Rendering lifecycle

1. `loadEager()` → `decorateMain(main)` (sections and blocks decorated as usual) → **`await decorateTabSections(main)`** → first section loads.
2. `decorateTabSections()` finds sections with `data-tabs-style` (or `data-aue-model="tabs-section"`) and dynamically imports `tabs-section.js` only then.
3. `decorateTabSection(section)`:
   - Splits the section's wrappers into the **intro** (before the first marker) and **groups** (a marker plus the wrappers up to the next marker).
   - Reads each marker with `readBlockConfig()`. On the page the marker is removed; in the editor it's kept at the top of its panel as a selectable "Tab settings" label.
   - Picks the opening tab with `initialTabIndex()`: URL hash (tab id, or an element inside the tab) → Default Active → first enabled.
   - **Defers** blocks in every other tab: `block` becomes `tabs-deferred-block`, so `loadSection()` skips them. Not done in the editor.
   - Builds the root and calls `initTabs()` from `tabs-core.js`.
4. `loadSection(section)` then loads the opening tab's blocks normally, so LCP is unaffected.
5. When a closed tab opens for the first time, its `load()` re-adds `block` and runs `loadBlock()` for each deferred block in order. Each block's `decorate()`, CSS and JS run while the tab is visible. The panel is `aria-busy` with a reserved min-height during loading (no CLS). Hovering a tab starts this work early (legacy fragments).
6. After a panel opens: `tabs:panel-shown` on the panel and `resize` on `window`. When it closes: `video`/`audio` pause and `tabs:panel-hidden` fires.

## 5. Universal Editor updates (`editor-support.js`)

| Change | Handling |
|---|---|
| Add, remove or move components in a Tabs container | Section is re-rendered → `decorateSections`/`decorateBlocks` → **`decorateTabSections`** → `loadSections` |
| Change Tabs container settings | Same as above (section patch) |
| Edit a block inside a tab | Block re-rendered in place inside its panel (standard behaviour) |
| Edit default content inside a tab | Replaced in place (standard behaviour) |
| Edit a Tab marker's settings | Page reload, because the tab bar is built from markers |
| Select a component in the Content Tree | `aue:ui-select` opens the tab that contains it |

## 6. Accessibility strategy

- WAI-ARIA tabs pattern with **manual activation**, which suits panels that load content: arrow keys move focus (wrapping, RTL-mirrored), Home/End jump, Enter/Space select, and Tab moves into the panel (`tabindex="0"`). The roving `tabindex` resets to the selected tab when focus leaves the list.
- `aria-posinset`/`aria-setsize` convey tab position. Selection is announced in a polite live region.
- Disabled tabs use `aria-disabled` and stay focusable. Activating one announces "… tab is unavailable".
- Panels are named by the tab title only (`aria-labelledby` → label span), without badge or description.
- The mobile accordion uses `aria-expanded` buttons inside headings, with `region` panels. The mobile dropdown is a native `<select>` with an accessible name.
- Auto rotation has a pause/play button, pauses on hover and focus, and is disabled for reduced motion and in the editor.

## 7. Deep linking and history

- Tab ids come from the Tab ID or the title, and are unique per page.
- With Deep Linking on, each user selection calls `history.pushState(…, '#id')`. `hashchange` (Back/Forward or in-page links) opens the matching tab. An empty hash returns to the default tab.
- On load, a hash matching a tab, or any element inside a tab, opens that tab and loads its content before the page scrolls to it.

## 8. Analytics integration

```js
document.addEventListener('tabs:changed', (e) => {
  const { pageName, componentId, tabName, tabPosition, analyticsLabel, timestamp, trigger } = e.detail;
});
// or with the Adobe Client Data Layer:
window.adobeDataLayer.push(...) // { event: 'tabs:changed', eventInfo: { … } }
```

| Event | When |
|---|---|
| `tabs:clicked` | Click, Enter or Space on a tab (`disabled` included) |
| `tabs:activated` | Every activation; `trigger`: `init`, `hash`, `click`, `keyboard`, `select`, `accordion`, `history`, `rotation`, `editor` |
| `tabs:changed` | The active tab changed (`previousTabId`, `previousTabName`) |
| `tabs:viewed` | A panel is ≥25% visible, once per tab per page view |
| `tabs:change` | Legacy name, kept |

## 9. Migration logic

- **Legacy Tabs block:** `tabs.js` reads its rows (11 cells per Tab item), keeps the item row as the panel (so it stays selectable in the editor), and passes the tabs to the same controller. Fragment-backed tabs lazy-load the fragment; inline legacy tabs render their heading, image and rich text. Visuals and behaviour match the new container.
- **Not automated:** rewriting AEM content into containers. That requires creating and moving components in AEM author, which can't be done from the delivery code. Use the authoring guide's steps or an AEM-side content migration.
- **Removal:** when no pages use the legacy block, delete `blocks/tabs/tabs.js` and `_tabs.json`, and the `tabs-item` lint override.

## 10. Testing

The sandbox is in `drafts/` (excluded from delivery): `tabs` (basic, vertical, dark, brand, compact/full width), `tabs-mega`, `tabs-editor-states` (editor hints and markers) and `tabs-legacy` (legacy block regression). Run `npx aem up --html-folder drafts --port 3001`.
