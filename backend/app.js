require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { searchProducts, getItemDetails } = require('./ebay');
const { loadAndBuildIndex } = require('./indexer');
const { recommend, recommendWithVisualScoring } = require('./recommender');
const { getSessionUser, parseCookies, signup, login, createSessionForUser, destroySession } = require('./auth');
const { getUserModel, upsertUserModel } = require('./stores/profilesStore');
const { createEmptyProfile, applyEvent } = require('./personalModel');
const { getStyleProfiles, setStyleProfiles } = require('./stores/styleProfilesStore');

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

function mergeStyleProfiles(existing, incoming) {
  const a = Array.isArray(existing) ? existing : [];
  const b = Array.isArray(incoming) ? incoming : [];
  const map = new Map();
  for (const p of a) if (p && p.id) map.set(String(p.id), p);
  for (const p of b) if (p && p.id) map.set(String(p.id), p);
  return Array.from(map.values());
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

let recommendationIndex = null;
try {
  recommendationIndex = loadAndBuildIndex(path.join(__dirname, 'data', 'dataset_1.json'));
  console.log('Recommendation index loaded:', recommendationIndex.docCount, 'items');
} catch (e) {
  console.warn('Could not load recommendation index:', e.message);
}

const aiScoreResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    comments: { type: SchemaType.STRING, description: 'Brief comments on how well the image matches the style.' },
    score: { type: SchemaType.INTEGER, description: 'Match score from 1 (no match) to 5 (perfect match).' },
  },
  required: ['comments', 'score'],
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: aiScoreResponseSchema,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, _res, next) => {
  const user = getSessionUser(req);
  if (user) req.user = { id: user.id, username: user.username };
  next();
});

function setUidCookie(res, uid) {
  // Lightweight, persistent anon identity. Not HttpOnly so it’s easy to debug,
  // but we still don’t treat it as security—just a stable key.
  res.setHeader('Set-Cookie', `uid=${encodeURIComponent(uid)}; Path=/; SameSite=Lax; Max-Age=31536000`);
}

app.use((req, res, next) => {
  // Use a single deterministic key for personalization/profile storage.
  // Prefer explicit client id (works across cross-origin cookie quirks),
  // then fall back to logged-in user id, then to a stable anon cookie.
  if (req.user?.id) {
    req.effectiveUserId = req.user.id;
    return next();
  }

  const headerUid = req.headers['x-user-id'] ? String(req.headers['x-user-id']) : '';
  if (headerUid) {
    req.effectiveUserId = headerUid;
    return next();
  }

  const cookies = parseCookies(req.headers.cookie);
  let uid = cookies.uid ? String(cookies.uid) : '';
  if (!uid) {
    uid = `anon_${crypto.randomUUID()}`;
    setUidCookie(res, uid);
  }
  req.effectiveUserId = uid;
  next();
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    console.log("username: ", username);
    console.log("password: ", password);
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const created = await signup(String(username).trim(), String(password));
    console.log("created: ", created);
    createSessionForUser(res, created.id);

    const anonId = req.headers['x-user-id'] ? String(req.headers['x-user-id']) : '';
    if (anonId && anonId !== created.id) {
      const anonModel = getUserModel(anonId);
      const userModel = getUserModel(created.id);
      const merged = mergeModels(userModel || createEmptyProfile(), anonModel || null);
      if (merged) upsertUserModel(created.id, merged);

      const anonProfiles = getStyleProfiles(anonId);
      const userProfiles = getStyleProfiles(created.id);
      const mergedProfiles = mergeStyleProfiles(userProfiles, anonProfiles);
      setStyleProfiles(created.id, mergedProfiles);
    }

    return res.json({ user: created });
  } catch (e) {
    console.error('Signup error:', e.message);
    return res.status(e.status || 500).json({ error: e.message || 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const user = await login(String(username).trim(), String(password));
    createSessionForUser(res, user.id);

    const anonId = req.headers['x-user-id'] ? String(req.headers['x-user-id']) : '';
    if (anonId && anonId !== user.id) {
      const anonModel = getUserModel(anonId);
      const userModel = getUserModel(user.id);
      const merged = mergeModels(userModel || createEmptyProfile(), anonModel || null);
      if (merged) upsertUserModel(user.id, merged);

      const anonProfiles = getStyleProfiles(anonId);
      const userProfiles = getStyleProfiles(user.id);
      const mergedProfiles = mergeStyleProfiles(userProfiles, anonProfiles);
      setStyleProfiles(user.id, mergedProfiles);
    }

    return res.json({ user });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  return res.json({ user: req.user });
});

app.get('/api/style-profiles', (req, res) => {
  try {
    const userId = req.effectiveUserId;
    const profiles = getStyleProfiles(userId);
    return res.json({ userId, profiles });
  } catch (error) {
    console.error('Style profiles fetch error:', error);
    return res.status(500).json({ error: error.message || 'Failed to load style profiles' });
  }
});

app.put('/api/style-profiles', (req, res) => {
  try {
    const userId = req.effectiveUserId;
    const { profiles } = req.body || {};
    if (!Array.isArray(profiles)) {
      return res.status(400).json({ error: 'profiles must be an array' });
    }
    const saved = setStyleProfiles(userId, profiles);
    return res.json({ userId, profiles: saved });
  } catch (error) {
    console.error('Style profiles save error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save style profiles' });
  }
});

app.post('/api/ai-score', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing image. Send as multipart/form-data with field "image".' });
    }
    const description = req.body.description || '';
    const prompt = `I will give you a description of clothing styles I'm looking for. Tell me if the image I attach fits the style.
Then give a score from 1-5 where 1 is no match at all and 5 is a perfect match.
Description: ${description}`;

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype || 'image/png',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    let body;
    try {
      body = JSON.parse(text.trim());
    } catch {
      body = { comments: text, score: null };
    }

    console.log('comments:', body.comments);
    console.log('score:', body.score);
    res.json(body);
  } catch (error) {
    console.error('AI score error:', error);
    res.status(500).json({ error: error.message || 'AI scoring failed.' });
  }
});

