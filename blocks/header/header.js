import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { maskIcon } from '../ask/ask.js';

const MENU_ID = 'nav-menu';

/**
 * Sorts the nav page sections by what they hold: logos (brand), links (menu), the Ask block.
 * Authors can order the sections freely.
 * @param {Element} fragment The loaded nav fragment
 * @returns {{brand: Element, menu: Element, ask: Element}} The sections
 */
function sortSections(fragment) {
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const ask = sections.find((s) => s.querySelector('.ask'));
  const rest = sections.filter((s) => s !== ask);
  const brand = rest.find((s) => s.querySelector('picture'));
  const menu = rest.find((s) => s !== brand && s.querySelector('ul'));
  return { brand, menu, ask };
}

/**
 * Creates a button that opens the menu dialog.
 * @param {string} className Button class
 * @param {string} icon Icon name
 * @returns {HTMLButtonElement} The button
 */
function menuButton(className, icon = 'menu') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', 'Open menu');
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', MENU_ID);
  button.setAttribute('aria-expanded', 'false');
  button.append(maskIcon(icon));
  return button;
}

/**
 * Builds the brand area: the first logo links home, the second is the group mark.
 * @param {Element} section The brand section
 * @returns {Element[]} Brand elements
 */
function buildBrand(section) {
  if (!section) return [];
  const pictures = [...section.querySelectorAll('picture')];
  const link = section.querySelector('a[href]');
  const home = document.createElement('a');
  home.className = 'nav-brand';
  home.href = link ? link.getAttribute('href') : '/';
  const [logo, ...marks] = pictures;
  if (logo) {
    const img = logo.querySelector('img');
    home.setAttribute('aria-label', `${img?.alt || 'Home'}, home`);
    if (img) {
      img.loading = 'eager';
      img.alt = '';
    }
    home.append(logo);
  }
  const elements = [home];
  marks.forEach((mark) => {
    const span = document.createElement('span');
    span.className = 'nav-mark';
    span.append(mark);
    elements.push(span);
  });
  return elements;
}

/**
 * Builds the menu dialog from the menu section's lists.
 * @param {Element} section The menu section
 * @param {Element[]} brand Brand elements, cloned into the dialog bar
 * @returns {HTMLDialogElement} The dialog
 */
function buildMenu(section, brand) {
  const dialog = document.createElement('dialog');
  dialog.id = MENU_ID;
  dialog.className = 'nav-menu';
  dialog.setAttribute('aria-label', 'Menu');
  dialog.setAttribute('closedby', 'any');

  const bar = document.createElement('div');
  bar.className = 'nav-menu-bar';
  brand.forEach((el) => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
    bar.append(clone);
  });
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-close';
  close.setAttribute('aria-label', 'Close menu');
  close.append(maskIcon('close'));
  close.addEventListener('click', () => dialog.close());
  close.autofocus = true;
  bar.append(close);

  const body = document.createElement('div');
  body.className = 'nav-menu-body';
  if (section) {
    const lists = [...section.querySelectorAll('.default-content-wrapper > ul')];
    lists.forEach((ul) => {
      ul.classList.add('nav-links');
      ul.querySelectorAll(':scope > li').forEach((li) => {
        if (li.querySelector(':scope > ul')) li.classList.add('nav-group');
      });
      body.append(ul);
    });
  }
  dialog.append(bar, body);
  return dialog;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  block.textContent = '';
  if (!fragment) return;

  const { brand, menu, ask } = sortSections(fragment);
  const brandElements = buildBrand(brand);
  const dialog = buildMenu(menu, brandElements);
  const triggers = [];
  let opener;

  const open = () => {
    if (dialog.open) return;
    opener = document.activeElement;
    dialog.showModal();
    triggers.forEach((t) => t.setAttribute('aria-expanded', 'true'));
  };
  dialog.addEventListener('close', () => {
    triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    // return focus to the button that opened the menu (also the footer's)
    if (opener?.isConnected) opener.focus();
  });
  // menu links close the dialog, so in-page links land on the page
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('a')) dialog.close();
  });
  document.addEventListener('nav:open', open);

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  const barButton = menuButton('nav-menu-button');
  triggers.push(barButton);
  bar.append(...brandElements, barButton);
  nav.append(bar, dialog);

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);

  // floating ask bar, with its own menu button (tablet and desktop)
  const askBlock = ask?.querySelector('.ask');
  if (askBlock) {
    const floating = document.createElement('div');
    floating.className = 'nav-ask';
    const askButton = menuButton('ask-menu');
    triggers.push(askButton);
    askBlock.querySelector('.ask-bar')?.prepend(askButton);
    floating.append(askBlock);
    wrapper.append(floating);

    if (document.querySelector('[data-aue-resource]')) {
      // Universal Editor: keep the bar in the flow so it never covers content being edited
      floating.classList.add('nav-ask-static');
    } else {
      // hide while the footer (which has its own ask bar) is on screen
      const footer = document.querySelector('footer');
      if (footer) {
        new IntersectionObserver(([entry]) => {
          floating.classList.toggle('nav-ask-hidden', entry.isIntersecting);
          floating.inert = entry.isIntersecting;
        }).observe(footer);
      }
    }
  }

  triggers.forEach((t) => t.addEventListener('click', open));
  block.append(wrapper);
}
