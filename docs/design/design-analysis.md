# Design Analysis, Style Guide and Block Strategy

Source: Figma file `yElx5Tf9wr8G2vCXopi49W` ("New Screens from New DS").

| Page | Desktop (1440) | Tablet (1024) | Mobile (402) |
|---|---|---|---|
| Home | `229:15426` | `671:52732` | `671:53791` |
| What we do | `3857:47575` | `2649:17959` | `2649:18406` |
| List: Transformation themes | `4308:42512` | `4978:53601` | `4978:53801` |
| List: Insight & Opinion | `4158:171743` | `4158:171946` | `4158:172357` |

**Scope.** This pass implements the **List** block in both variations. The other sections were identified from the page frames (section 3) and are planned in the roadmap (section 10). The Hero block was implemented earlier.

---

## 1. Design analysis

### Page structure

Every section follows the same frame. A **header wrapper** holds a heading lockup (heading, plus an optional CTA). A **content wrapper** holds a slot. Both sit inside a 1440 frame with 80px side padding (`LR Padding`) and 120px top and bottom padding (`TB Padding`), so the content is 1280 wide.

**Home sections, top to bottom:**
1. Hero Header
2. Transformation themes (List)
3. Mixed content section, Insight & Opinion (List)
4. Intelligent Personalisation Block
5. Industries
6. Collection: Agentic AI
7. Intelligence in action
8. Four-column grid
9. Careers
10. Footer

Nav and a Floating menu sit above the page.

**What we do sections, top to bottom:**
1. Hero Header
2. Text Block
3. AI Pillars ×3
4. Human + AI autonomy model
5. Intelligent Personalisation Block
6. Feature card ×3
7. Text Block
8. Text & Image ×3
9. Footer

### List: Transformation themes (`4308:42512`)

- **Header:** heading "The future in focus", Inter SemiBold 40/56, −1px tracking, `#0c0c0d`.
- **Items:** 4 cards of 302×453, 24px gap, 16px radius, 24px inner padding. Text sits at the top and the link at the bottom (`justify-content: space-between`).

| Card surface | Eyebrow | Title | Description | Link |
|---|---|---|---|---|
| Dark `#20293c` | `#cdcdcd` | `#f3f3f3` | white at 70% | white "Explore →" |
| Brand `#216ac3` | white | white | white at 70% | white |
| Image | `#0c0c0d` | `#303030` | – | – |

- **Type:**
  - Eyebrow: Inter Medium 14/22, +0.14px tracking, uppercase.
  - Title: SemiBold 28/34, −0.84px tracking.
  - Description: Medium 16/26, +0.16px tracking.
  - Link: Regular 16/16 with a 24px arrow.
- **Tablet:** 4 columns at 1024 (narrower cards).
- **Mobile:** horizontal swipe row. Cards are 306×459 with 16px gap and 16px side inset. A 4px progress indicator sits below: track `#ededed`, thumb `#808080`, 2px radius. The heading drops to 28/39.

### List: Insight & Opinion (`4158:171743`)

- **Header:** heading "Ideas shaping impact" (40/56). On the right, a pill button "Explore insights →": 1px `#303030` border, `#f5f5f5` fill, 12px 16px 12px 24px padding, 48px min-height, Medium 16/16.
  - **Tablet:** the button is a plain text link.
  - **Mobile:** the link sits below the heading, Medium 12px.
- **Featured card:** full width, 1280×570, image background, 40px padding (24px on mobile), 16px radius.
  - Meta line: "BANKING | CORE MODERNISATION | 14m". Tags are Medium 14/22 uppercase `#5a5a5a`; the dividers are `#999`.
  - Title: Medium 48/58, −1.44px tracking, black, max width 600.
  - **Mobile:** 354×520.
- **Supporting cards:** a row of 4 (302 wide, 24px gap):

