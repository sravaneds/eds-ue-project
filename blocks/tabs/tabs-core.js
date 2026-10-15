import { getMetadata, toClassName } from '../../scripts/aem.js';

const MOBILE = window.matchMedia('(max-width: 599px)');
const DESKTOP = window.matchMedia('(min-width: 900px)');
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
export const DEFAULT_INTERVAL = 6;
export const MIN_INTERVAL = 3;
let blockCount = 0;

/**
 * Whether the page is rendered inside Universal Editor.
 * @returns {boolean}
 */
export const isEditor = () => !!document.querySelector('[data-aue-resource]');

/**
 * Removes Universal Editor instrumentation from an element and its descendants,
 * used for authored content that is moved into generated UI such as tab buttons.
 * @param {Element} el The element
 */
export function stripInstrumentation(el) {
  [el, ...el.querySelectorAll('*')].forEach((node) => {
    [...node.attributes]
      .filter(({ name }) => name.startsWith('data-aue-') || name.startsWith('data-richtext-'))
      .forEach(({ name }) => node.removeAttribute(name));
  });
}

/**
 * Returns a page-unique id for a tab, based on its Tab ID or title.
 * @param {string} value Tab ID or title
 * @param {number} index Position of the tab
 * @param {Set<string>} usedIds Ids already taken by tabs on this page
 * @param {Element} [owner] Element that may already carry the id
 * @returns {string}
 */
export function uniqueTabId(value, index, usedIds, owner) {
  const base = toClassName(value) || `tab-${index + 1}`;
  let id = base;
  for (let n = 2; usedIds.has(id) || (document.getElementById(id) || owner) !== owner; n += 1) {
    id = `${base}-${n}`;
  }
  usedIds.add(id);
  return id;
}

/**
 * Index of the tab to open first: the URL hash, then Default Active, then the first enabled tab.
 * @param {object[]} tabs Tab settings with id, active, disabled and panel
 * @returns {number}
 */
