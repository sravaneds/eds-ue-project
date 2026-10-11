import { getMetadata } from '../../scripts/aem.js';

/** Trip facts read from page metadata: [metadata key, label] */
const FACTS = [
  ['duration', 'Duration'],
  ['difficulty', 'Difficulty'],
  ['group-size', 'Group Size'],
  ['season', 'Best Season'],
  ['price', 'From'],
];

const DEFAULT_BOOKING_URL = '/expeditions';

/**
 * Builds the trip facts section from page metadata.
 * @returns {Element|null} The section, or null if no facts are set
 */
function buildFactsSection() {
  const facts = FACTS
    .map(([key, label]) => [label, getMetadata(key)])
    .filter(([, value]) => value);
  if (!facts.length) return null;

  const list = document.createElement('dl');
  list.className = 'adventure-facts';
  facts.forEach(([label, value]) => {
    const item = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const detail = document.createElement('dd');
    detail.textContent = value;
    item.append(term, detail);
    list.append(item);
  });

  const section = document.createElement('div');
  section.className = 'adventure-facts-section';
  section.append(list);
  return section;
}

/**
 * Builds the closing booking call-to-action section.
 * @param {Element} main The main element
 * @returns {Element} The section
 */
function buildBookingSection(main) {
  const title = main.querySelector('h1')?.textContent.trim();

  const heading = document.createElement('h2');
  heading.textContent = title ? `Ready for ${title}?` : 'Ready for your next adventure?';

  const text = document.createElement('p');
  text.textContent = 'Small groups, expert guides, and every detail planned. You just show up.';

  const link = document.createElement('a');
  link.href = getMetadata('booking-url') || DEFAULT_BOOKING_URL;
  link.textContent = 'Book this Adventure';
  const strong = document.createElement('strong');
  strong.append(link);
  const cta = document.createElement('p');
  cta.append(strong);

  const section = document.createElement('div');
  section.className = 'accent center adventure-booking';
  section.append(heading, text, cta);
  return section;
}

/**
 * Adventure detail template: adds the fixed page parts that authors
 * don't edit — trip facts after the hero and a booking CTA at the end.
 * @param {Element} main The main element (not yet decorated)
 */
export default function decorate(main) {
  const facts = buildFactsSection();
  if (facts) {
    const first = main.firstElementChild;
    if (first) first.after(facts);
    else main.prepend(facts);
  }

  if (!main.querySelector('.adventure-booking')) {
    main.append(buildBookingSection(main));
  }
}
