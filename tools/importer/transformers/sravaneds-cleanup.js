/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: sravaneds (eds-ue-project) site-wide cleanup.
 * Source is a decorated Edge Delivery page. All selectors verified in
 * migration-work/cleaned.html:
 *   - <header class="header-wrapper"> (global nav: nav#nav, .nav-brand, .nav-sections, .nav-tools)
 *   - <footer class="footer-wrapper"> (global footer block)
 *   - <span class="icon icon-search"><img ...></span> (runtime-loaded icon image)
 *   - <source> elements (runtime <picture> renditions, no authorable value)
 *   - data-block-status / data-section-status (EDS runtime decoration attributes)
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const RUNTIME_ATTRS = [
  'data-block-status',
  'data-section-status',
  'data-block-name',
];

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Global chrome (found in cleaned.html: header.header-wrapper, footer.footer-wrapper).
    WebImporter.DOMUtils.remove(element, [
      'header.header-wrapper',
      'header',
      'footer.footer-wrapper',
      'footer',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Safety net in case header/footer were re-attached or sit outside the parsed root.
    WebImporter.DOMUtils.remove(element, [
      'header.header-wrapper',
      'header',
      'footer.footer-wrapper',
      'footer',
      'nav#nav',
      'noscript',
      'link',
      'script',
    ]);

    // Loaded icon images: EDS injects <img> into span.icon at runtime.
    // Restore the authorable :icon-name: token instead.
    element.querySelectorAll('span.icon').forEach((span) => {
      const iconClass = [...span.classList].find((c) => c.startsWith('icon-'));
      if (iconClass) {
        span.replaceWith(document.createTextNode(`:${iconClass.substring(5)}:`));
      } else {
        span.remove();
      }
    });

    // Empty runtime <source> renditions inside <picture> (img is kept).
    element.querySelectorAll('picture > source, source').forEach((s) => s.remove());

    // EDS runtime decoration attributes.
    element.querySelectorAll('*').forEach((el) => {
      RUNTIME_ATTRS.forEach((attr) => el.removeAttribute(attr));
    });
  }
}
