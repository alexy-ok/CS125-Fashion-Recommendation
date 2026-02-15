const fs = require('fs');
const path = require('path');

/**
 * Tokenize text for indexing: lowercase, split on non-word chars, drop empty/short.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/'/g, ' ')
    .split(/\W+/)
    .filter((t) => t.length > 1);
}

/**
 * Build an inverted index from a list of items.
 * Index maps term -> { docId: count } for scoring (term frequency per document).
 * Items are normalized: size -> sizes, image_url -> image_urls, and get a numeric docId.
 *
 * @param {Array<object>} items - Each item: name, description, price, category, sizes/size, etc.
 * @returns {{ items: Array<object>, index: object, docCount: number }}
 */
function buildIndex(items) {
  const normalized = items.map((item, i) => {
    const sizes = item.sizes ?? (Array.isArray(item.size) ? item.size : []);
    const image_urls = item.image_urls ?? (item.image_url ? [item.image_url] : []);
    return {
      docId: i,
      name: item.name ?? '',
      description: item.description ?? '',
      price: item.price != null ? Number(item.price) : null,
      category: item.category ?? null,
      brand_store: item.brand_store ?? null,
      material: item.material ?? null,
      sizes,
      image_urls,
      data_source: item.data_source ?? null,
    };
  });

  /** @type {Record<string, Record<number, number>>} term -> docId -> count */
  const index = {};

  for (const doc of normalized) {
    const text = [doc.name, doc.description].filter(Boolean).join(' ');
    const terms = tokenize(text);
    const termCounts = {};
    for (const t of terms) {
      termCounts[t] = (termCounts[t] || 0) + 1;
    }
    for (const [term, count] of Object.entries(termCounts)) {
      if (!index[term]) index[term] = {};
      index[term][doc.docId] = count;
    }
  }

  return {
    items: normalized,
    index,
    docCount: normalized.length,
  };
}

/**
 * Load items from a JSON file (array of item objects) and build the index.
 * @param {string} filePath - Path to JSON file (e.g. data/dataset_1.json)
 * @returns {{ items: Array<object>, index: object, docCount: number }}
 */
function loadAndBuildIndex(filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
  const raw = fs.readFileSync(absolute, 'utf8');
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) {
    throw new Error('JSON file must export an array of items');
  }
  return buildIndex(items);
}

module.exports = {
  tokenize,
  buildIndex,
  loadAndBuildIndex,
};
