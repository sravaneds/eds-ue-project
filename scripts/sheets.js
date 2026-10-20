/**
 * Spreadsheets: every spreadsheet published from AEM (placeholders, taxonomy, metadata,
 * custom data such as office lists) is served by Edge Delivery as JSON:
 * { data: [{ column: value, … }], columns: [...], total, offset, limit, ':type': 'sheet' }
 * A spreadsheet with several sheets is ':type': 'multi-sheet', with one entry per sheet.
 * The AEM page is mapped to its .json URL in paths.json.
 */

const cache = new Map();

/**
 * Turns an authored link to a spreadsheet page into its JSON URL.
 * @param {string} path Link or path, e.g. /data/offices or /data/offices.json
 * @returns {string} The JSON URL
 */
export function sheetUrl(path) {
  const url = new URL(path, window.location.href);
  if (!url.pathname.endsWith('.json')) url.pathname = `${url.pathname.replace(/\/$/, '')}.json`;
  return url.href;
}

/**
 * Fetches a published spreadsheet (cached per URL and sheet).
 * @param {string} path Spreadsheet path, with or without .json
 * @param {object} [options]
 * @param {string} [options.sheet] Sheet name, for spreadsheets with several sheets
 * @returns {Promise<{data: object[], columns: string[]}>} Rows and column names; empty on error
 */
export async function fetchSheet(path, { sheet } = {}) {
  const url = new URL(sheetUrl(path));
  if (sheet) url.searchParams.set('sheet', sheet);
  const key = url.href;
  if (!cache.has(key)) {
    cache.set(key, fetch(url)
      .then((resp) => (resp.ok ? resp.json() : {}))
      .then((json) => {
        const source = json[':type'] === 'multi-sheet' ? json[sheet || json[':names']?.[0]] || {} : json;
        const data = Array.isArray(source.data) ? source.data : [];
        const columns = source.columns || (data[0] ? Object.keys(data[0]) : []);
        return { data, columns };
      })
      .catch(() => ({ data: [], columns: [] })));
  }
  return cache.get(key);
}
