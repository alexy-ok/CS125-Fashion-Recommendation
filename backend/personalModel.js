const { tokenize } = require('./indexer');

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function inc(map, key, delta) {
  if (!key) return;
  const k = normalizeText(key);
  if (!k) return;
  map[k] = (map[k] || 0) + delta;
}

function createEmptyProfile() {
  return {
    likedBrands: {},
    likedCategories: {},
    likedColors: {},
    likedTerms: {},
    dislikedBrands: {},
    dislikedCategories: {},
    dislikedTerms: {},
    priceRange: null,
    updatedAt: Date.now(),
  };
}

function extractTerms(item) {
  const name = item?.name || '';
  const description = item?.description || '';
  return tokenize(`${name} ${description}`);
}

function updatePriceRange(model, item, strength) {
  const price = Number(item?.price);
  if (!Number.isFinite(price)) return;
  if (!model.priceRange) {
    model.priceRange = { min: price, max: price };
    return;
  }
  // Expand range slowly; stronger signals (purchase/save) update more.
  const s = clamp(strength, 0.1, 3);
  model.priceRange.min = Math.min(model.priceRange.min, price);
  model.priceRange.max = Math.max(model.priceRange.max, price);
  // Nudge min/max toward observed price to prevent extreme ranges from dominating.
  model.priceRange.min = model.priceRange.min + (price - model.priceRange.min) * 0.02 * s;
  model.priceRange.max = model.priceRange.max + (price - model.priceRange.max) * 0.02 * s;
}

/**
 * Apply a user interaction event to the personal model.
 * eventType: click | save | notMyStyle | skipQuick | purchase
 */
function applyEvent(model, item, eventType) {
  const out = model ? JSON.parse(JSON.stringify(model)) : createEmptyProfile();

  const type = String(eventType || '').trim();
  const isPositive = type === 'save' || type === 'purchase';
  const isNegative = type === 'notMyStyle';
  const isNeutral = type === 'click';
  const isSkip = type === 'skipQuick';

  const strength =
    type === 'purchase' ? 3 :
    type === 'save' ? 2 :
    type === 'click' ? 0.25 :
    type === 'skipQuick' ? 0.15 :
    type === 'notMyStyle' ? 1.5 :
    0.2;

  const brand = item?.brand_store || item?.brand || '';
  const category = item?.category || '';
  const terms = extractTerms(item);

  if (isPositive || isNeutral) {
    inc(out.likedBrands, brand, strength * (isNeutral ? 0.5 : 1));
    inc(out.likedCategories, category, strength * (isNeutral ? 0.3 : 1));
    for (const t of terms) inc(out.likedTerms, t, strength * (isNeutral ? 0.15 : 0.5));
    updatePriceRange(out, item, strength);
  }

  if (isNegative || isSkip) {
    const neg = strength * (isSkip ? 0.2 : 1);
    inc(out.dislikedBrands, brand, neg);
    inc(out.dislikedCategories, category, neg * 0.7);
    for (const t of terms) inc(out.dislikedTerms, t, neg * 0.35);
  }

  out.updatedAt = Date.now();
  return out;
}

/**
 * Score how well an item matches the user's personal model.
 * Returns a roughly 0..10-ish score (higher is better).
 */
function personalScore(model, item) {
  if (!model || !item) return 0;

  const brand = normalizeText(item.brand_store || item.brand || '');
  const category = normalizeText(item.category || '');
  const terms = extractTerms(item);

  let score = 0;
  if (brand) score += (model.likedBrands?.[brand] || 0) * 1.2;
  if (brand) score -= (model.dislikedBrands?.[brand] || 0) * 1.6;

  if (category) score += (model.likedCategories?.[category] || 0) * 0.8;
  if (category) score -= (model.dislikedCategories?.[category] || 0) * 1.0;

  for (const t of terms) {
    score += (model.likedTerms?.[t] || 0) * 0.12;
    score -= (model.dislikedTerms?.[t] || 0) * 0.18;
  }

  const price = Number(item.price);
  if (model.priceRange && Number.isFinite(price)) {
    const min = Number(model.priceRange.min);
    const max = Number(model.priceRange.max);
    if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
      // Mild preference for items inside observed range.
      if (price >= min && price <= max) score += 0.5;
      else score -= 0.25;
    }
  }

  // Prevent one weird item from blowing up the ranking.
  return clamp(score, -10, 10);
}

module.exports = {
  createEmptyProfile,
  applyEvent,
  personalScore,
};