import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Cell order of the card models (see _list.json). Every field renders a cell, even when
 * empty, so cells are read by position. The cell count tells the two card types apart.
 */
const THEME_CELLS = ['image', 'eyebrow', 'title', 'description', 'link', 'surface'];
const INSIGHT_CELLS = ['variant', 'image', 'tags', 'readTime', 'title', 'description', 'link', 'format', 'date'];
const INSIGHT_VARIANTS = ['article', 'featured', 'report', 'case-study'];

const isEditor = (block) => block.hasAttribute('data-aue-resource');

/**
 * Creates an element from the content of a cell, keeping Universal Editor instrumentation
 * so the field stays editable in place.
 * @param {Element} cell The source cell
 * @param {string} tag Tag of the new element
 * @param {string} className Class of the new element
 * @returns {Element|null} The new element, or null when the cell is empty
 */
function fromCell(cell, tag, className) {
  if (!cell || !cell.textContent.trim()) return null;
  const el = document.createElement(tag);
  el.className = className;
  moveInstrumentation(cell, el);
  const only = cell.children.length === 1 ? cell.firstElementChild : null;
  const source = only && only.matches('p, h1, h2, h3, h4, h5, h6') ? only : cell;
  if (source !== cell) moveInstrumentation(source, el);
  el.append(...source.childNodes);
  return el;
}

/**
 * Returns an optimized picture from a cell, keeping the image's instrumentation.
 * @param {Element} cell The image cell
 * @param {string} width Rendition width
 * @param {boolean} eager Load the image eagerly
 * @returns {Element|null} The picture
 */
function pictureFrom(cell, width, eager = false) {
  const img = cell?.querySelector('picture img, img');
  if (!img) return null;
  const picture = createOptimizedPicture(img.src, img.alt, eager, [
    { media: '(width >= 900px)', width },
    { width: '750' },
  ]);
  moveInstrumentation(img, picture.querySelector('img'));
  return picture;
}

/**
 * Builds an arrow link from a link cell.
 * @param {Element} cell The link cell
 * @param {string} fallbackText Text used when the author left the link text empty
 * @returns {HTMLAnchorElement|null} The link
 */
function linkFrom(cell, fallbackText) {
  const a = cell?.querySelector('a');
  if (!a) return null;
  a.className = 'list-link';
  a.closest('.button-container')?.classList.remove('button-container');
  const text = a.textContent.trim();
  if (!text || text === a.getAttribute('href') || text === a.href) {
    if (!fallbackText) return a;
    a.textContent = fallbackText;
  }
  const arrow = document.createElement('span');
  arrow.className = 'list-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  a.append(arrow);
  return a;
}

/**
 * Builds a meta line from tags (comma separated) and an optional read time.
 * @param {Element} tagsCell Tags cell
 * @param {Element} timeCell Read time cell
 * @param {string} className Class of the list
 * @returns {Element|null} The meta list
 */
function metaFrom(tagsCell, timeCell, className = 'list-meta') {
  const items = (tagsCell?.textContent || '').split(',').map((t) => t.trim()).filter(Boolean);
  const time = timeCell?.textContent.trim();
  if (!items.length && !time) return null;
  const ul = document.createElement('ul');
  ul.className = className;
  if (tagsCell) moveInstrumentation(tagsCell.firstElementChild || tagsCell, ul);
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.append(li);
  });
  if (time) {
    const li = document.createElement('li');
    li.className = 'list-read-time';
    if (timeCell) moveInstrumentation(timeCell.firstElementChild || timeCell, li);
    li.innerHTML = '<span class="list-sr-only">Read time </span>';
    li.append(time);
    ul.append(li);
  }
  return ul;
}

/**
 * Turns the card title into the card link (cards without a visible CTA).
 * @param {Element} title The title element
 * @param {Element} cell The link cell
 * @returns {HTMLAnchorElement|null} The title link
 */
function titleLink(title, cell) {
  const source = cell?.querySelector('a');
  if (!source || !title) return null;
  const link = document.createElement('a');
  link.href = source.href;
  link.className = 'list-title-link';
  moveInstrumentation(source, link);
  link.append(...title.childNodes);
  title.append(link);
  return link;
}

/**
 * Builds the visible CTA line of a card.
 * @param {HTMLAnchorElement} link The link
 * @returns {Element} The CTA paragraph
 */
function actionFor(link) {
  const action = document.createElement('p');
  action.className = 'list-card-action';
  action.append(link);
  return action;
}

let titleCount = 0;

/**
 * Makes the whole card clickable via the given link (outside the editor, where clicks
 * select components instead). A generic link text ("Explore") is described by the title.
 * @param {Element} card The card
 * @param {HTMLAnchorElement} link The card link
 * @param {Element} block The block
 */
function stretchLink(card, link, block) {
  if (!link) return;
  const title = card.querySelector('.list-card-title');
  if (title && !title.contains(link)) {
    titleCount += 1;
    title.id = title.id || `list-title-${titleCount}`;
    link.setAttribute('aria-describedby', title.id);
  }
  if (!isEditor(block)) {
    card.classList.add('list-card-linked');
    link.classList.add('list-link-stretched');
  }
}

/**
 * Decorates a Theme card.
 * @param {Element} li The card
 * @param {Element[]} cells The card cells
 * @param {Element} block The block
 */
