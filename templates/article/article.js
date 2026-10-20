import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders, placeholder } from '../../scripts/placeholders.js';
import { fetchTaxonomy, getPageTags, tagTitle } from '../../scripts/taxonomy.js';

// page metadata shown below the title: [metadata name, placeholder key, fallback label]
const ARTICLE_DETAILS = [
  ['author', 'by', 'By'],
  ['publication-date', 'published', 'Published'],
  ['reading-time', '', ''],
];

function buildArticleDetails() {
  const details = ARTICLE_DETAILS
    .map(([name, key, fallback]) => ({ key, fallback, value: getMetadata(name).trim() }))
    .filter(({ value }) => value);
  if (!details.length) return null;

  const list = document.createElement('ul');
  list.className = 'article-details';
  list.setAttribute('aria-label', 'Article details');
  details.forEach(({ key, fallback, value }) => {
    const item = document.createElement('li');
    if (key) {
      const label = document.createElement('span');
      label.className = 'article-details-label';
      label.dataset.placeholder = key;
      label.textContent = fallback;
      item.append(label, ` ${value}`);
    } else {
      item.textContent = value;
    }
    list.append(item);
  });
  return list;
}

function buildTags() {
  const tags = getPageTags();
  if (!tags.length) return null;
  const list = document.createElement('ul');
  list.className = 'article-tags';
  list.setAttribute('aria-label', 'Tags');
  list.dataset.placeholderLabel = 'tags';
  tags.forEach((tag) => {
    const item = document.createElement('li');
    item.dataset.tag = tag;
    // readable name from the ID until the taxonomy title arrives
    item.textContent = tagTitle(tag);
    list.append(item);
  });
  return list;
}

/**
 * Replaces fallback labels with placeholders and tag IDs with taxonomy titles.
 * Runs after first paint, so the page never waits for the spreadsheets.
 * @param {Element} main The main element
 */
async function localize(main) {
  const [placeholders, taxonomy] = await Promise.all([fetchPlaceholders(), fetchTaxonomy()]);
  main.querySelectorAll('.article-details [data-placeholder]').forEach((label) => {
    label.textContent = placeholder(placeholders, label.dataset.placeholder, label.textContent);
  });
  const tags = main.querySelector('.article-tags');
  if (tags) {
    tags.setAttribute('aria-label', placeholder(placeholders, 'tags', 'Tags'));
    tags.querySelectorAll('[data-tag]').forEach((item) => {
      item.textContent = tagTitle(item.dataset.tag, taxonomy);
    });
  }
}

/**
 * Article template: adds editorial metadata and tags below the page title.
 * @param {Element} main The main element (not yet decorated)
 */
export default function decorate(main) {
  if (main.querySelector('.article-details')) return;
  const heading = main.querySelector('h1');
  if (!heading) return;
  const elements = [buildArticleDetails(), buildTags()].filter(Boolean);
  if (!elements.length) return;
  heading.after(...elements);
  localize(main);
}
