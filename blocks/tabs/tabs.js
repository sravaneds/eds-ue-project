import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

const MOBILE = window.matchMedia('(max-width: 599px)');
const DESKTOP = window.matchMedia('(min-width: 900px)');
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
const DEFAULT_INTERVAL = 6;
const MIN_INTERVAL = 3;

/**
 * Whether the page is rendered inside Universal Editor.
 * @returns {boolean}
 */
const isEditor = () => !!document.querySelector('[data-aue-resource]');

/**
 * Whether a section is a tab panel (section model "tab-panel").
 * @param {Element} el The element to check
 * @returns {boolean}
 */
const isPanel = (el) => el?.matches('div.section')
  && (el.dataset.tabTitle !== undefined || el.dataset.aueModel === 'tab-panel');

/**
 * Collects the consecutive tab panel sections that follow the block's section.
 * @param {Element} block The tabs block
 * @returns {Element[]} The panel sections
 */
function findPanels(block) {
  const panels = [];
  let next = block.closest('.section')?.nextElementSibling;
  while (isPanel(next)) {
    panels.push(next);
    next = next.nextElementSibling;
  }
  return panels;
}

/**
 * Reads the authored rows of the block: heading, description and rotation speed.
 * @param {Element} block The tabs block
 */
function readRows(block) {
  const rows = { header: [], interval: DEFAULT_INTERVAL };
  [...block.children].forEach((row, i, all) => {
    const text = row.textContent.trim();
    if (i === all.length - 1 && /^\d+(\.\d+)?$/.test(text)) {
      rows.interval = Math.max(MIN_INTERVAL, Number(text));
      row.hidden = true;
      row.classList.add('tabs-config');
    } else if (text) {
      row.classList.add(row.querySelector('h1, h2, h3, h4, h5, h6') ? 'tabs-heading' : 'tabs-description');
      rows.header.push(row);
    } else {
      row.hidden = true;
    }
  });
  return rows;
}

/**
 * Reads the tab configuration from a panel's section metadata.
 * @param {Element} panel The panel section
 * @param {number} index Position of the panel
 * @param {Set<string>} usedIds Ids already taken by previous panels
 */
function readTab(panel, index, usedIds) {
  const data = panel.dataset;
  const title = (data.tabTitle || '').trim() || `Tab ${index + 1}`;
  const base = toClassName(data.tabId || title) || `tab-${index + 1}`;
  let id = base;
  for (let n = 2; usedIds.has(id) || (document.getElementById(id) || panel) !== panel; n += 1) {
    id = `${base}-${n}`;
  }
  usedIds.add(id);
  return {
    panel,
    id,
    title,
    icon: toClassName(data.tabIcon || ''),
    badge: (data.tabBadge || '').trim(),
    description: (data.tabDescription || '').trim(),
    thumbnail: data.tabThumbnail || '',
    active: data.tabActive === 'true',
    disabled: data.tabDisabled === 'true',
    analytics: (data.tabAnalytics || '').trim(),
  };
}

/**
 * Creates the picture for an image tab, optimized when served from this origin.
 * @param {string} src The image url
 * @returns {Element}
 */
function createThumbnail(src) {
  const url = new URL(src, window.location.href);
  const picture = url.origin === window.location.origin
    ? createOptimizedPicture(url.pathname, '', false, [{ width: '480' }])
    : Object.assign(document.createElement('img'), { src, alt: '', loading: 'lazy' });
  const wrapper = document.createElement('span');
  wrapper.className = 'tabs-thumbnail';
  wrapper.append(picture);
  return wrapper;
}

/**
 * Creates the tab button for a panel.
 * @param {Element} block The tabs block
 * @param {object} tab The tab configuration
 * @returns {HTMLButtonElement}
 */
