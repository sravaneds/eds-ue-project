import { getMetadata } from './aem.js';
import { fetchSheet } from './sheets.js';

/**
 * Taxonomy: AEM tags organise pages. Pages only carry tag IDs (page metadata "cq-tags",
 * e.g. "eds-demo:topic/ai"). An AEM page made from the Taxonomy template publishes the
 * tags' titles as a spreadsheet (columns tag, title), so the IDs can be shown as readable labels.
 *
 * The sheet is /taxonomy.json, or the path in the page metadata "taxonomy".
 */

/**
 * Returns the tag IDs of the current page.
 * @returns {string[]} Tag IDs
 */
export function getPageTags() {
  return getMetadata('cq-tags').split(',').map((tag) => tag.trim()).filter(Boolean);
}

/**
 * Fetches the taxonomy: tag ID to tag details.
 * @param {string} [path] Taxonomy sheet, defaults to the page's
 * @returns {Promise<Map<string, object>>} Tag ID → row ({ tag, title, … })
 */
export async function fetchTaxonomy(path) {
  const { data } = await fetchSheet(path || getMetadata('taxonomy') || '/taxonomy');
  return new Map(data.filter((row) => row.tag).map((row) => [row.tag, row]));
}

/**
 * Returns a readable title for a tag ID: the taxonomy title, or the last part of the ID.
 * @param {string} tag Tag ID, e.g. "eds-demo:topic/agentic-ai"
 * @param {Map<string, object>} taxonomy Result of fetchTaxonomy()
 * @returns {string} The title, e.g. "Agentic AI"
 */
export function tagTitle(tag, taxonomy) {
  const title = taxonomy?.get(tag)?.title;
  if (title) return title;
  const last = tag.split(/[:/]/).filter(Boolean).pop() || tag;
  const words = last.replace(/[-_]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
