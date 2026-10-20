# List

A section heading, an optional header link, and a set of content cards. Built from the Figma "List" component in two variations:

| Variation | Figma | Layout |
|---|---|---|
| **Themes** | Transformation themes `4308:42512` | 4 theme cards (2:3). Swipe row with progress indicator below 900px |
| **Insights** | Insight & Opinion `4158:171743` | Featured card (full width), then supporting cards in 4 columns. 2 columns on small tablets, 1 on mobile |

Design analysis, style guide and authoring matrix: [`docs/design/design-analysis.md`](../../docs/design/design-analysis.md).

## Universal Editor models

| Component | id | Fields |
|---|---|---|
| List | `list` | Variation (`classes`: themes / insights), Heading, Header Link + Header Link Text |
| Theme card | `list-theme` | Background Image + Alt, Eyebrow, Title, Description, Link + Link Text, Card Colour (dark / brand) |
| Insight card | `list-insight` | Card Type (article / featured / report / case-study), Image + Alt, Tags, Read Time, Title, Description, Link + Link Text, Content Type (`format`), Date |

- **Filter:** the `list` filter allows both card types. List is available in any section, including Tabs containers (`section` filter).
- **Cell order:** card cells are read by position, in the field order of `_list.json`. Every field renders a cell, even when empty. The cell count (6 or 9) tells the two card types apart. Header rows are the single-cell rows.
- **Lint:** `xwalk/max-cells` overrides: `list-theme` 6, `list-insight` 9.

## Content structure (delivered markup)

```html
<div class="list insights">
  <div><div><p>Ideas shaping impact</p></div></div>                 <!-- Heading -->
  <div><div><p class="button-container"><a href="…">Explore insights</a></p></div></div>  <!-- Header link -->
  <div>                                                             <!-- Insight card: 9 cells -->
    <div><p>featured</p></div>  <div><picture>…</picture></div>  <div><p>Banking, Core modernisation</p></div>
    <div><p>14m</p></div>  <div><p>Enabling banking …</p></div>  <div></div>
    <div><p class="button-container"><a href="…">…</a></p></div>  <div></div>  <div></div>
  </div>
</div>
```

## Decorated structure

```html
<div class="list insights">
  <div class="list-header">
    <h2 class="list-title">Ideas shaping impact</h2>
    <p class="list-header-action"><a class="list-link">Explore insights<span class="list-arrow"></span></a></p>
  </div>
  <ul class="list-items">
    <li class="list-card list-insight-card list-featured list-card-linked">
      <div class="list-card-media"><picture>…</picture></div>
      <div class="list-card-body">
        <ul class="list-meta"><li>Banking</li><li>Core modernisation</li><li class="list-read-time">…14m</li></ul>
        <h3 class="list-card-title"><a class="list-title-link list-link-stretched">…</a></h3>
      </div>
    </li>
  </ul>
</div>
```

**Themes:**
- Cards are `li.list-theme-card` with `surface-dark`, `surface-brand` or `has-image`.
- `div.list-progress` follows the list (`aria-hidden`).

## Behaviour

- **Whole card clickable:** a stretched link overlay on the card's own link. Text cards (theme, report) use the visible arrow link. Image, article, featured and case-study cards use the title as the link. The overlay is turned off in Universal Editor, so clicks still select fields.
- **Generic link text:** "Explore" and "Download" are described by the card title (`aria-describedby`).
- **Images:**
  - Theme and supporting cards are optimised at 600px (750 on mobile).
  - Featured cards are optimised at 1400px.
  - All are lazy loaded. Lists are rarely the LCP element.
- **Mobile swipe (Themes):**
  - Uses native horizontal scroll with scroll snap.
  - The progress thumb shows the visible share and the scroll position, and hides when there's nothing to scroll.
- **Instrumentation:** Universal Editor attributes move to the new elements, so text fields stay editable in place.

## Responsive

| Width | Themes | Insights |
|---|---|---|
| < 600 | Swipe row, cards about 306px wide, indicator. Heading 28/39 | 1 column, featured 520 tall, header link below the heading (12px) |
| 600–899 | Swipe row | 2 columns |
| 900–1199 | 4 columns, card title 22/28 | 4 columns, featured title 40/50 |
| ≥ 1200 | 4 × 302, 2:3, 1280 content width (80px side padding) | Featured 1280×570 with 48/58 title, pill header button |

Cards keep a 2:3 minimum (theme, report) and grow when text is longer, so content is never clipped.

## Accessibility

- Heading structure: section heading `h2`, card titles `h3`.
- Cards are a `ul` list. The meta and footer lines are lists. Dividers are CSS-generated with empty alt text (`content: '|' / ''`), so screen readers skip them.
- Read time is announced as "Read time 14m".
- Focus ring: 2px `#216ac3`. For stretched links, it's drawn around the whole card (`:has(:focus-visible)`).
- Links and buttons are at least 48px tall. The arrow animation is off with reduced motion.
- Contrast:
  - Brand card descriptions use 90% white (4.7:1) instead of the 70% in Figma (3.5:1).
  - Dark cards: 70% white (7.9:1).
  - Tags: `#5a5a5a` on white (6.9:1).

## Authoring guidelines

1. In a section, **Add → List**. Set **Variation** and **Heading**.
2. Add cards with **Add → Theme card** (Themes) or **Add → Insight card** (Insights).
3. **Theme cards:**
   - Without an image, choose **Card Colour**. Dark and Brand blue alternate in the design.
   - With an image, text is dark, so pick images with a light area at the top.
4. **Insight cards:**
   - Start with one **Featured** card, then four supporting cards: **Article**, **Report** (no image, shows Description and the link text, e.g. "Download") or **Case study** (square image).
   - **Tags** are comma separated. **Content Type** and **Date** form the footer line, e.g. "Blog | 12th Aug 2026".
5. Add alt text for meaningful images. Leave it empty for decorative ones.
6. Keep titles short. The design fits about 50 characters on theme cards.

## Sandbox

Run `npx aem up --html-folder drafts --prefer-plain-html --port 3001`, then open `/drafts/list` (both variations). Screenshots: `docs/design/images/list-{desktop,tablet,mobile}.jpg`.
