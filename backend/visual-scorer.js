require('dotenv').config();
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const axios = require('axios');

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

/**
 * Fetch image from URL and convert to base64
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<{data: string, mimeType: string} | null>}
 */
async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    
    return { data: base64, mimeType };
  } catch (error) {
    console.warn(`Failed to fetch image from ${imageUrl}:`, error.message);
    return null;
  }
}

/**
 * Score a single clothing item image against a description
 * @param {string} imageUrl - URL of the clothing item image
 * @param {string} description - User's style description/query
 * @returns {Promise<number | null>} Score from 1-5, or null if scoring failed
 */
async function scoreImage(imageUrl, description) {
  try {
    const imageData = await fetchImageAsBase64(imageUrl);
    if (!imageData) {
      return null;
    }

    const prompt = `I will give you a description of clothing styles I'm looking for. Tell me if the image I attach fits the style.
Then give a score from 1-5 where 1 is no match at all and 5 is a perfect match.
Description: ${description}`;

    const imagePart = {
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    let body;
    try {
      body = JSON.parse(text.trim());
    } catch {
      console.warn('Failed to parse AI response:', text);
      return null;
    }

    const score = body.score;
    if (typeof score === 'number' && score >= 1 && score <= 5) {
      return score;
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to score image ${imageUrl}:`, error.message);
    return null;
  }
}

/**
 * Score multiple clothing item images in parallel
 * @param {Array<{item: object, score: number}>} items - Items with BM25 scores
 * @param {string} description - User's style description/query
 * @returns {Promise<Array<{item: object, bm25Score: number, visualScore: number | null}>>}
 */
async function scoreImageBatch(items, description) {
  console.log(`Starting visual scoring for ${items.length} items...`);
  const startTime = Date.now();

  const scoringPromises = items.map(async ({ item, score: bm25Score }) => {
    const imageUrl = item.image_url || (item.image_urls && item.image_urls[0]);
    
    if (!imageUrl) {
      console.warn(`Item ${item.docId} has no image URL`);
      return { item, bm25Score, visualScore: null };
    }

    const visualScore = await scoreImage(imageUrl, description);
    return { item, bm25Score, visualScore };
  });

  const results = await Promise.all(scoringPromises);
  
  const elapsed = Date.now() - startTime;
  const successCount = results.filter(r => r.visualScore !== null).length;
  console.log(`Visual scoring completed: ${successCount}/${items.length} successful in ${elapsed}ms`);
  
  return results;
}

/**
 * Normalize a score from 1-5 range to 0-1 range
 * @param {number} score - Score from 1-5
 * @returns {number} Normalized score from 0-1
 */
function normalizeVisualScore(score) {
  if (score === null || score === undefined) return 0;
  return (score - 1) / 4;
}

module.exports = {
  scoreImage,
  scoreImageBatch,
  normalizeVisualScore,
};
