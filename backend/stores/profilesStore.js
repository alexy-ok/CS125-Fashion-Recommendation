const path = require('path');
const { readJson, writeJsonAtomic } = require('../utils/jsonFile');

const PROFILES_PATH = path.join(__dirname, '..', 'data', 'user_profiles.json');

function loadProfiles() {
  return readJson(PROFILES_PATH, { users: {} });
}

function saveProfiles(doc) {
  writeJsonAtomic(PROFILES_PATH, doc);
}

function isModelShape(x) {
  return !!x && typeof x === 'object' && ('likedBrands' in x || 'likedTerms' in x || 'priceRange' in x);
}

function mergeModels(a, b) {
  const out = a ? JSON.parse(JSON.stringify(a)) : null;
  if (!out) return b ? JSON.parse(JSON.stringify(b)) : null;
  if (!b) return out;

  const mergeMap = (m1, m2) => {
    const r = { ...(m1 || {}) };
    for (const [k, v] of Object.entries(m2 || {})) r[k] = (r[k] || 0) + Number(v || 0);
    return r;
  };

  out.likedBrands = mergeMap(out.likedBrands, b.likedBrands);
  out.likedCategories = mergeMap(out.likedCategories, b.likedCategories);
  out.likedColors = mergeMap(out.likedColors, b.likedColors);
  out.likedTerms = mergeMap(out.likedTerms, b.likedTerms);
  out.dislikedBrands = mergeMap(out.dislikedBrands, b.dislikedBrands);
  out.dislikedCategories = mergeMap(out.dislikedCategories, b.dislikedCategories);
  out.dislikedTerms = mergeMap(out.dislikedTerms, b.dislikedTerms);

  if (out.priceRange && b.priceRange) {
    out.priceRange = {
      min: Math.min(out.priceRange.min, b.priceRange.min),
      max: Math.max(out.priceRange.max, b.priceRange.max),
    };
  } else {
    out.priceRange = out.priceRange || b.priceRange || null;
  }

  out.updatedAt = Math.max(Number(out.updatedAt || 0), Number(b.updatedAt || 0));
  return out;
}

/**
 * New behavior: one personal model per user.
 * Backward compatible: if data is still nested by profileId, we merge all models for the user.
 */
function getUserModel(userId) {
  const doc = loadProfiles();
  const entry = doc.users[userId];
  if (!entry) return null;
  if (isModelShape(entry)) return entry;

  // Legacy shape: users[userId] = { [profileId]: model }
  let merged = null;
  for (const v of Object.values(entry || {})) {
    if (isModelShape(v)) merged = mergeModels(merged, v);
  }
  return merged;
}

function upsertUserModel(userId, model) {
  const doc = loadProfiles();
  doc.users[userId] = model;
  saveProfiles(doc);
  return model;
}

module.exports = {
  PROFILES_PATH,
  loadProfiles,
  saveProfiles,
  getUserModel,
  upsertUserModel,
};

