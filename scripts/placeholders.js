import { getMetadata, toCamelCase } from './aem.js';
import { fetchSheet } from './sheets.js';

/**
 * Placeholders: site-wide wording (button labels, short phrases) kept in a spreadsheet
 * with the columns Key and Text, so authors change or translate it without a code change.
 * Keys are camel-cased: "open menu" → openMenu.
 *
 * The sheet is /placeholders.json, or the path in the page metadata "placeholders"
 * (e.g. /fr/placeholders for a French site).
 */

/**
 * Fetches the placeholders for the current page.
 * @param {string} [path] Placeholders sheet, defaults to the page's
 * @returns {Promise<Object<string, string>>} Camel-cased keys to text; empty on error
 */
export async function fetchPlaceholders(path) {
  const source = path || getMetadata('placeholders') || '/placeholders';
  const { data } = await fetchSheet(source);
  return Object.fromEntries(data
    .filter((row) => row.Key && row.Text !== undefined)
    .map((row) => [toCamelCase(row.Key), row.Text]));
}

/**
 * Returns a placeholder text, or the fallback when the key isn't in the sheet.
 * @param {Object<string, string>} placeholders Result of fetchPlaceholders()
 * @param {string} key Camel-cased key
 * @param {string} fallback Text used without a placeholder
 * @returns {string} The text
 */
export function placeholder(placeholders, key, fallback) {
  return placeholders?.[key] || fallback;
}
