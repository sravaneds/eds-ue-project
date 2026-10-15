# Tabs Block: How It Was Built and How to Author It

**Audience:** content authors, reviewers and developers working on this site in AEM Universal Editor.

**About the screenshots:** every image in this guide is the rendered result of sample authored content (the sandbox page `drafts/tabs.plain.html`), captured in the local preview. They show what visitors see for each set of authoring choices. They are not screenshots of the Universal Editor interface itself.

**Status:** the published-page behaviour shown here was tested in the local preview. Three editor-only behaviours still need confirming in your AEM author environment: switching tabs when you select content in the Content Tree, refreshing tabs after a panel edit, and showing *Auto Rotation Speed* only when rotation is on.

---

## Contents

1. [How the Tabs block was built](#1-how-the-tabs-block-was-built)
2. [The key idea: a Tabs block plus Tab Panel sections](#2-the-key-idea-a-tabs-block-plus-tab-panel-sections)
3. [Authoring tabs step by step](#3-authoring-tabs-step-by-step)
4. [Field reference](#4-field-reference)
5. [Variations, with settings and screenshots](#5-variations-with-settings-and-screenshots)
6. [Tablet and mobile behaviour](#6-tablet-and-mobile-behaviour)
7. [Accessibility: what is built in and what authors need to do](#7-accessibility-what-is-built-in-and-what-authors-need-to-do)
8. [Tips, limits and troubleshooting](#8-tips-limits-and-troubleshooting)
9. [Testing locally](#9-testing-locally)

---

## 1. How the Tabs block was built

### 1.1 Requirements

The goal was a reusable **container** Tabs block where each tab is a drop zone that can hold **any** block (hero, cards, columns, forms, video, custom blocks) without code changes when new blocks are added. Authors must be able to add, delete, reorder and rename tabs, choose a default tab, and do all of this in Universal Editor. The block also needed 10 visual variations, three mobile behaviours, deep linking, auto rotation and WCAG 2.2 AA accessibility.

### 1.2 Research and the main design decision

Edge Delivery Services has one hard rule that shapes the design: **a block cannot contain other blocks.** A block's content is rows and cells, not child blocks. The only container that can hold any block is a **section**.

Adobe's own reference example for Universal Editor tabs (pull request #69 in `adobe-rnd/aem-boilerplate-xwalk`) solves this by making each tab panel a section. This block follows that pattern:

| Piece | What it is | What it holds |
|---|---|---|
| **Tabs** block | A normal block placed in a section | The heading, description and all tab settings |
| **Tab Panel** | A special section type placed right after it | The tab's title, ID, icon and so on, plus any blocks |

When the page loads, the Tabs block finds the Tab Panel sections that directly follow it, builds the tab bar from their titles, and moves the panels inside itself. Because a Tab Panel uses the **same allowed-components list as a normal section**, any block added to the project later is automatically available inside tabs.

### 1.3 Build steps

1. **Content model.** I created two Universal Editor models:
   - `blocks/tabs/_tabs.json`: the Tabs block (heading, description, rotation speed, plus 9 option fields that become CSS classes).
   - `models/_tab-panel.json`: the Tab Panel section (title, ID, icon, badge, description, thumbnail, default active, disabled, analytics ID, style).

   I registered both in the editor's component lists, allowed Tab Panels on the page and Tabs inside sections, and regenerated the editor configuration with `npm run build:json`.
2. **Behaviour (`tabs.js`).** Finds the panels; builds the tab buttons, accordion triggers and dropdown; handles clicks, the keyboard, URL hashes, auto rotation and the `tabs:change` analytics event. In Universal Editor it also opens the tab containing whatever you select in the Content Tree, and rebuilds itself when you edit a panel.
3. **Styling (`tabs.css`).** Design tokens (CSS variables) for colours, spacing and sizes; one rule group per tab style; themes that only swap tokens; mobile-first breakpoints at 600px and 900px.
4. **Sample content.** A sandbox page with 9 tab groups covering every variation, used for testing and for the screenshots in this guide.
5. **Testing.** I checked every variation at desktop (1280–1440px), tablet (768px) and mobile (375–390px), and tested the keyboard, deep links, rotation, the event payload, screen-reader names and horizontal overflow. Linting (`npm run lint`) passes.

### 1.4 Problems found in testing and fixed

| Problem | Fix |
|---|---|
| Auto rotation scrolled the whole page back to the tab bar every few seconds | Only the tab bar scrolls sideways now; the page never moves |
| The "Icon" style class clashed with the site's global `.icon` rule, shrinking the block to 24px | Renamed the style's class to `icon-tabs` |
| Screen readers announced panels as "Design Shape the target experience. Popular" | Panels are now named by the tab title only |
| On the dark theme, card text was white on white cards | The Cards block now sets its own text colour |
| Vertical underline tabs were spaced too far apart | Tightened the spacing in vertical layout |

---

## 2. The key idea: a Tabs block plus Tab Panel sections

```
Page
├── Section ................................ normal section
│   ├── (optional) text above the tabs
│   └── Tabs block ......................... settings: style, alignment, mobile behaviour…
├── Tab Panel  "Overview" .................. tab 1 (drop zone)
│   ├── Text, Image, Button
│   └── Columns block
├── Tab Panel  "Features" .................. tab 2 (drop zone)
│   └── Cards block
├── Tab Panel  "Support" ................... tab 3 (drop zone)
│   └── Hero block
└── Section ................................ the first non-panel section ends the tab group
```

Rules to remember:

- **Order = tab order.** The first Tab Panel after the Tabs section is tab 1, and so on.
- **Keep panels together.** A normal section between two panels ends the tab group, and any panels after it display as ordinary sections.
- **One tab group per Tabs block.** You can have several tab groups on a page; each Tabs block takes the panels that follow it.

---

## 3. Authoring tabs step by step

### 3.1 Create a tab group

1. Open the page in **Universal Editor**.
2. Select the section where the tabs should appear (or add a new **Section**).
3. Click **Add** (+) and choose **Tabs** from the Blocks list.
4. With the Tabs block selected, fill in the properties panel on the right:
   - **Heading** and **Heading Type** (usually H2).
   - **Description** (optional).
   - **Tab Style**, **Orientation**, **Alignment**, **Mobile Behaviour**, **Theme Variant**.
   - Toggles: **Enable Icons**, **Deep Linking** (on by default), **Sticky Tabs**, **Auto Rotation**.
   - **Auto Rotation Speed** appears when Auto Rotation is on (3–30 seconds).
5. Select the **page** (or main area) in the Content Tree, click **Add** (+) and choose **Sections → Tab Panel**. Place it directly after the section that contains the Tabs block.
6. Repeat step 5 for each tab. Each new panel starts with the title "New Tab".

> Until at least one Tab Panel follows it, the Tabs block shows a dashed hint in the editor: *"No tabs yet. In the Content Tree, select Main, click Add (+) → Tab Panel, then drag it directly below this section."* Visitors never see this hint.

### 3.2 Set up each tab

Select a Tab Panel and set, in the properties panel:

- **Tab Title** (required): the text on the tab.
- **Tab ID**: the deep link name, e.g. `overview` gives `page#overview`. Leave it empty to use the title.
- Optional: **Icon**, **Badge**, **Description**, **Image Thumbnail**, **Default Active**, **Disabled**, **Analytics Identifier**.

### 3.3 Add content to a tab

Select the Tab Panel and click **Add** (+). Any block allowed in a normal section can be added: text, images, buttons, hero, cards, columns, fragments, and any block added in the future. You can add several blocks to one tab.

> Tip: when you select something inside a tab in the Content Tree, the canvas automatically switches to that tab so you can see what you're editing.

### 3.4 Manage tabs

| I want to… | Do this |
|---|---|
| Add a tab | Add another **Tab Panel** next to the existing panels |
| Delete a tab | Select the Tab Panel and delete it |
| Reorder tabs | Drag Tab Panels up or down in the **Content Tree** |
| Rename a tab | Change the panel's **Tab Title** |
| Open a specific tab first | Turn on **Default Active** on that panel (the first active panel wins) |
| Hide a tab temporarily | Turn on **Disabled** (shown greyed out, can't be opened) |
| Link to a tab | Use `#tab-id` in a link, e.g. `/services#cloud` |

---

## 4. Field reference

### 4.1 Tabs block

| Field | Options | Effect |
|---|---|---|
| Heading / Heading Type | Text, H2–H4 | Title above the tab bar. Also used as the tab bar's accessible name. |
| Description | Rich text | Supporting text under the heading |
| Tab Style | Standard, Underline, Pill, Card, Icon, Numbered, Image, Mega | Look of the tabs (see section 5) |
| Orientation | Horizontal, Vertical | Vertical puts tabs on the left on desktop |
| Alignment | Start, Center, End, Stretch | Position of the tab bar; Stretch makes tabs share the full width |
| Mobile Behaviour | Scrollable tabs, Accordion, Dropdown | How tabs behave below 600px |
| Theme Variant | Light, Dark, Brand | Colour scheme of the whole tab group |
| Enable Icons | On/Off | Shows each panel's icon on its tab |
| Deep Linking | On/Off (default On) | Updates the URL when a tab is chosen; opens tabs from `#tab-id` links |
| Sticky Tabs | On/Off | Keeps the tab bar visible while scrolling long panels |
| Auto Rotation | On/Off | Cycles through the tabs until the visitor interacts |
| Auto Rotation Speed | 3–30 seconds (default 6) | Only shown when Auto Rotation is on |

### 4.2 Tab Panel

| Field | Required | Notes |
|---|---|---|
| Section Name | No | Label in the Content Tree only |
| Tab Title | **Yes** | Up to 60 characters |
| Tab ID | No | Lowercase letters, numbers and hyphens; used in `#links` |
| Icon | No | Icon file name from the site's `/icons` folder, e.g. `info`, `star`, `chat` |
| Badge | No | Up to 20 characters, e.g. "New" |
| Description | No | Up to 160 characters; shown on Card, Image and Mega styles |
| Image Thumbnail | No | Shown on the Image style |
| Default Active | No | Opens this tab on page load |
| Disabled | No | Tab is shown but cannot be opened |
| Analytics Identifier | No | Sent with the tab change event |
| Style | No | Same section styles as a normal section (e.g. Highlight) |

---

## 5. Variations, with settings and screenshots

Each variation below lists the settings to choose on the **Tabs block** and the fields that matter on the **Tab Panels**. Settings not listed can stay at their defaults.

### 5.1 Standard horizontal tabs

The default tab bar: the selected tab has a light background and an accent line. This example also has **Enable Icons** on and a badge on one tab.

| Tabs block | Tab Panels |
|---|---|
| Tab Style **Standard** · Orientation **Horizontal** · Alignment **Start** · Mobile **Accordion** · Enable Icons **On** | Overview (`info` icon), Features (`star` icon, Badge "New"), Support (`chat` icon) |

![Standard horizontal tabs with icons and a badge](images/desktop-standard.png)

Keyboard focus is clearly visible when visitors use the arrow keys:

![Keyboard focus ring on a tab](images/desktop-keyboard-focus.png)

### 5.2 Vertical tabs

Tabs on the left and content on the right on desktop. Good for 4–8 tabs with longer titles. Turns horizontal on tablet and into a dropdown on mobile in this example. The last tab is **Disabled**.

| Tabs block | Tab Panels |
|---|---|
| Tab Style **Underline** · Orientation **Vertical** · Mobile **Dropdown** | Strategy, Delivery, Operations, Coming soon (**Disabled** on) |

![Vertical tabs with a disabled tab](images/desktop-vertical.png)

### 5.3 Underline tabs

A light, minimal tab bar with an underline under the selected tab. Good for in-page navigation between related topics.

| Tabs block | Tab Panels |
|---|---|
| Tab Style **Underline** · Orientation **Horizontal** · Mobile **Scrollable tabs** | Cloud, AI (Badge "New"), Data & Analytics, Cyber Security |

![Underline tabs](images/desktop-underline.png)

### 5.4 Pill tabs (with auto rotation)

Rounded "segmented control" tabs; the selected tab is filled. This example is centred and rotates every 5 seconds, with a pause/play button.

| Tabs block | Tab Panels |
|---|---|
| Tab Style **Pill** · Alignment **Center** · Auto Rotation **On** · Auto Rotation Speed **5** | Banking, Insurance, Retail |

![Pill tabs, centred, with the auto rotation pause button](images/desktop-pill.png)

> Rotation stops for good as soon as the visitor clicks or uses the keyboard. It pauses while the pointer or keyboard focus is in the block, never runs for visitors who prefer reduced motion, and is switched off inside Universal Editor.

### 5.5 Card tabs

Each tab is a card with a title and short description. Good for 2–4 options that need explaining. In this example the second tab is the **Default Active** tab and has a badge.

| Tabs block | Tab Panels |
|---|---|
| Tab Style **Card** · Alignment **Stretch** | Each panel has a **Description**; Design has **Default Active** on and Badge "Popular" |

![Card tabs with descriptions; the second tab is open by default](images/desktop-card.png)

### 5.6 Image tabs

Each tab shows a thumbnail image, title and description. Good for visual choices such as products or industries.

| Tabs block | Tab Panels |
|---|---|
| Tab Style **Image** | Each panel has an **Image Thumbnail** and **Description** |

![Image tabs with thumbnails](images/desktop-image.png)

> Thumbnails are decorative (the tab title already describes the tab), so they don't need alt text.

### 5.7 Mega tabs

Large card-style tabs over **full-width panels**, so full-bleed blocks like a Hero span the page. Use this for major landing-page sections. This example uses the **Dark** theme; the first panel holds a Hero block followed by a Cards block.

| Tabs block | Tab Panels |
|---|---|
| Tab Style **Mega** · Theme **Dark** · Mobile **Accordion** | Platforms (Hero + Cards), Products (Text + Columns), Partners (Text); each with a **Description** |

![Mega tabs on the dark theme with a full-width hero and cards inside the panel](images/desktop-mega.png)

Mega tabs can hold any block: Hero, Cards, Columns, Fragment, forms, video, and custom blocks added later.

### 5.8 Numbered tabs (with sticky tabs)

Tabs with step numbers. Good for processes such as Plan, Build, Run. This example also has **Sticky Tabs** on.

| Tabs block | Tab Panels |
|---|---|
| Tab Style **Numbered** · Sticky Tabs **On** | Plan, Build, Run |

![Numbered tabs](images/desktop-numbered.png)

### 5.9 Sticky tabs

Any style can be sticky. While the visitor scrolls through a long panel, the tab bar stays pinned to the top (below the site header):

![The numbered tab bar stays pinned while the panel scrolls](images/desktop-sticky-scrolled.png)

### 5.10 Icon tabs

The icon sits above the label. This example uses the **Brand** theme and is centred.

| Tabs block | Tab Panels |
|---|---|
| Tab Style **Icon** · Alignment **Center** · Theme **Brand** | About (`info`), Highlights (`star`), Contact (`chat`) |

![Icon tabs on the brand theme](images/desktop-icon.png)

> **Icon** (style) stacks the icon above the label. **Enable Icons** (toggle) adds icons next to the label on any other style, as in 5.1.

### 5.11 Quick picker

| If you need… | Choose |
|---|---|
| A simple tab bar | Standard or Underline |
| A compact switch between 2–4 short options | Pill |
| Tabs that explain each option | Card |
| Visual choices | Image |
| Full-width page sections with heroes | Mega |
| Step-by-step content | Numbered |
| Many tabs or long titles | Orientation **Vertical** |
| Long panels | **Sticky Tabs** on |
| A showcase that cycles on its own | **Auto Rotation** on |

---

## 6. Tablet and mobile behaviour

### 6.1 Tablet (600–899px)

Tabs are always horizontal on tablet. If they don't fit, the tab bar scrolls sideways (swipe), and the selected tab is kept in view.

Vertical tabs become horizontal on tablet:

![Vertical tabs shown horizontally on tablet](images/tablet-vertical-as-horizontal.png)

Card tabs scroll sideways when they don't fit:

![Card tabs on tablet](images/tablet-card-scroll.png)

### 6.2 Mobile (below 600px): author's choice

Choose **Mobile Behaviour** on the Tabs block:

**Scrollable tabs**: the tab bar stays and scrolls sideways.

![Scrollable underline tabs on mobile](images/mobile-scroll-underline.png)

![Scrollable card tabs on mobile](images/mobile-scroll-card.png)

**Accordion**: each tab becomes a collapsible heading. One section is open at a time, and visitors can close them all.

![Accordion behaviour on mobile](images/mobile-accordion.png)

**Dropdown**: a select menu replaces the tab bar. Disabled tabs can't be chosen.

![Dropdown behaviour on mobile](images/mobile-dropdown.png)

| Mobile Behaviour | Best for |
|---|---|
| Scrollable tabs | 2–5 short titles |
| Accordion | Long content, many tabs, or Mega tabs |
| Dropdown | Many tabs with short panels |

---

## 7. Accessibility: what is built in and what authors need to do

**Built in:**

- Correct tab semantics for screen readers: tab list, tabs (with selected state) and tab panels, each linked to the other.
- Keyboard: **Tab** moves into the tab bar, **← → ↑ ↓** move between tabs, **Home**/**End** jump to the first or last tab. Disabled tabs are skipped.
- Visible focus outline on every interactive element.
- Tabs are at least 44px tall for easy tapping.
- The accordion and dropdown modes use their own correct semantics on mobile.
- Auto rotation has a pause/play button, pauses on hover and focus, and respects reduced-motion settings.

**Authors should:**

- Always give the Tabs block a **Heading**. It names the tab bar for screen-reader users.
- Write short, unique **Tab Titles** that describe each panel's content.
- Keep headings inside panels in order: if the Tabs heading is H2, use H3 inside panels.
- Add **alt text** to meaningful images inside panels (tab thumbnails don't need it).
- Use **Auto Rotation** sparingly, and only for non-essential showcase content.

---

## 8. Tips, limits and troubleshooting

| Situation | What's happening / what to do |
|---|---|
| I added a Tabs block but no tabs appear | Add **Tab Panel** sections directly after the section containing the Tabs block |
| A tab is missing from the tab bar | Make sure no normal section sits between the panels, and that the panel has a **Tab Title** |
| Adding the Tabs block didn't create Tab 1–3 | Universal Editor inserts one component at a time, so add the panels yourself (each starts as "New Tab") |
| I want tabs inside a tab | Not supported: a Tabs block inside a Tab Panel shows a notice in the editor and is ignored on the live page |
| The wrong tab opens on page load | Check **Default Active** (the first panel with it on wins). A `#tab-id` in the URL takes priority |
| A deep link doesn't open the tab | Check the panel's **Tab ID** matches the link, e.g. `#cloud` |
| An icon doesn't show | **Enable Icons** must be on (or use the Icon style), and the icon name must match a file in `/icons` |
| Auto rotation doesn't run in the editor | Expected: it is switched off in Universal Editor and for visitors who prefer reduced motion |

---

## 9. Testing locally

The sandbox page used for the screenshots is in the repository at `drafts/tabs.plain.html`. It is excluded from the published site. To view it:

```bash
npx aem up --html-folder drafts --port 3001
# then open http://localhost:3001/drafts/tabs
```

Developer details (decorated HTML, JavaScript and CSS architecture, extensibility) are in `blocks/tabs/README.md`.
