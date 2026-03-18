const { tokenize } = require('./indexer');
const { personalScore } = require('./personalModel');

/** BM25 parameters: k1 controls term frequency saturation, b controls length normalization. */
const BM25_K1 = 1.2;
const BM25_B = 0.75;

/**
 * BM25 IDF: log((N - n + 0.5) / (n + 0.5) + 1)
 * N = docCount, n = number of documents containing the term
 */
function bm25Idf(docCount, docFreq) {
  return Math.log((docCount - docFreq + 0.5) / (docFreq + 0.5) + 1);
}

/**
 * Recommend clothing items: BM25 text match via inverted index + hard filters (size, price, category), then rank.
 *
 * @param {object} ctx - Index context from indexer.buildIndex / loadAndBuildIndex (must include docLengths, avgdl)
 * @param {string} query - User search text (e.g. "black jacket")
 * @param {object} filters - Optional: size, category, minPrice, maxPrice
 * @param {number} limit - Max number of results (default 20)
 * @param {object} options - Optional: { profile, candidateLimit }
 * @returns {Array<{ item: object, score: number, bm25Score: number, personal: number }>}
 */
function recommend(ctx, query, filters = {}, limit = 20, options = {}) {
  const { items, index, docCount, docLengths = [], avgdl = 0 } = ctx;
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

    let bm25Score = 0;
    if (terms.length > 0) {
      const docLen = docLengths[docId] ?? 0;
      const norm = avgdl > 0 ? 1 - BM25_B + BM25_B * (docLen / avgdl) : 1;
      for (const term of terms) {
        const postings = index[term];
        if (postings && postings[docId] != null) {
          const tf = postings[docId];
          const df = Object.keys(postings).length;
          const idf = bm25Idf(docCount, df);
          bm25Score += idf * (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * norm);
        }
      }
    } else {
      bm25Score = 1;
    }

    scored.push({ item, bm25Score });
  }

  scored.sort((a, b) => b.bm25Score - a.bm25Score);

  const candidateLimit = Number(options.candidateLimit || 100);
  const top = scored.slice(0, Math.max(limit, candidateLimit));

  const profile = options.profile || null;
  const withPersonal = top.map(({ item, bm25Score }) => {
    const personal = profile ? personalScore(profile, item) : 0;
    const score = profile ? 0.75 * bm25Score + 0.25 * personal : bm25Score;
    return { item, score, bm25Score, personal };
  });

  withPersonal.sort((a, b) => b.score - a.score);
  return withPersonal.slice(0, limit);
}

module.exports = { recommend };