| Card | Figma component | Structure |
|---|---|---|
| Article | `Cards / Blog` | 170px image (16px radius) → meta (tags \| read time) → title Regular 24/34 `#303030` → footer "Perspective \| 15th Oct 2026" Medium 16/22 `#0c0c0d` |
| Report | `card / report` | 453 tall, light grey gradient, 24px padding: eyebrow, title SemiBold 28/34, description at 70%, "Download →" at the bottom |
| Case study | `Case study` | 302px square image → tags → title Regular 24/34 |

- **Tablet:** 4 columns.
- **Mobile:** one column, cards full width (354).

---

## 2. Style guide

### Typography (Inter, already self-hosted in `fonts/inter.woff2`)

| Token | Size / line height | Weight | Tracking | Used for |
|---|---|---|---|---|
| Headings/Inter-40 | 40 / 56 | 600 | −1px | Section heading (desktop) |
| Section heading (mobile) | 28 / 39 | 600 | −0.7px | Section heading (mobile) |
| Feature title | 48 / 58 | 500 | −1.44px | Featured card title |
| Headings/Inter-28 | 28 / 34 | 600 | −0.84px | Card titles (themes, report) |
| Article title | 24 / 34 | 400 | −0.36px | Article and case study titles |
| Body/Inter-16 | 16 / 26 | 500 | +0.16px | Card description |
| Body/Inter-14 | 14 / 22 | 500 | +0.14px, uppercase | Eyebrow, tags |
| Label | 16 / 16 | 400–500 | +0.16px | Links and buttons |

### Colours

| Token | Value | Use |
|---|---|---|
| Text/Default | `#0c0c0d` | Headings, footer meta |
| Text/Neutral | `#303030` | Card titles, button border |
| Text/Secondary | `#5a5a5a` | Tags, read time |
| Divider | `#999999` | Meta separators |
| Background/Card dark | `#20293c` | Dark theme card |
| Brand/400 | `#216ac3` | Brand theme card |
| Neutral/100 | `#ededed` | Indicator track |
| Neutral/500 | `#808080` | Indicator thumb |
| Background/Secondary | `#f5f5f5` | Pill button fill |

### Spacing, radius and layout

- **Spacing scale:** 8, 12, 16, 24, 40, 80, 120.
- **Section padding:** 120 top and bottom, 80 sides (desktop). 64 top and bottom, 16–24 sides (mobile).
- **Content width:** 1280 (1440 frame minus 2×80). Grid gap 24.
- **Radius:** L = 16 (cards, images), Full = 9999 (pill buttons), 2 (indicator).

### Breakpoints

Figma frames are 402, 1024 and 1440. They map to the project's mobile-first `min-width` steps:
- **Below 600:** mobile.
- **600–1199:** tablet. 900 is used where the 4-column grid starts.
- **1200 and up:** desktop.

### UI elements

- **Arrow link:** text plus a 24px `arrow-right` icon. Reuses `icons/arrow-right.svg` as a CSS mask, so it inherits the text colour.
- **Pill button:** desktop only.
- **Meta line:** values separated by "|" dividers.
- **Scroll indicator:** on mobile only.

### Accessibility notes from the design

- White text passes AA on both text-card surfaces: about 15:1 on `#20293c` and 5.4:1 on `#216ac3`.
- The description at 70% white passes on dark cards (7.9:1) but not on brand cards (3.5:1). The CSS uses 90% white on brand cards (4.7:1).
- `#5a5a5a` on white is 6.9:1. The `#999` dividers are decorative and hidden from screen readers.

---

## 3. Block inventory

