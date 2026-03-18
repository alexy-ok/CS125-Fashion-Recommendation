require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { searchProducts, getItemDetails } = require('./ebay');
const { loadAndBuildIndex } = require('./indexer');
const { recommend } = require('./recommender');
const { getSessionUser, requireAuth, signup, login, createSessionForUser, destroySession } = require('./auth');
const { getProfile, upsertProfile } = require('./stores/profilesStore');
const { createEmptyProfile, applyEvent } = require('./personalModel');

const app = express();
const PORT = 3000;

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
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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

app.post('/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const created = await signup(String(username).trim(), String(password));
    createSessionForUser(res, created.id);
    return res.json({ user: created });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Signup failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const user = await login(String(username).trim(), String(password));
    createSessionForUser(res, user.id);
    return res.json({ user });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Login failed' });
  }
});

app.post('/auth/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

app.get('/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  return res.json({ user: req.user });
});

app.post('/ai-score', upload.single('image'), async (req, res) => {
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

app.get('/search-products', async (req, res) => {
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

app.get('/item/:itemId', async (req, res) => {
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
app.get('/recommend', (req, res) => {
  try {
    if (!recommendationIndex) {
      return res.status(503).json({ error: 'Recommendation index not loaded' });
    }
    console.log("req.query: ", req.query);
    const { query, minPrice, maxPrice, style, material, shirt_size, pant_size, limit, profileId } = req.query;
    
    const filters = {};
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (style) filters.style = style;
    if (material) filters.material = material;
    if (shirt_size) filters.shirt_size = shirt_size;
    if (pant_size) filters.pant_size = pant_size;
    
    let profile = null;
    if (req.user && profileId) {
      profile = getProfile(req.user.id, String(profileId)) || null;
    }

    const results = recommend(
      recommendationIndex, 
      query || '', 
      filters,
      limit ? parseInt(limit, 10) : 20,
      { profile, candidateLimit: 100 }
    );
    
    console.log("query: ", query);
    console.log("filters: ", filters);
    
    res.json({
      query: query || '',
      filters,
      count: results.length,
      results: results.map(({ item, score, bm25Score, personal }) => ({ item, score, bm25Score, personal })),
    });
  } catch (error) {
    console.error('Recommend error:', error);
    res.status(500).json({ error: error.message || 'Recommendation failed' });
  }
});

app.post('/profile-interaction', requireAuth, (req, res) => {
  try {
    const { profileId, item, eventType } = req.body || {};
    if (!profileId) return res.status(400).json({ error: 'profileId is required' });
    if (!item || typeof item !== 'object') return res.status(400).json({ error: 'item is required' });
    if (!eventType) return res.status(400).json({ error: 'eventType is required' });

    const pid = String(profileId);
    const current = getProfile(req.user.id, pid) || createEmptyProfile();
    const updated = applyEvent(current, item, String(eventType));
    upsertProfile(req.user.id, pid, updated);
    return res.json({ ok: true, profile: updated });
  } catch (error) {
    console.error('Profile interaction error:', error);
    return res.status(500).json({ error: error.message || 'Profile update failed' });
  }
});

app.listen(PORT, (error) => {
  if (!error)
    console.log('Server is Successfully Running, and App is listening on port ' + PORT);
  else
    console.log("Error occurred, server can't start", error);
});