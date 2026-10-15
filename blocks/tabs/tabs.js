import { loadFragment } from '../fragment/fragment.js';
import initTabs, {
  DEFAULT_INTERVAL, MIN_INTERVAL, isEditor, stripInstrumentation, uniqueTabId,
} from './tabs-core.js';

/**
 * Legacy Tabs block. New content uses the Tabs section container (Add → Tabs at page
 * level, with Tab markers and any blocks inside). This block is kept so pages authored
 * with it keep rendering: each Tab item shows its Tab Content fragment or, for the oldest
 * tabs, its inline heading, image and rich text.
 */

/**
 * Cell order of a Tab item, matching the "tabs-item" model in _tabs.json.
 */
const CELLS = [
  'title', 'fragment', 'anchor', 'icon', 'badge',
  'summary', 'thumbnail', 'active', 'disabled', 'analytics', 'content',
];

/**
 * Returns a same-origin path for a fragment reference, or an empty string.
 * @param {Element} cell The fragment cell
 * @returns {string}
 */
function readFragmentPath(cell) {
  if (!cell) return '';
  const raw = cell.querySelector('a')?.getAttribute('href') || cell.textContent.trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, window.location.href);
    return url.origin === window.location.origin ? url.pathname : '';
  } catch {
    return '';
  }
}

/**
 * Splits the block rows into block settings (single cell rows) and Tab items.
 * @param {Element} block The tabs block
 */
function readRows(block) {
  const rows = { header: [], items: [], interval: DEFAULT_INTERVAL };
  const settings = [];
  [...block.children].forEach((row) => {
    if (row.children.length > 1 || row.dataset.aueModel === 'tabs-item') rows.items.push(row);
    else settings.push(row);
  });
  settings.forEach((row, i) => {
    const text = row.textContent.trim();
    if (i === settings.length - 1 && /^\d+(\.\d+)?$/.test(text)) {
      rows.interval = Math.max(MIN_INTERVAL, Number(text));
      row.remove();
    } else if (text) {
      row.classList.add(row.querySelector('h1, h2, h3, h4, h5, h6') ? 'tabs-heading' : 'tabs-description');
      rows.header.push(row);
    } else {
      row.remove();
    }
  });
  return rows;
}

/**
 * Reads a Tab item row; the row itself becomes the panel so it stays selectable in the editor.
 * @param {Element} row The Tab item row
 * @param {number} index Position of the tab
 * @param {Set<string>} usedIds Ids already taken
 */
function readTab(row, index, usedIds) {
  const cells = Object.fromEntries(CELLS.map((name, i) => [name, row.children[i]]));
  const text = (name) => cells[name]?.textContent.trim() || '';
  const title = text('title') || `Tab ${index + 1}`;

  const thumbnail = cells.thumbnail?.querySelector('picture') || cells.thumbnail?.querySelector('img');
  if (thumbnail) {
    stripInstrumentation(thumbnail);
    thumbnail.querySelector('img')?.setAttribute('alt', '');
    if (thumbnail.tagName === 'IMG') thumbnail.alt = '';
  }

  const fragment = readFragmentPath(cells.fragment);
  const legacy = cells.content?.textContent.trim() || cells.content?.querySelector('picture') ? cells.content : null;
  const content = document.createElement('div');
  content.className = 'tabs-panel-content';
  if (!fragment && legacy) {
    content.classList.add('tabs-legacy');
    content.append(...legacy.childNodes);
  }
  row.replaceChildren(content);
  row.className = '';

  const tab = {
    id: uniqueTabId(text('anchor') || title, index, usedIds, row),
    title,
    icon: text('icon'),
    badge: text('badge'),
    description: text('summary'),
    thumbnail,
    active: text('active') === 'true',
    disabled: text('disabled') === 'true',
    analytics: text('analytics'),
    panel: row,
    content,
    emptyNotice: 'This is a legacy Tabs block. Use Add → Tabs at page level to build tabs with any blocks inside.',
  };
  if (fragment) {
    tab.load = async () => {
      const main = await loadFragment(fragment);
      if (main) content.replaceChildren(...main.childNodes);
    };
    tab.prefetch = () => fetch(`${fragment.replace(/(\.plain)?\.html$/, '')}.plain.html`).catch(() => {});
  }
  return tab;
}

/**
 * Decorates the legacy Tabs block.
 * @param {Element} block The tabs block
 */
export default async function decorate(block) {
  const { header, items, interval } = readRows(block);
  const usedIds = new Set();
  const tabs = items.map((row, i) => readTab(row, i, usedIds));
  await initTabs(block, {
    header,
    tabs,
    interval,
    emptyNotice: isEditor() ? 'This is a legacy Tabs block. Use Add → Tabs at page level to build tabs with any blocks inside.' : '',
  });
}
