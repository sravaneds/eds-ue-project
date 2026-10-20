import { fetchPlaceholders, placeholder as placeholderText } from '../../scripts/placeholders.js';

let askCount = 0;

/**
 * Creates an icon span using a project icon as a CSS mask (inherits currentColor).
 * @param {string} name Icon name in /icons
 * @returns {HTMLSpanElement} The icon
 */
export function maskIcon(name) {
  const icon = document.createElement('span');
  icon.className = `ask-icon ask-icon-${name}`;
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

/**
 * Determines what a row of the ask block holds.
 * @param {Element} row The block row
 * @returns {string} placeholder, link, suggestions or empty
 */
function rowType(row) {
  if (row.querySelector('ul, ol')) return 'suggestions';
  if (row.querySelector('a')) return 'link';
  return row.textContent.trim() ? 'placeholder' : 'empty';
}

/**
 * Adds voice input when the browser supports speech recognition.
 * @param {HTMLInputElement} input The question input
 * @returns {HTMLButtonElement|null} The mic button
 */
function voiceButton(input) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return null;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ask-mic';
  button.setAttribute('aria-label', 'Ask by voice');
  button.setAttribute('aria-pressed', 'false');
  button.append(maskIcon('mic'));

  let recognition;
  const stop = () => {
    button.setAttribute('aria-pressed', 'false');
    recognition = null;
  };
  button.addEventListener('click', () => {
    if (recognition) {
      recognition.stop();
      return;
    }
    recognition = new Recognition();
    recognition.lang = document.documentElement.lang || 'en';
    recognition.interimResults = true;
    recognition.addEventListener('result', (e) => {
      input.value = [...e.results].map((r) => r[0].transcript).join('');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    recognition.addEventListener('end', stop);
    recognition.addEventListener('error', stop);
    button.setAttribute('aria-pressed', 'true');
    recognition.start();
  });
  return button;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = Object.fromEntries([...block.children].map((row) => [rowType(row), row]));
  const placeholder = rows.placeholder?.textContent.trim() || 'Ask us a question';
  const action = rows.link?.querySelector('a')?.getAttribute('href');

  askCount += 1;
  const id = `ask-input-${askCount}`;

  const search = document.createElement('search');
  search.className = 'ask-search';
  const form = document.createElement('form');
  form.className = 'ask-bar';
  form.method = 'get';
  if (action) form.action = action;

  const label = document.createElement('label');
  label.className = 'ask-label';
  label.htmlFor = id;
  label.textContent = placeholder;

  const field = document.createElement('div');
  field.className = 'ask-field';
  const input = document.createElement('input');
  input.type = 'search';
  input.id = id;
  input.name = 'q';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  input.enterKeyHint = 'send';
  input.required = true;

  const controls = document.createElement('div');
  controls.className = 'ask-controls';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'ask-submit';
  submit.setAttribute('aria-label', 'Send question');
  submit.append(maskIcon('arrow-right'));
  const mic = voiceButton(input);
  if (mic) controls.append(mic);
  controls.append(submit);

  field.append(input, controls);
  form.append(label, field);
  search.append(form);

  const content = [search];
  const items = rows.suggestions ? [...rows.suggestions.querySelectorAll('li')] : [];
  if (items.length) {
    const list = document.createElement('ul');
    list.className = 'ask-suggestions';
    items.forEach((item) => {
      const text = item.textContent.trim();
      if (!text) return;
      const li = document.createElement('li');
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ask-chip';
      chip.textContent = text;
      chip.addEventListener('click', () => {
        input.value = text;
        form.requestSubmit();
      });
      li.append(chip);
      list.append(li);
    });
    content.push(list);
  }

  block.replaceChildren(...content);

  // button labels can be reworded or translated in the placeholders sheet
  fetchPlaceholders().then((placeholders) => {
    submit.setAttribute('aria-label', placeholderText(placeholders, 'sendQuestion', 'Send question'));
    mic?.setAttribute('aria-label', placeholderText(placeholders, 'askByVoice', 'Ask by voice'));
  });
}
