/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero. Base: hero.
 * Source: https://main--eds-ue-project--sravaneds.aem.page/home-page
 * Target model: blocks/hero/_hero.json (xwalk)
 *   Row 1: image (+ imageAlt collapsed into img alt)
 *   Row 2: eyebrow (text)
 *   Row 3: text (richtext)
 *   Row 4: cta_link (+ cta_linkText), cta_linkTwo (+ cta_linkTwoText)
 *
 * Handles two source shapes:
 *  A) Decorated by blocks/hero/hero.js:
 *     .hero > .hero-background (picture) + .hero-content > rows (eyebrow, text, .hero-actions).
 *     A plain-text text row is ALSO classed hero-eyebrow, so non-actions rows map positionally.
 *  B) Undecorated authored block: 4 plain rows (picture / eyebrow / text / ctas).
 * Generated: 2026-10-15
 */
export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);
  const cellOf = (row) => (row ? row.querySelector(':scope > div') || row : null);
  const hasText = (node) => !!(node && node.textContent.replace(/\s+/g, ''));

  let imageRow = null;
  let eyebrowRow = null;
  let textRow = null;
  let actionsRow = null;

  const content = element.querySelector(':scope > .hero-content');
  if (content) {
    // Shape A: decorated
    imageRow = element.querySelector(':scope > .hero-background');
    const rows = [...content.children];
    actionsRow = rows.find((r) => r.classList.contains('hero-actions')) || null;
    const others = rows.filter((r) => r !== actionsRow);
    if (others.length >= 2) {
      [eyebrowRow, textRow] = others;
    } else if (others.length === 1) {
      const only = others[0];
      if (only.classList.contains('hero-text') || only.querySelector('h1, h2, h3, h4, h5, h6')) {
        textRow = only;
      } else {
        eyebrowRow = only;
      }
    }
  } else {
    // Shape B: undecorated authored rows
    const rows = [...element.children];
    if (rows.length >= 4) {
      [imageRow, eyebrowRow, textRow, actionsRow] = rows;
    } else {
      rows.forEach((row) => {
        const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
        const text = row.textContent.replace(/\s+/g, '');
        const links = [...row.querySelectorAll('a')];
        if (row.querySelector('picture, img') && !heading && !imageRow) imageRow = row;
        else if (heading && !textRow) textRow = row;
        else if (links.length && links.map((a) => a.textContent).join('').replace(/\s+/g, '') === text && !actionsRow) actionsRow = row;
        else if (text && !eyebrowRow) eyebrowRow = row;
        else if (text && !textRow) textRow = row;
      });
    }
  }

  const cells = [];

  // Row 1: image (alt collapsed)
  const imageCell = [];
  const srcImg = imageRow ? imageRow.querySelector('img') : null;
  if (srcImg && srcImg.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src').split('?')[0];
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.push(hint('image'), img);
  }
  cells.push([imageCell.length ? imageCell : '']);

  // Row 2: eyebrow (plain text)
  const eyebrowCell = cellOf(eyebrowRow);
  if (hasText(eyebrowCell)) {
    const p = document.createElement('p');
    p.textContent = eyebrowCell.textContent.trim();
    cells.push([[hint('eyebrow'), p]]);
  } else {
    cells.push(['']);
  }

  // Row 3: text (richtext, kept as authored)
  const textCell = cellOf(textRow);
  if (hasText(textCell) || (textCell && textCell.querySelector('img, picture'))) {
    cells.push([[hint('text'), ...textCell.childNodes]]);
  } else {
    cells.push(['']);
  }

  // Row 4: CTA group (link text collapsed into anchor text)
  const links = actionsRow ? [...actionsRow.querySelectorAll('a[href]')] : [];
  const ctaCell = [];
  ['cta_link', 'cta_linkTwo'].forEach((field, i) => {
    const src = links[i];
    if (!src) return;
    const a = document.createElement('a');
    a.href = src.getAttribute('href');
    a.textContent = src.textContent.trim();
    const p = document.createElement('p');
    p.append(a);
    ctaCell.push(hint(field), p);
  });
  cells.push([ctaCell.length ? ctaCell : '']);

  if (!imageCell.length && !hasText(eyebrowCell) && !hasText(textCell) && !ctaCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