| Block | Purpose | Reuse score | Pages | Variations | Responsive behaviour | Authoring |
|---|---|---|---|---|---|---|
| **List** (this pass) | Heading, optional CTA, and a set of content cards | **High (5/5)** | Home ×2, and fits Collection, Intelligence in action, Four-column grid | Themes, Insights | 4 columns → 4 → swipe row (Themes) or stack (Insights) | Heading, header link, card items |
| Hero | Page intro | High | Home, What we do | – | Implemented | Implemented |
| Text Block | Statement paragraph | High | What we do ×2 | – | Single column | Default content (no block needed) |
| AI Pillars / Text & Image | Media plus text rows | Medium | What we do ×6 | Image left or right | Stack on mobile | Planned |
| Feature card | Large promo card | Medium | What we do ×3 | – | Full width | Candidate to reuse List "Featured" |
| Intelligent Personalisation | Personalised promo | Page-specific | Home, What we do | – | – | Planned |
| Industries, Careers | Showcase sections | Medium | Home | – | – | Planned |
| Header, Footer, Floating menu | Global chrome | Global | All | – | – | Existing header/footer, restyle planned |

---

## 4. Reusable block strategy

- **Highly reusable:** **List** is the shared "heading + cards" pattern. Many home sections (Transformation themes, Insight & Opinion, Collection, Intelligence in action, Four-column grid) use the same header lockup and a card slot. One block with card item types covers them, instead of one block per section.
- **Moderately reusable:** Text & Image / AI Pillars (one media-text block with an image-side option), and Feature card (the List featured card covers the visual).
- **Page-specific:** Intelligent Personalisation, Human + AI autonomy model.
- **Not a block:** Text Block is default content (a Text component in a section).

---

## 5. Block authoring matrix: List

Every field maps to something visible in Figma. There are no alignment, spacing or colour pickers except **Card colour**: the design has two text-card surfaces (dark and brand), and nothing in the content can tell them apart.

### List (block)

| Field | Type | Figma source | Why it's needed |
|---|---|---|---|
| Variation | select: Themes / Insights | The two variants requested | Picks the layout: themes cards, or featured plus supporting cards |
| Heading | text, required, ≤80 | `header-body-text-lockup` heading | Section heading on both variants |
| Header link + Header link text | aem-content + text | "Explore insights →" button | Optional section CTA (Insights) |

### Theme card (item, Themes)