export function initialTabIndex(tabs) {
  const { hash } = window.location;
  if (hash.length > 1) {
    let target;
    try {
      target = document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch { /* invalid hash */ }
    const byHash = tabs.findIndex((tab) => !tab.disabled
      && (tab.id === hash.slice(1) || (target && tab.panel?.contains(target))));
    if (byHash >= 0) return byHash;
  }
  const byDefault = tabs.findIndex((tab) => tab.active && !tab.disabled);
  if (byDefault >= 0) return byDefault;
  return tabs.findIndex((tab) => !tab.disabled);
}

/**
 * Creates the tab button for a panel.
 * @param {Element} block The tabs block
 * @param {object} tab The tab settings
 * @param {number} count Number of tabs
 * @returns {HTMLButtonElement}
 */
function createTabButton(block, tab, count) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tabs-tab';
  button.id = `tab-${tab.id}`;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', tab.id);
  button.setAttribute('aria-posinset', tab.index + 1);
  button.setAttribute('aria-setsize', count);
  if (tab.disabled) button.setAttribute('aria-disabled', 'true');
  if (tab.analytics) button.dataset.analyticsId = tab.analytics;

  if (block.classList.contains('image') && tab.thumbnail) {
    const wrapper = document.createElement('span');
    wrapper.className = 'tabs-thumbnail';
    wrapper.append(tab.thumbnail);
    button.append(wrapper);
  }
  const iconName = toClassName(tab.icon || '');
  if (iconName && (block.classList.contains('icons') || block.classList.contains('icon-tabs'))) {
    const icon = document.createElement('span');
    icon.className = 'tabs-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.setProperty('--tabs-icon-url', `url('${window.hlx.codeBasePath}/icons/${iconName}.svg')`);
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
 * @param {object} tab The tab settings
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
 * Turns a root element into accessible, lazy-loading tabs. Used by the Tabs section
 * container and by the legacy Tabs block.
 * @param {Element} block The root element; its classes select style, theme and behaviour
 * @param {object} options
 * @param {Node[]} options.header Heading and description nodes shown above the tab bar
 * @param {object[]} options.tabs Tab settings ({ id, title, icon, badge, description,
 *   thumbnail, active, disabled, analytics, panel, content, load, emptyNotice })
 * @param {number} [options.interval] Auto rotation speed in seconds
 * @param {string} [options.emptyNotice] Editor hint when there are no tabs
 */
export default async function initTabs(block, {
  header: headerNodes = [], tabs: tabSettings = [], interval = DEFAULT_INTERVAL, emptyNotice = '',
} = {}) {
  blockCount += 1;
  const componentId = block.id || `tabs-${blockCount}`;
  const editor = isEditor();
  const header = document.createElement('div');
  header.className = 'tabs-header';
  header.append(...headerNodes);
  if (!headerNodes.length) header.hidden = true;

  const headingEl = header.querySelector('h1, h2, h3, h4, h5, h6');
  const headingLevel = headingEl ? Math.min(Number(headingEl.tagName[1]) + 1, 6) : 3;
  const accordionTag = `h${headingLevel}`;
  const accessibleName = headingEl?.textContent.trim() || 'Tabs';

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

  const status = document.createElement('p');
  status.className = 'tabs-status';
  status.setAttribute('aria-live', 'polite');

  const container = document.createElement('div');
  container.className = 'tabs-panels';
  block.prepend(header, nav, container);
  block.append(status);

  const deepLink = block.classList.contains('deeplink');
  const state = {
    tabs: [],
    active: -1,
    default: -1,
    mode: 'tabs',
    timer: null,
    hover: false,
    viewed: new Set(),
    ready: false,
  };

  const enabledIndexes = () => state.tabs
    .map((tab, i) => (tab.disabled ? -1 : i))
    .filter((i) => i >= 0);

  // analytics: DOM events plus the Adobe Client Data Layer when present
  const track = (name, tab, extra = {}) => {
    if (!tab) return;
    const detail = {
      event: `tabs:${name}`,
      pageName: getMetadata('og:title') || document.title,
      componentId,
      tabId: tab.id,
      tabName: tab.title,
      tabPosition: tab.index + 1,
      tabCount: state.tabs.length,
      analyticsLabel: tab.analytics || tab.id,
      timestamp: new Date().toISOString(),
      ...extra,
    };
    block.dispatchEvent(new CustomEvent(detail.event, { bubbles: true, detail }));
    if (Array.isArray(window.adobeDataLayer)) {
      window.adobeDataLayer.push({ event: detail.event, eventInfo: detail });
    }
  };

  const viewObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const tab = state.tabs.find((t) => t.panel === entry.target);
      if (tab && !tab.panel.hidden && !state.viewed.has(tab.id)) {
        state.viewed.add(tab.id);
        track('viewed', tab);
      }
    });
  }, { threshold: 0.25 }) : null;

  /**
   * Loads a tab's deferred content once (its blocks, or a fragment for legacy tabs).
   * Blocks run their normal decoration and loading, exactly as anywhere else on a page.
   */
  const loadPanel = (tab) => {
    if (tab.loaded || !tab.load) return Promise.resolve();
    if (!tab.loading) {
      tab.panel.setAttribute('aria-busy', 'true');
      tab.loading = Promise.resolve().then(() => tab.load()).catch(() => {}).finally(() => {
        tab.loaded = true;
        tab.panel.removeAttribute('aria-busy');
        tab.panel.style.removeProperty('--tabs-panel-min-height');
      });
    }
    return tab.loading;
  };

  const showPanel = async (tab, previous) => {
    if (previous && previous !== tab) {
      // keep the height of the outgoing panel while the new one loads (no layout shift)
      tab.panel.style.setProperty('--tabs-panel-min-height', `${previous.panel.offsetHeight}px`);
      previous.panel.querySelectorAll('video, audio').forEach((media) => media.pause());
      previous.panel.dispatchEvent(new CustomEvent('tabs:panel-hidden', { bubbles: true, detail: { id: previous.id } }));
    }
    await loadPanel(tab);
    if (state.tabs[state.active] !== tab) return;
    tab.panel.dispatchEvent(new CustomEvent('tabs:panel-shown', { bubbles: true, detail: { id: tab.id } }));
    // let blocks that measure their size (carousels, maps, embeds) recalculate
    window.dispatchEvent(new Event('resize'));
  };

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
      state.tabs[enabledIndexes()[0] ?? 0].button.tabIndex = 0;
    }
    select.value = String(state.active);
  };

  const activate = (index, { trigger = 'click', focus = false } = {}) => {
    const tab = state.tabs[index];
    if (!tab || tab.disabled) return null;
    const previous = state.tabs[state.active];
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
    const userTriggers = ['click', 'keyboard', 'select', 'accordion'];
    if (deepLink && userTriggers.includes(trigger) && window.location.hash !== `#${tab.id}`) {
      // a history entry per user choice, so Back/Forward move between tabs
      window.history.pushState({ tabs: componentId, tab: tab.id }, '', `#${tab.id}`);
    }
    if (userTriggers.includes(trigger)) {
      status.textContent = `${tab.title} tab selected, ${index + 1} of ${state.tabs.length}`;
    }
    track('activated', tab, { trigger });
    if (changed && previous) {
      track('changed', tab, { trigger, previousTabId: previous.id, previousTabName: previous.title });
      // backwards compatible event name
      block.dispatchEvent(new CustomEvent('tabs:change', {
        bubbles: true,
        detail: {
          id: tab.id, title: tab.title, index, analyticsId: tab.analytics || tab.id, trigger,
        },
      }));
    }
    return showPanel(tab, previous);
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
    setRotationLabel(false);
  };
  const startRotation = () => {
    clearInterval(state.timer);
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
    return activate(index, options);
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
        // name the panel by the tab title only, without description or badge
        panel.removeAttribute('aria-label');
        panel.setAttribute('aria-labelledby', `tab-${state.mode === 'tabs' ? '' : 'accordion-'}label-${tab.id}`);
      }
    });
    // tabs always show a panel, the accordion may be fully collapsed
    if (state.ready && state.mode !== 'accordion' && state.active < 0) {
      activate(state.default, { trigger: 'init' });
    }
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

  // build tabs from the settings
  state.tabs = tabSettings.map((settings, index) => {
    const tab = { ...settings, index, loaded: !settings.load };
    tab.panel.id = tab.id;
    tab.panel.classList.add('tabs-panel');
    tab.panel.tabIndex = 0;
    container.append(tab.panel);
    return tab;
  });
  state.tabs.forEach((tab, i) => {
    tab.button = createTabButton(block, tab, state.tabs.length);
    tab.trigger = createAccordionHeading(tab, accordionTag);
    tablist.append(tab.button);
    tab.panel.before(tab.trigger);
    const option = new Option(tab.title, String(i));
    option.disabled = tab.disabled;
    select.append(option);
    if (editor && tab.emptyNotice && tab.loaded && !tab.content.childNodes.length) {
      const notice = document.createElement('p');
      notice.className = 'tabs-notice';
      notice.textContent = tab.emptyNotice;
      tab.content.append(notice);
    }
    viewObserver?.observe(tab.panel);
  });

  block.classList.toggle('tabs-empty', !state.tabs.length);
  if (!state.tabs.length) {
    if (editor && emptyNotice) {
      const notice = document.createElement('p');
      notice.className = 'tabs-notice';
      notice.textContent = emptyNotice;
      block.append(notice);
    }
    return;
  }

  const byDefault = state.tabs.findIndex((tab) => tab.active && !tab.disabled);
  state.default = byDefault >= 0 ? byDefault : (enabledIndexes()[0] ?? -1);
  const byHash = targetIndex(window.location.hash);
  const initial = byHash >= 0 && !state.tabs[byHash].disabled ? byHash : state.default;
  applyMode();
  // the opening tab's content loads with the block; the others load when opened
  await activate(initial, { trigger: initial === byHash ? 'hash' : 'init' });
  state.ready = true;

  // events: arrows move focus (manual activation), Enter/Space/click select
  tablist.addEventListener('click', (e) => {
    const button = e.target.closest('[role="tab"]');
    if (!button) return;
    const index = state.tabs.findIndex((tab) => tab.button === button);
    const tab = state.tabs[index];
    track('clicked', tab, { disabled: tab.disabled });
    if (tab.disabled) {
      status.textContent = `${tab.title} tab is unavailable`;
      return;
    }
    userActivate(index, { trigger: e.detail === 0 ? 'keyboard' : 'click' });
  });

  tablist.addEventListener('keydown', (e) => {
    const buttons = state.tabs.map((tab) => tab.button);
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    const rtl = getComputedStyle(block).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next;
    if (e.key === forward || e.key === 'ArrowDown') next = (current + 1) % buttons.length;
    else if (e.key === backward || e.key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else return;
    e.preventDefault();
    buttons.forEach((button, i) => { button.tabIndex = i === next ? 0 : -1; });
    buttons[next].focus();
  });

  // when focus leaves the tab list, Tab returns to the selected tab next time
  tablist.addEventListener('focusout', (e) => {
    if (tablist.contains(e.relatedTarget)) return;
    render();
  });

  // warm up a tab's deferred content when the visitor is about to open it
  tablist.addEventListener('pointerover', (e) => {
    const button = e.target.closest('[role="tab"]');
    const tab = state.tabs.find((t) => t.button === button);
    if (tab?.prefetch && !tab.loaded && !tab.prefetched) {
      tab.prefetched = true;
      tab.prefetch();
    }
  });

  container.addEventListener('click', (e) => {
    const trigger = e.target.closest('.tabs-accordion-trigger');
    if (!trigger || trigger.getAttribute('aria-disabled') === 'true') return;
    const index = state.tabs.findIndex((tab) => tab.trigger.contains(trigger));
    if (index === state.active) {
      state.active = -1;
      render();
    } else {
      userActivate(index, { trigger: 'accordion' });
    }
  });

  select.addEventListener('change', () => userActivate(Number(select.value), { trigger: 'select' }));

  // Back/Forward and in-page links: follow the hash, or return to the default tab
  window.addEventListener('hashchange', () => {
    const index = targetIndex(window.location.hash);
    if (index >= 0) activate(index, { trigger: 'history' });
    else if (deepLink && !window.location.hash && state.active !== state.default) {
      activate(state.default, { trigger: 'history' });
    }
  });

  MOBILE.addEventListener('change', applyMode);
  DESKTOP.addEventListener('change', applyMode);

  if (rotationAllowed && state.tabs.length > 1) startRotation();

  if (editor) {
    // show the tab of the item selected in the content tree
    document.addEventListener('aue:ui-select', (e) => {
      const { resource, selected } = e.detail || {};
      if (!selected || !resource) return;
      const element = document.querySelector(`[data-aue-resource="${resource}"]`);
      const index = state.tabs.findIndex((tab) => tab.panel.contains(element));
      if (index >= 0 && index !== state.active) activate(index, { trigger: 'editor' });
    });
  }
}
