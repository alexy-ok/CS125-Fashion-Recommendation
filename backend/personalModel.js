const { tokenize } = require('./indexer');

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function decayMap(map, factor) {
  if (!map) return {};
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    const nv = Number(v) * factor;
    if (Math.abs(nv) >= 0.01) out[k] = nv;
  }
  return out;
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

function applyEvent(profile, item, eventType) {
  const p = profile || createEmptyProfile();
  const decay = 0.95;

  p.likedBrands = decayMap(p.likedBrands, decay);
  p.likedCategories = decayMap(p.likedCategories, decay);
  p.likedColors = decayMap(p.likedColors, decay);
  p.likedTerms = decayMap(p.likedTerms, decay);
  p.dislikedBrands = decayMap(p.dislikedBrands, decay);
  p.dislikedCategories = decayMap(p.dislikedCategories, decay);
  p.dislikedTerms = decayMap(p.dislikedTerms, decay);

  const deltaByEvent = {
    click: 1,
    save: 3,
    purchase: 5,
    skipQuick: -1,
    notMyStyle: -3,
  };
  const delta = deltaByEvent[eventType] ?? 0;
  const neg = delta < 0;

  const brand = (item?.brand_store || '').trim();
  const category = (item?.category || '').trim().toLowerCase();

  if (brand) {
    const m = neg ? p.dislikedBrands : p.likedBrands;
    m[brand] = (m[brand] || 0) + Math.abs(delta);
  }
  if (category) {
    const m = neg ? p.dislikedCategories : p.likedCategories;
    m[category] = (m[category] || 0) + Math.abs(delta);
  }

  const nameDesc = [item?.name, item?.description].filter(Boolean).join(' ');
  const terms = tokenize(nameDesc);
  for (const t of terms.slice(0, 30)) {
    const m = neg ? p.dislikedTerms : p.likedTerms;
    m[t] = (m[t] || 0) + Math.abs(delta);
  }

  const price = item?.price != null ? Number(item.price) : null;
  if (price != null && Number.isFinite(price) && delta > 0) {
    if (!p.priceRange) {
      p.priceRange = { min: price, max: price };
    } else {
      p.priceRange.min = Math.min(p.priceRange.min, price);
      p.priceRange.max = Math.max(p.priceRange.max, price);
    }
  }

  p.updatedAt = Date.now();
  return p;
}

function personalScore(profile, item) {
  if (!profile) return 0;
  let s = 0;

  const brand = (item?.brand_store || '').trim();
  const category = (item?.category || '').trim().toLowerCase();

  if (brand) {
    s += 0.10 * (Number(profile.likedBrands?.[brand]) || 0);
    s -= 0.12 * (Number(profile.dislikedBrands?.[brand]) || 0);
  }

  if (category) {
    s += 0.12 * (Number(profile.likedCategories?.[category]) || 0);
    s -= 0.14 * (Number(profile.dislikedCategories?.[category]) || 0);
  }

  const price = item?.price != null ? Number(item.price) : null;
  if (price != null && profile.priceRange) {
    const { min, max } = profile.priceRange;
    if (price >= min && price <= max) s += 1.0;
    else {
      const mid = (min + max) / 2;
      const dist = Math.abs(price - mid);
      s -= clamp(dist / Math.max(1, mid), 0, 1) * 0.5;
    }
  }

  const nameDesc = [item?.name, item?.description].filter(Boolean).join(' ');
  const terms = tokenize(nameDesc);
  for (const t of new Set(terms.slice(0, 40))) {
    s += 0.02 * (Number(profile.likedTerms?.[t]) || 0);
    s -= 0.03 * (Number(profile.dislikedTerms?.[t]) || 0);
  }

  // Keep personal contribution bounded so BM25 still dominates.
  return clamp(s, -5, 5);
}

module.exports = {
  createEmptyProfile,
  applyEvent,
  personalScore,
};

