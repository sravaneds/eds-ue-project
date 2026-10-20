import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { maskIcon } from '../ask/ask.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  if (!fragment) return;
  const footer = document.createElement('div');
  footer.className = 'footer-content';

  // the section with the Ask block is the call to action; the others form the bottom row
  [...fragment.querySelectorAll(':scope > .section')].forEach((section) => {
    section.classList.add(section.querySelector('.ask') ? 'footer-cta' : 'footer-bottom');
    footer.append(section);
  });

  // links in the bottom row are plain text links, even when authored as Button components
  footer.querySelectorAll('.footer-bottom a').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    a.closest('.button-container')?.classList.remove('button-container');
  });

  // menu button in front of the ask bar opens the header's menu
  const bar = footer.querySelector('.footer-cta .ask-bar');
  if (bar) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ask-menu';
    button.setAttribute('aria-label', 'Open menu');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'nav-menu');
    button.append(maskIcon('menu'));
    button.addEventListener('click', () => document.dispatchEvent(new CustomEvent('nav:open')));
    bar.prepend(button);
  }

  block.append(footer);
}
