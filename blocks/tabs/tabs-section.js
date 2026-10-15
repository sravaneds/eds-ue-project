import { loadBlock, loadCSS, readBlockConfig } from '../../scripts/aem.js';
import initTabs, {
  DEFAULT_INTERVAL, MIN_INTERVAL, initialTabIndex, isEditor, uniqueTabId,
} from './tabs-core.js';

/**
 * Tabs section container.
 *
 * A "Tabs" section (section model "tabs-section") holds Tab markers and any blocks:
 *
 *   Tabs (section)
 *   ├── Title / Text ............ optional intro, shown above the tab bar
 *   ├── Tab "Overview" .......... marker block with the tab's settings
 *   ├── Hero, Text, Cards … ..... the Overview tab's content
 *   ├── Tab "Features"
 *   └── Cards, Columns … ........ the Features tab's content
 *
 * The section is restructured before it loads, so only the opening tab's blocks load
 * with the page; blocks of other tabs load the first time their tab opens.
 */

const BOOLEAN_OPTIONS = ['icons', 'sticky', 'autorotate'];
const usedIds = new Set();

/**
 * Builds the tabs root classes from the section metadata.
 * @param {DOMStringMap} data Section dataset
 * @returns {string[]}
 */
function readClasses(data) {
  const value = (key, fallback) => (data[key] || fallback).toLowerCase().replace(/[^a-z0-9-]/g, '');
  const classes = [
    value('tabsStyle', 'standard'),
    value('tabsOrientation', 'horizontal'),
    value('tabsAlignment', 'align-start'),
    value('tabsMobile', 'mobile-scroll'),
    value('tabsTheme', 'theme-light'),
    value('tabsSize', 'size-default'),
  ];
  BOOLEAN_OPTIONS.forEach((option) => {
    if (data[`tabs${option[0].toUpperCase()}${option.slice(1)}`] === 'true') classes.push(option);
  });
  // deep linking is on unless switched off
  if (data.tabsDeeplink !== 'false') classes.push('deeplink');
  return classes;
}

/**
 * Turns a Tab marker into tab settings.
 * @param {Element} marker The Tab marker block
 * @param {number} index Position of the tab
 */
function readMarker(marker, index) {
  const picture = marker.querySelector('picture') || marker.querySelector('img');
  const config = readBlockConfig(marker);
  const text = (key) => [config[key]].flat().filter(Boolean).join(' ').trim();
  let thumbnail = null;
  if (picture) {
    thumbnail = picture.cloneNode(true);
    thumbnail.querySelectorAll('[data-aue-resource], [data-aue-prop]').forEach((el) => {
      el.removeAttribute('data-aue-resource');
      el.removeAttribute('data-aue-prop');
    });
    (thumbnail.tagName === 'IMG' ? thumbnail : thumbnail.querySelector('img'))?.setAttribute('alt', '');
  }
  const title = text('title') || `Tab ${index + 1}`;
  return {
    title,
    anchor: text('anchor') || text('tab-id'),
    icon: text('icon'),
    badge: text('badge'),
    description: text('summary') || text('description'),
    thumbnail,
    active: text('active') === 'true',
    disabled: text('disabled') === 'true',
    analytics: text('analytics') || text('analytics-label'),
  };
}

/**
 * Shows the marker as a small, selectable "Tab settings" label in the editor.
 * @param {Element} marker The Tab marker block
 * @param {string} title The tab title
 */
function decorateMarkerForEditor(marker, title) {
  marker.classList.remove('block');
  marker.classList.add('tabs-marker');
  const label = document.createElement('p');
  label.textContent = `Tab settings: ${title}`;
  marker.replaceChildren(label);
}

/**
 * Restructures and initialises one Tabs section.
 * @param {Element} section The section element
 */
export default async function decorateTabSection(section) {
  if (section.dataset.tabsStatus) return;
  section.dataset.tabsStatus = 'decorating';
  const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/blocks/tabs/tabs.css`);
  const editor = isEditor();
  section.classList.add('tabs-section');

  // group the section's wrappers: intro, then one group per Tab marker
  const intro = [];
  const groups = [];
  [...section.children].forEach((wrapper) => {
    const marker = wrapper.querySelector(':scope > .tab');
    if (marker) groups.push({ marker, wrapper, items: [] });
    else if (groups.length) groups[groups.length - 1].items.push(wrapper);
    else intro.push(wrapper);
  });

  const tabs = groups.map((group, index) => {
    const settings = readMarker(group.marker, index);
    const panel = document.createElement('div');
    const content = document.createElement('div');
    content.className = 'tabs-panel-content';
    if (editor) {
      decorateMarkerForEditor(group.marker, settings.title);
      content.append(group.wrapper);
    } else {
      group.wrapper.remove();
    }
    content.append(...group.items);
    panel.append(content);
    return {
      ...settings,
      id: uniqueTabId(settings.anchor || settings.title, index, usedIds, panel),
      panel,
      content,
      emptyNotice: 'This tab is empty. Add blocks after its Tab, before the next Tab.',
    };
  });

  // defer the blocks of tabs that start closed (not in the editor, where everything is editable)
  const initial = initialTabIndex(tabs);
  if (!editor) {
    tabs.forEach((tab, index) => {
      if (index === initial) return;
      const blocks = [...tab.content.querySelectorAll('.block')];
      if (!blocks.length) return;
      blocks.forEach((block) => {
        block.classList.remove('block');
        block.classList.add('tabs-deferred-block');
      });
      tab.load = async () => {
        // nested blocks get their normal decoration, CSS and JS, now that the tab is visible
        for (let i = 0; i < blocks.length; i += 1) {
          blocks[i].classList.add('block');
          blocks[i].classList.remove('tabs-deferred-block');
          // eslint-disable-next-line no-await-in-loop
          await loadBlock(blocks[i]);
        }
      };
    });
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'tabs-wrapper';
  const root = document.createElement('div');
  root.className = ['tabs', ...readClasses(section.dataset)].join(' ');
  // not a block: keeps decorateBlocks()/loadBlock() from treating the root as one
  root.dataset.blockStatus = 'loaded';
  wrapper.append(root);
  section.append(wrapper);

  const intervalValue = Number(section.dataset.tabsInterval);
  await initTabs(root, {
    header: intro,
    tabs,
    interval: intervalValue ? Math.max(MIN_INTERVAL, intervalValue) : DEFAULT_INTERVAL,
    emptyNotice: editor ? 'No tabs yet. Select this Tabs section and click Add (+) → Tab, then add blocks after it.' : '',
  });
  section.dataset.tabsStatus = 'decorated';
  await cssLoaded;
}
