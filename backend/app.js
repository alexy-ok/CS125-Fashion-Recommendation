require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { searchProducts, getItemDetails } = require('./ebay');
const { loadAndBuildIndex } = require('./indexer');
const { recommend } = require('./recommender');

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

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
 * Query params: q (text), size, category, minPrice, maxPrice, limit
 */
app.get('/recommend', (req, res) => {
  try {
    if (!recommendationIndex) {
      return res.status(503).json({ error: 'Recommendation index not loaded' });
    }
    const { q, size, category, minPrice, maxPrice, limit } = req.query;
    const results = recommend(recommendationIndex, q || '', {
      size: size || undefined,
      category: category || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    }, limit ? parseInt(limit, 10) : 20);
    res.json({
      query: q || '',
      filters: { size, category, minPrice, maxPrice },
      count: results.length,
      results: results.map(({ item, score }) => ({ item, score })),
    });
  } catch (error) {
    console.error('Recommend error:', error);
    res.status(500).json({ error: error.message || 'Recommendation failed' });
  }
});

app.listen(PORT, (error) => {
  if (!error)
    console.log('Server is Successfully Running, and App is listening on port ' + PORT);
  else
    console.log("Error occurred, server can't start", error);
});