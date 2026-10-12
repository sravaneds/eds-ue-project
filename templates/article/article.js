import { getMetadata } from '../../scripts/aem.js';

const ARTICLE_DETAILS = [
  ['author', 'By'],
  ['publication-date', 'Published'],
  ['reading-time', ''],
];

function buildArticleDetails() {
  const details = ARTICLE_DETAILS
    .map(([key, label]) => ({ label, value: getMetadata(key).trim() }))
    .filter(({ value }) => value);
  if (!details.length) return null;

  const list = document.createElement('ul');
  list.className = 'article-details';
  list.setAttribute('aria-label', 'Article details');
  details.forEach(({ label, value }) => {
    const item = document.createElement('li');
    item.textContent = label ? `${label} ${value}` : value;
    list.append(item);
  });
  return list;
}

/**
 * Article template: adds optional editorial metadata below the page title.
 * @param {Element} main The main element (not yet decorated)
 */
export default function decorate(main) {
  if (main.querySelector('.article-details')) return;
  const heading = main.querySelector('h1');
  const details = buildArticleDetails();
  if (heading && details) heading.after(details);
}
