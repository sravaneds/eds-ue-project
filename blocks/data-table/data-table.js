import { fetchSheet } from '../../scripts/sheets.js';
import { fetchPlaceholders, placeholder } from '../../scripts/placeholders.js';

let tableCount = 0;

/**
 * Reads the block fields by position (Spreadsheet, Caption, Show Search Box).
 * @param {Element} block The block
 * @returns {{source: string, caption: string, search: boolean}} The fields
 */
function readFields(block) {
  const [sourceRow, captionRow, searchRow] = [...block.children];
  const link = sourceRow?.querySelector('a');
  return {
    source: link ? link.getAttribute('href') : sourceRow?.textContent.trim(),
    caption: captionRow?.textContent.trim() || '',
    search: searchRow?.textContent.trim().toLowerCase() === 'true',
  };
}

/**
 * Renders a cell value; paths and URLs become links.
 * @param {string} value The cell value
 * @returns {Node} Cell content
 */
function cellContent(value) {
  const text = `${value ?? ''}`.trim();
  if (/^(https?:\/\/|\/)\S+$/.test(text)) {
    const a = document.createElement('a');
    a.href = text;
    a.textContent = text.replace(/^https?:\/\//, '');
    return a;
  }
  return document.createTextNode(text);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const { source, caption, search } = readFields(block);
  tableCount += 1;
  const id = `data-table-${tableCount}`;
  const status = document.createElement('p');
  status.className = 'data-table-status';
  status.setAttribute('aria-live', 'polite');

  if (!source) {
    status.textContent = 'Choose a spreadsheet in the Data Table settings.';
    block.replaceChildren(status);
    return;
  }

  const [{ data, columns }, placeholders] = await Promise.all([
    fetchSheet(source),
    fetchPlaceholders(),
  ]);
  // columns starting with "_" are for internal use and not shown
  const visible = columns.filter((column) => !column.startsWith('_'));
  if (!data.length || !visible.length) {
    status.textContent = placeholder(placeholders, 'dataTableEmpty', 'No data to show.');
    block.replaceChildren(status);
    return;
  }

  const table = document.createElement('table');
  if (caption) {
    const cap = document.createElement('caption');
    cap.textContent = caption;
    table.append(cap);
  }
  const head = table.createTHead().insertRow();
  visible.forEach((column) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column;
    head.append(th);
  });
  const body = table.createTBody();
  const rows = data.map((row) => {
    const tr = body.insertRow();
    visible.forEach((column) => tr.insertCell().append(cellContent(row[column])));
    return { tr, text: visible.map((column) => `${row[column] ?? ''}`).join(' ').toLowerCase() };
  });

  // wide tables scroll sideways inside a focusable, labelled region
  const scroller = document.createElement('div');
  scroller.className = 'data-table-scroll';
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'region');
  scroller.setAttribute('aria-label', caption || placeholder(placeholders, 'dataTable', 'Data table'));
  scroller.append(table);

  const content = [];
  if (search) {
    const form = document.createElement('search');
    form.className = 'data-table-search';
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = placeholder(placeholders, 'dataTableSearch', 'Search');
    const input = document.createElement('input');
    input.type = 'search';
    input.id = id;
    input.setAttribute('aria-controls', `${id}-table`);
    table.id = `${id}-table`;
    const showing = placeholder(placeholders, 'dataTableShowing', 'Showing {0} of {1}');
    const none = placeholder(placeholders, 'dataTableNoResults', 'No matching rows');
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      let count = 0;
      rows.forEach(({ tr, text }) => {
        const match = !query || text.includes(query);
        tr.hidden = !match;
        if (match) count += 1;
      });
      status.textContent = count
        ? showing.replace('{0}', count).replace('{1}', rows.length)
        : none;
    });
    form.append(label, input);
    content.push(form);
  }
  content.push(scroller, status);
  block.replaceChildren(...content);
}