app.get('/api/search-products', async (req, res) => {
  try {
    const { query, limit, categoryId, condition, sortOrder } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const options = {
      limit: parseInt(limit) || 10,
      categoryId,
      condition,
      sortOrder
    };

    const products = await searchProducts(query, options);
    res.json({ 
      query,
      count: products.length,
      products 
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ error: error.message || 'Product search failed' });
  }
});

app.get('/api/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const details = await getItemDetails(itemId);
    res.json(details);
  } catch (error) {
    console.error('Item details error:', error);
    res.status(500).json({ error: error.message || 'Failed to get item details' });
  }
});

/**
 * Recommend clothing items from the indexed catalog.
 * Query params: query, minPrice, maxPrice, style, material, shirt_size, pant_size, limit
 */
app.get('/api/recommend', async (req, res) => {
  try {
    if (!recommendationIndex) {
      return res.status(503).json({ error: 'Recommendation index not loaded' });
    }
    
    const startTime = Date.now();
    console.log("req.query: ", req.query);
    const { query, minPrice, maxPrice, style, material, shirt_size, pant_size, limit, profileId } = req.query;
    
    const filters = {};
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (style) filters.style = style;
    if (material) filters.material = material;
    if (shirt_size) filters.shirt_size = shirt_size;
    if (pant_size) filters.pant_size = pant_size;
    
    const profile = getUserModel(req.effectiveUserId) || null;

    const results = await recommendWithVisualScoring(
      recommendationIndex, 
      query || '', 
      filters,
      limit ? parseInt(limit, 10) : 20,
      { profile, candidateLimit: 100 }
    );
    
    const elapsed = Date.now() - startTime;
    console.log(`Total recommendation time: ${elapsed}ms`);
    console.log("results: ", results);
    res.json({
      query: query || '',
      filters,
      count: results.length,
      results: results,
    });
  } catch (error) {
    console.error('Recommend error:', error);
    res.status(500).json({ error: error.message || 'Recommendation failed' });
  }
});

app.post('/api/profile-interaction', (req, res) => {
  try {
    const { item, eventType } = req.body || {};
    if (!item || typeof item !== 'object') return res.status(400).json({ error: 'item is required' });
    if (!eventType) return res.status(400).json({ error: 'eventType is required' });

    const userId = req.effectiveUserId;
    const current = getUserModel(userId) || createEmptyProfile();
    const updated = applyEvent(current, item, String(eventType));
    upsertUserModel(userId, updated);
    return res.json({ ok: true, userId, model: updated });
  } catch (error) {
    console.error('Profile interaction error:', error);
    return res.status(500).json({ error: error.message || 'Profile update failed' });
  }
});

app.get('/api/user-model', (req, res) => {
  try {
    const userId = req.effectiveUserId;
    const model = getUserModel(userId) || createEmptyProfile();
    return res.json({ userId, model });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: error.message || 'Profile fetch failed' });
  }
});


app.get('/test', (req, res) => {
  return res.json({ message: 'Hello, world!' });
});

app.listen(PORT, (error) => {
  if (!error)
    console.log('Server is Successfully Running, and App is listening on port ' + PORT);
  else
    console.log("Error occurred, server can't start", error);
});