function createTabButton(block, tab) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tabs-tab';
  button.id = `tab-${tab.id}`;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', tab.id);
  if (tab.disabled) button.setAttribute('aria-disabled', 'true');
  if (tab.analytics) button.dataset.analyticsId = tab.analytics;

  if (block.classList.contains('image') && tab.thumbnail) button.append(createThumbnail(tab.thumbnail));
  if (tab.icon && (block.classList.contains('icons') || block.classList.contains('icon-tabs'))) {
    const icon = document.createElement('span');
    icon.className = 'tabs-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.setProperty('--tabs-icon-url', `url('${window.hlx.codeBasePath}/icons/${tab.icon}.svg')`);
    button.append(icon);
  }

  const text = document.createElement('span');
  text.className = 'tabs-tab-text';
  const label = document.createElement('span');
  label.className = 'tabs-tab-label';
  label.id = `tab-label-${tab.id}`;
  label.textContent = tab.title;
  text.append(label);
  if (tab.description) {
    const description = document.createElement('span');
    description.className = 'tabs-tab-description';
    description.textContent = tab.description;
    text.append(description);
  }
  button.append(text);

  if (tab.badge) {
    const badge = document.createElement('span');
    badge.className = 'tabs-badge';
    badge.textContent = tab.badge;
    button.append(badge);
  }
  return button;
}

/**
 * Creates the accordion trigger used on mobile when the accordion behaviour is selected.
 * @param {object} tab The tab configuration
 * @param {string} level The heading tag name
 * @returns {HTMLElement}
 */
function createAccordionHeading(tab, level) {
  const heading = document.createElement(level);
  heading.className = 'tabs-accordion-heading';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tabs-accordion-trigger';
  button.id = `tab-accordion-${tab.id}`;
  button.setAttribute('aria-controls', tab.id);
  if (tab.disabled) button.setAttribute('aria-disabled', 'true');
  const label = document.createElement('span');
  label.id = `tab-accordion-label-${tab.id}`;
  label.textContent = tab.title;
  button.append(label);
  if (tab.badge) {
    const badge = document.createElement('span');
    badge.className = 'tabs-badge';
    badge.textContent = tab.badge;
    button.append(badge);
  }
  heading.append(button);
  return heading;
}

/**
 * Decorates a tabs block. Tab panels are the tab panel sections that directly follow
 * the section containing this block, so each tab can hold any block.
 * @param {Element} block The tabs block
 */