function decorateTheme(li, cells, block) {
  const c = Object.fromEntries(THEME_CELLS.map((name, i) => [name, cells[i]]));
  const picture = pictureFrom(c.image, '600');
  const surface = c.surface?.textContent.trim() === 'brand' ? 'brand' : 'dark';
  li.classList.add('list-card', 'list-theme-card', picture ? 'has-image' : `surface-${surface}`);

  const title = fromCell(c.title, 'h3', 'list-card-title');
  const text = document.createElement('div');
  text.className = 'list-card-text';
  text.append(...[
    fromCell(c.eyebrow, 'p', 'list-eyebrow'),
    title,
    fromCell(c.description, 'p', 'list-card-description'),
  ].filter(Boolean));

  const body = document.createElement('div');
  body.className = 'list-card-body';
  body.append(text);
  // Image cards have no visible CTA (an arrow link would sit on the picture): the title links
  const link = picture ? titleLink(title, c.link) : linkFrom(c.link, 'Explore');
  if (link && !picture) body.append(actionFor(link));
  if (picture) {
    picture.classList.add('list-card-bg');
    li.append(picture);
  }
  li.append(body);
  stretchLink(li, link, block);
}

/**
 * Decorates an Insight card.
 * @param {Element} li The card
 * @param {Element[]} cells The card cells
 * @param {Element} block The block
 */
function decorateInsight(li, cells, block) {
  const c = Object.fromEntries(INSIGHT_CELLS.map((name, i) => [name, cells[i]]));
  const authored = c.variant?.textContent.trim();
  const variant = INSIGHT_VARIANTS.includes(authored) ? authored : 'article';
  li.classList.add('list-card', 'list-insight-card', `list-${variant}`);

  const picture = variant === 'report' ? null : pictureFrom(c.image, variant === 'featured' ? '1400' : '600');
  const title = fromCell(c.title, 'h3', 'list-card-title');
  const body = document.createElement('div');
  body.className = 'list-card-body';

  let link;
  if (variant === 'report') {
    // Report cards show a visible "Download →" style link
    link = linkFrom(c.link, 'Read more');
    const text = document.createElement('div');
    text.className = 'list-card-text';
    text.append(...[
      fromCell(c.tags, 'p', 'list-eyebrow'),
      title,
      fromCell(c.description, 'p', 'list-card-description'),
    ].filter(Boolean));
    body.append(text);
    if (link) body.append(actionFor(link));
  } else {
    // Other cards have no visible CTA: the title is the link
    link = titleLink(title, c.link);
    const footer = [c.format, c.date].map((cell) => cell?.textContent.trim()).filter(Boolean);
    body.append(...[metaFrom(c.tags, c.readTime), title].filter(Boolean));
    if (footer.length) {
      const ul = document.createElement('ul');
      ul.className = 'list-footer-meta';
      footer.forEach((value) => {
        const item = document.createElement('li');
        item.textContent = value;
        ul.append(item);
      });
      body.append(ul);
    }
  }
  if (picture) {
    const media = document.createElement('div');
    media.className = 'list-card-media';
    media.append(picture);
    li.append(media);
  }
  li.append(body);
  stretchLink(li, link, block);
}

/**
 * Adds the swipe progress indicator (Themes on small screens).
 * @param {Element} block The block
 * @param {Element} ul The scrolling card list
 */
function addProgress(block, ul) {
  const track = document.createElement('div');
  track.className = 'list-progress';
  track.setAttribute('aria-hidden', 'true');
  const thumb = document.createElement('span');
  track.append(thumb);
  block.append(track);

  const update = () => {
    const max = ul.scrollWidth - ul.clientWidth;
    track.hidden = max <= 1;
    const size = Math.min(1, ul.clientWidth / ul.scrollWidth);
    const progress = max > 0 ? ul.scrollLeft / max : 0;
    thumb.style.width = `${size * 100}%`;
    thumb.style.transform = `translateX(${((1 - size) / size) * progress * 100}%)`;
  };
  ul.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(ul);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const variation = block.classList.contains('insights') ? 'insights' : 'themes';
  block.classList.add(variation);

  const rows = [...block.children];
  const headerRows = rows.filter((row) => row.children.length <= 1);
  const itemRows = rows.filter((row) => row.children.length > 1);

  // Header: heading, plus an optional link
  const header = document.createElement('div');
  header.className = 'list-header';
  headerRows.forEach((row) => {
    const cell = row.firstElementChild;
    if (cell?.querySelector('a')) {
      const link = linkFrom(cell);
      if (link) {
        const p = document.createElement('p');
        p.className = 'list-header-action';
        moveInstrumentation(row, p);
        p.append(link);
        header.append(p);
      }
    } else {
      const heading = fromCell(cell, 'h2', 'list-title');
      if (heading) {
        moveInstrumentation(row, heading);
        header.prepend(heading);
      }
    }
  });

  const ul = document.createElement('ul');
  ul.className = 'list-items';
  itemRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const cells = [...row.children];
    if (cells.length >= INSIGHT_CELLS.length) decorateInsight(li, cells, block);
    else decorateTheme(li, cells, block);
    ul.append(li);
  });

  block.replaceChildren(...(header.children.length ? [header] : []), ul);
  if (variation === 'themes') addProgress(block, ul);
}
