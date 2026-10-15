/**
 * Field order of the hero model (see _hero.json), used to place empty rows.
 */
const ROW_TYPES = ['background', 'eyebrow', 'text', 'actions'];

/**
 * Determines what a hero row holds based on its content.
 * @param {Element} row The block row
 * @param {number} index Position of the row in the block
 * @param {number} count Total number of rows
 * @returns {string} One of background, eyebrow, text, actions
 */
function getRowType(row, index, count) {
  const strip = (value) => value.replace(/\s+/g, '');
  const text = strip(row.textContent);
  const hasHeading = !!row.querySelector('h1, h2, h3, h4, h5, h6');
  if (row.querySelector('picture') && !hasHeading) return 'background';
  if (!text) return count === ROW_TYPES.length ? ROW_TYPES[index] : 'empty';
  if (hasHeading) return 'text';
  const links = [...row.querySelectorAll('a')];
  if (links.length && strip(links.map((a) => a.textContent).join('')) === text) return 'actions';
  return 'eyebrow';
}

/**
 * Turns the links of the actions row into hero CTAs.
 * @param {Element} row The actions row
 */
function decorateActions(row) {
  row.querySelectorAll('a').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    a.classList.add('hero-cta');
    a.closest('p')?.classList.remove('button-wrapper');
  });
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const content = document.createElement('div');
  content.className = 'hero-content';

  const sorted = { eyebrow: [], text: [], actions: [] };
  rows.forEach((row, index) => {
    const type = getRowType(row, index, rows.length);
    row.classList.add(`hero-${type}`);
    if (!row.textContent.trim() && type !== 'background') row.classList.add('hero-row-empty');
    if (type === 'actions') decorateActions(row);
    if (sorted[type]) sorted[type].push(row);
  });

  content.append(...sorted.eyebrow, ...sorted.text, ...sorted.actions);
  block.append(content);
}