export default function decorate(block) {
  const editor = isEditor();
  const { header: headerRows, interval } = readRows(block);
  const header = document.createElement('div');
  header.className = 'tabs-header';
  header.append(...headerRows);
  block.prepend(header);
  if (!headerRows.length) header.hidden = true;

  const headingEl = header.querySelector('h1, h2, h3, h4, h5, h6');
  const headingLevel = headingEl ? Math.min(Number(headingEl.tagName[1]) + 1, 6) : 3;
  const accordionTag = `h${headingLevel}`;
  const accessibleName = headingEl?.textContent.trim() || 'Tabs';

  // nested tabs would steal the sibling panels of the enclosing tabs
  if (block.closest('.tabs-panels')) {
    if (editor) {
      const notice = document.createElement('p');
      notice.className = 'tabs-notice';
      notice.textContent = 'Tabs cannot be placed inside a tab panel.';
      block.append(notice);
    }
    return;
  }

  const nav = document.createElement('div');
  nav.className = 'tabs-nav';
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', accessibleName);
  const select = document.createElement('select');
  select.className = 'tabs-select';
  select.setAttribute('aria-label', accessibleName);
  nav.append(tablist, select);

  const container = document.createElement('div');
  container.className = 'tabs-panels';
  container.append(...findPanels(block));
  block.append(nav, container);

  const deepLink = block.classList.contains('deeplink');
  const state = {
    tabs: [],
    active: -1,
    mode: 'tabs',
    timer: null,
    rotationStopped: false,
    hover: false,
  };

  const enabledIndexes = () => state.tabs
    .map((tab, i) => (tab.disabled ? -1 : i))
    .filter((i) => i >= 0);

  const render = () => {
    state.tabs.forEach((tab, i) => {
      const selected = i === state.active;
      tab.button.setAttribute('aria-selected', selected);
      tab.button.tabIndex = selected ? 0 : -1;
      tab.trigger.firstElementChild.setAttribute('aria-expanded', selected);
      tab.panel.hidden = !selected;
    });
    // keep a focusable tab when nothing is selected (collapsed accordion)
    if (state.active < 0 && state.tabs.length) {
      const first = state.tabs[enabledIndexes()[0] ?? 0];
      first.button.tabIndex = 0;
    }
    select.value = String(state.active);
  };

  const notify = (trigger) => {
    const tab = state.tabs[state.active];
    if (!tab) return;
    const detail = {
      id: tab.id,
      title: tab.title,
      index: state.active,
      analyticsId: tab.analytics || tab.id,
      trigger,
    };
    block.dispatchEvent(new CustomEvent('tabs:change', { bubbles: true, detail }));
    if (Array.isArray(window.adobeDataLayer)) {
      window.adobeDataLayer.push({ event: 'tabs:change', eventInfo: detail });
    }
  };

  const activate = (index, { trigger = 'click', focus = false } = {}) => {
    const tab = state.tabs[index];
    if (!tab || tab.disabled) return;
    const changed = index !== state.active;
    state.active = index;
    render();
    if (focus) tab.button.focus();
    if (state.mode === 'tabs') {
      // scroll an overflowing tab list sideways only, never the page
      const list = tablist.getBoundingClientRect();
      const { left, right } = tab.button.getBoundingClientRect();
      let offset = 0;
      if (left < list.left) offset = left - list.left;
      else if (right > list.right) offset = right - list.right;
      if (offset) tablist.scrollBy({ left: offset, behavior: REDUCED_MOTION.matches ? 'auto' : 'smooth' });
    }
    if (deepLink && trigger !== 'rotation' && trigger !== 'init' && trigger !== 'hash') {
      window.history.replaceState(window.history.state, '', `#${tab.id}`);
    }
    if (changed && trigger !== 'init') notify(trigger);
  };

  // auto rotation
  const rotation = document.createElement('button');
  rotation.type = 'button';
  rotation.className = 'tabs-rotation';
  const setRotationLabel = (running) => {
    rotation.setAttribute('aria-label', running ? 'Pause automatic tab rotation' : 'Start automatic tab rotation');
    rotation.dataset.state = running ? 'running' : 'paused';
  };
  const stopRotation = () => {
    clearInterval(state.timer);
    state.timer = null;
    state.rotationStopped = true;
    setRotationLabel(false);
  };
  const startRotation = () => {
    clearInterval(state.timer);
    state.rotationStopped = false;
    setRotationLabel(true);
    state.timer = setInterval(() => {
      if (state.hover || document.hidden || state.mode !== 'tabs') return;
      const enabled = enabledIndexes();
      const next = enabled[(enabled.indexOf(state.active) + 1) % enabled.length];
      activate(next, { trigger: 'rotation' });
    }, interval * 1000);
  };
  const rotationAllowed = block.classList.contains('autorotate') && !editor && !REDUCED_MOTION.matches;
  if (rotationAllowed) {
    nav.append(rotation);
    rotation.addEventListener('click', () => (state.timer ? stopRotation() : startRotation()));
    block.addEventListener('mouseenter', () => { state.hover = true; });
    block.addEventListener('mouseleave', () => { state.hover = false; });
    block.addEventListener('focusin', (e) => { if (e.target !== rotation) state.hover = true; });
    block.addEventListener('focusout', () => { state.hover = false; });
  }
  const userActivate = (index, options) => {
    if (state.timer) stopRotation();
    activate(index, options);
  };

  const applyMode = () => {
    const mobileBehaviour = ['accordion', 'dropdown'].find((m) => block.classList.contains(`mobile-${m}`));
    state.mode = MOBILE.matches && mobileBehaviour ? mobileBehaviour : 'tabs';
    block.dataset.mode = state.mode;
    const vertical = block.classList.contains('vertical') && DESKTOP.matches;
    tablist.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
    state.tabs.forEach((tab) => {
      const { panel } = tab;
      panel.setAttribute('role', state.mode === 'tabs' ? 'tabpanel' : 'region');
      if (state.mode === 'dropdown') {
        panel.removeAttribute('aria-labelledby');
        panel.setAttribute('aria-label', tab.title);
      } else {
        panel.removeAttribute('aria-label');
        // name the panel by the tab title only, without description or badge
        const labelId = `tab-${state.mode === 'tabs' ? '' : 'accordion-'}label-${tab.id}`;
        panel.setAttribute('aria-labelledby', labelId);
      }
    });
    // tabs always show a panel, the accordion may be fully collapsed
    if (state.mode !== 'accordion' && state.active < 0) activate(enabledIndexes()[0], { trigger: 'init' });
  };

  const targetIndex = (hash) => {
    if (!hash || hash.length < 2) return -1;
    let target;
    try {
      target = document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return -1;
    }
    return state.tabs.findIndex((tab) => tab.panel === target || tab.panel.contains(target));
  };

  const build = () => {
    const activeId = state.tabs[state.active]?.id;
    state.tabs.forEach((tab) => tab.trigger.remove());
    tablist.replaceChildren();
    select.replaceChildren();

    const usedIds = new Set();
    const panels = [...container.children].filter(isPanel);
    state.tabs = panels.map((panel, i) => {
      const tab = readTab(panel, i, usedIds);
      panel.id = tab.id;
      panel.classList.add('tabs-panel');
      panel.tabIndex = 0;
      tab.button = createTabButton(block, tab);
      tab.trigger = createAccordionHeading(tab, accordionTag);
      tablist.append(tab.button);
      panel.before(tab.trigger);
      const option = new Option(tab.title, String(i));
      option.disabled = tab.disabled;
      select.append(option);
      return tab;
    });

    block.classList.toggle('tabs-empty', !state.tabs.length);
    block.querySelector('.tabs-notice')?.remove();
    if (!state.tabs.length) {
      if (editor) {
        const notice = document.createElement('p');
        notice.className = 'tabs-notice';
        notice.textContent = 'No tabs yet. In the Content Tree, select Main, click Add (+) → Tab Panel, then drag it directly below this section.';
        block.append(notice);
      }
      return;
    }

    const enabled = enabledIndexes();
    const byId = state.tabs.findIndex((tab) => tab.id === activeId && !tab.disabled);
    const byHash = targetIndex(window.location.hash);
    const byDefault = state.tabs.findIndex((tab) => tab.active && !tab.disabled);
    const preferred = [byId, byHash, byDefault].find((i) => i >= 0 && !state.tabs[i].disabled);
    state.active = -1;
    applyMode();
    activate(preferred ?? enabled[0] ?? -1, { trigger: 'init' });
  };

  // events
  tablist.addEventListener('click', (e) => {
    const button = e.target.closest('[role="tab"]');
    if (button) userActivate(state.tabs.findIndex((tab) => tab.button === button));
  });

  tablist.addEventListener('keydown', (e) => {
    const enabled = enabledIndexes();
    if (!enabled.length) return;
    const current = state.tabs.findIndex((tab) => tab.button === document.activeElement);
    const position = enabled.indexOf(current);
    const rtl = getComputedStyle(block).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next;
    if (e.key === forward || e.key === 'ArrowDown') next = enabled[(position + 1) % enabled.length];
    else if (e.key === backward || e.key === 'ArrowUp') {
      next = enabled[(position - 1 + enabled.length) % enabled.length];
    } else if (e.key === 'Home') [next] = enabled;
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    else return;
    e.preventDefault();
    userActivate(next, { trigger: 'keyboard', focus: true });
  });

  container.addEventListener('click', (e) => {
    const trigger = e.target.closest('.tabs-accordion-trigger');
    if (!trigger || trigger.getAttribute('aria-disabled') === 'true') return;
    const index = state.tabs.findIndex((tab) => tab.trigger.contains(trigger));
    if (index === state.active) {
      state.active = -1;
      render();
    } else {
      userActivate(index);
    }
  });

  select.addEventListener('change', () => userActivate(Number(select.value), { trigger: 'select' }));

  window.addEventListener('hashchange', () => {
    const index = targetIndex(window.location.hash);
    if (index >= 0) activate(index, { trigger: 'hash' });
  });

  MOBILE.addEventListener('change', applyMode);
  DESKTOP.addEventListener('change', applyMode);

  build();
  if (rotationAllowed && state.tabs.length > 1) startRotation();

  if (editor) {
    // show the panel of the component selected in the content tree
    document.addEventListener('aue:ui-select', (e) => {
      const { resource, selected } = e.detail || {};
      if (!selected || !resource) return;
      const element = document.querySelector(`[data-aue-resource="${resource}"]`);
      const index = state.tabs.findIndex((tab) => tab.panel.contains(element));
      if (index >= 0 && index !== state.active) activate(index, { trigger: 'editor' });
    });
    // panels are re-rendered in place when authors edit them, rebuild the tabs to match
    let pending;
    const isSection = (node) => node.nodeType === Node.ELEMENT_NODE && node.matches('div.section');
    new MutationObserver((records) => {
      const sectionsChanged = records
        .some((r) => [...r.addedNodes, ...r.removedNodes].some(isSection));
      if (!sectionsChanged) return;
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(build);
    }).observe(container, { childList: true });
  }
}
