const { tokenize } = require('./indexer');

/**
 * Recommend clothing items: text match via inverted index + hard filters (size, price, category), then rank.
 *
 * @param {object} ctx - Index context from indexer.buildIndex / loadAndBuildIndex
 * @param {string} query - User search text (e.g. "black jacket")
 * @param {object} filters - Optional: size, category, minPrice, maxPrice
 * @param {number} limit - Max number of results (default 20)
 * @returns {Array<{ item: object, score: number }>}
 */
function recommend(ctx, query, filters = {}, limit = 20) {
  const { items, index, docCount } = ctx;
  const terms = tokenize(query || '');

  let candidateIds;
  if (terms.length === 0) {
    candidateIds = new Set(items.map((d) => d.docId));
  } else {
    candidateIds = new Set();
    for (const term of terms) {
      const postings = index[term];
      if (postings) {
        for (const docId of Object.keys(postings)) {
          candidateIds.add(Number(docId));
        }
      }
    }
    if (candidateIds.size === 0) {
      return [];
    }
  }

  const sizeFilter = filters.size != null ? String(filters.size).trim().toUpperCase() : null;
  const categoryFilter =
    filters.category != null ? String(filters.category).trim().toLowerCase() : null;
  const minPrice = filters.minPrice != null ? Number(filters.minPrice) : null;
  const maxPrice = filters.maxPrice != null ? Number(filters.maxPrice) : null;

  const scored = [];
  for (const docId of candidateIds) {
    const item = items[docId];
    if (!item) continue;

    if (sizeFilter && (!item.sizes || !item.sizes.length)) continue;
    if (sizeFilter && !item.sizes.map((s) => String(s).toUpperCase()).includes(sizeFilter)) continue;

    if (categoryFilter) {
      const cat = (item.category || '').toLowerCase();
      if (cat !== categoryFilter) continue;
    }

    const price = item.price != null ? Number(item.price) : null;
    if (minPrice != null && (price == null || price < minPrice)) continue;
    if (maxPrice != null && (price == null || price > maxPrice)) continue;

    let score = 0;
    if (terms.length > 0) {
      for (const term of terms) {
        const postings = index[term];
        if (postings && postings[docId] != null) {
          const tf = postings[docId];
          const df = Object.keys(postings).length;
          const idf = Math.log((docCount + 1) / (df + 1)) + 1;
          score += tf * idf;
        }
      }
    } else {
      score = 1;
    }

    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

module.exports = { recommend };
