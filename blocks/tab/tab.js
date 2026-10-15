/**
 * Tab marker. It only has an effect inside a Tabs section, where the section
 * turns each marker and the blocks after it into one tab (blocks/tabs/tabs-section.js).
 * Used anywhere else, it is hidden on the page and explained in the editor.
 * @param {Element} block The tab block
 */
export default function decorate(block) {
  if (block.closest('.tabs-section')) return;
  if (document.querySelector('[data-aue-resource]')) {
    const notice = document.createElement('p');
    notice.className = 'tab-notice';
    notice.textContent = 'A Tab only works inside a Tabs section. Use Add → Tabs at page level, then add Tabs inside it.';
    block.replaceChildren(notice);
  } else {
    block.closest('.tab-wrapper')?.remove();
  }
}
