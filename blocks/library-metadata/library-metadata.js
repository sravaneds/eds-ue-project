/**
 * Block library sample pages describe each sample with a library-metadata block
 * (name, description). It's read by the block library, never shown on the page.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  block.closest('.library-metadata-wrapper')?.setAttribute('hidden', '');
  block.setAttribute('aria-hidden', 'true');
}