| Field | Type | Figma source |
|---|---|---|
| Background image + Alt text | reference + text | "card / theme / image" (cards 2 and 4) |
| Eyebrow | text, ≤40 | "AI ADOPTION" |
| Title | text, required, ≤90 | Card title |
| Description | text, ≤180 | Card description |
| Link + Link text | aem-content + text | "Explore →" (defaults to "Explore") |
| Card colour | select: Dark / Brand | Dark `#20293c` and brand `#216ac3` cards (used when there's no image) |

### Insight card (item, Insights)

| Field | Type | Figma source |
|---|---|---|
| Card type | select: Article / Featured / Report / Case study | The Figma components `Cards / Blog`, `Feature card`, `card / report`, `Case study` |
| Image + Alt text | reference + text | Card image (not used by Report) |
| Tags | text, comma separated | "BANKING \| CORE MODERNISATION" |
| Read time | text | "14m" |
| Title | text, required | Card title |
| Description | text | Report description |
| Link + Link text | aem-content + text | The card's target. Link text shows as "Download →" on reports |
| Content type | text | "Perspective", "Blog" (footer) |
| Date | text | "15th Oct 2026" (footer) |

**Fields deliberately left out:**
- Heading level: always H2, with H3 for cards.
- Text alignment, column count, spacing.
- Overlay toggles: image cards in Figma have no overlay.

---

## 6. Universal Editor models

Defined in `blocks/list/_list.json` and aggregated with `npm run build:json`.

| Component | id | Resource type | Model | Filter |
|---|---|---|---|---|
| List | `list` | `block/v1/block` | `list` | `list` |
| Theme card | `list-theme` | `block/v1/block/item` | `list-theme` | – |
| Insight card | `list-insight` | `block/v1/block/item` | `list-insight` | – |

- **Filter `list`:** allows `list-theme` and `list-insight`.
- **Section filter:** `list` is added, so List can be used in normal sections and in Tabs.
- **Validation:** heading and card titles are required, with length limits on text fields.
- **Cells:** both item models render one cell per field, read by position. The `xwalk/max-cells` rule has overrides: `list-theme` 6, `list-insight` 9.

Field names avoid the reserved `Type` suffix (it collapses into a sibling field): the card type is `variant` and the content type is `format`.

---

## 7. Block development

The List block is in `blocks/list/`: `_list.json`, `list.js`, `list.css` and `README.md`. The README covers content structure, decorated HTML, behaviour, accessibility, responsive rules and authoring guidelines. The sandbox page is `drafts/list` (both variations).

Verified in the local preview against the Figma frames:

| Check | Figma | Rendered |
|---|---|---|
| Content width at 1440 | 1280 | 1280 |
| Theme card | 302×453 | 302×453 |
| Featured card (desktop / mobile) | 1280×570 / 354×520 | 1280×570 / 354×520 |
| Article image / case-study image | 302×170 / 302×302 | 302×170 / 302×302 |
| Section heading | 40/56 SemiBold | 40px/56px 600 |
| Header to content gap | 40 | 40 |
| Mobile theme card | 306×459 at x=16 | about 303×455 at x=16 |

Screenshots: `images/list-desktop.jpg`, `images/list-tablet.jpg`, `images/list-mobile.jpg`.

## 8. EDS best practices applied

- No dependencies or build step. The block is loaded only where it's used.
- Uses `createOptimizedPicture` (WebP, responsive sources) and lazy-loaded images.
- The arrow icon is a CSS mask of the existing SVG, so there are no extra requests per card.
- Mobile-first CSS with 600/900/1200 `min-width` steps. All selectors are scoped to `.list`. No `list-container` or `list-wrapper` classes are created; the wrapper is only sized.
- Content model follows David's Model: semantic fields, no layout controls. It passes the xwalk lint rules: max-cells overrides, no orphan collapsible fields.
- Universal Editor instrumentation is preserved during decoration. Editor-only behaviour: no click overlay.

## 9. Accessibility review

| Area | Result |
|---|---|
| Headings | `h2` section heading and `h3` card titles |
| Semantics | Cards, tags and footer meta are lists. Dividers are skipped by screen readers |
| Links | Whole-card targets via one real link per card. Generic CTA text is described by the title |
| Keyboard | All cards are reachable with Tab, with a visible focus ring around the card. The swipe row scrolls to the focused link |
| Contrast | All text meets AA. The brand card description is raised to 90% white (Figma: 70%, 3.5:1) |
| Targets | Links are at least 48px tall |
| Motion | The arrow nudge is turned off with `prefers-reduced-motion` |
| Images | Alt text is authorable. Decorative images get an empty alt |

**Advisories:**
- The mobile header link is 12px in Figma, which is small but allowed.
- Text over theme and featured images relies on light image areas. Authors should choose images accordingly.

## 10. Final deliverables and roadmap

**Delivered:**
- This document (phases 1–6 and 8–9).
- The List block with Themes and Insights variations.
- UE models and filters, lint overrides, the sandbox page and responsive screenshots.

**Responsive review:** desktop, tablet and mobile checked. There is no horizontal page overflow, the swipe indicator tracks scrolling, and cards grow with content instead of clipping.

**Roadmap (next blocks, by reuse):**
1. Apply List to the remaining home "heading + cards" sections: Collection, Intelligence in action, Four-column grid. Add card types only where Figma introduces new ones.
2. Text & Image / AI Pillars: a media-text block, with image side as content order rather than a style option.
3. Industries and Careers showcases.
4. Intelligent Personalisation (page-specific).
5. Header, footer and floating menu restyle to the new design system.
6. Move the shared tokens (Inter type scale, colours, spacing) from block scope into `styles/styles.css` once a second block needs them.
