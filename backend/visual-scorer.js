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
 * Score a single clothing item image against a description using ZotGPT (Azure OpenAI).
 * Mirrors `scoreImage()` but calls:
 * POST /deployments/{deployment-id}/chat/completions
 *
 * @param {string} imageUrl - URL of the clothing item image
 * @param {string} description - User's style description/query
 * @returns {Promise<number | null>} Score from 1-5, or null if scoring failed
 */
async function scoreImageZotGPT(imageUrl, description) {
  try {
    const imageData = await fetchImageAsBase64(imageUrl);
    if (!imageData) return null;

    const zotBaseUrl = process.env.ZOTGPT_BASE_URL || 'https://azureapi.zotgpt.uci.edu/openai';
    const deploymentId = process.env.ZOTGPT_DEPLOYMENT_ID || 'gpt-4o';
    const apiVersion = process.env.ZOTGPT_API_VERSION || '2024-02-01';

    // The OpenAPI spec allows auth via header `api-key`.
    const apiKey = process.env.ZOTGPT_API_KEY || process.env.AZURE_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('ZOTGPT_API_KEY/AZURE_OPENAI_API_KEY not set; cannot score with ZotGPT.');
      return null;
    }

    const prompt = `I will give you a description of clothing styles I'm looking for and an image of a clothing item. Score the image based on the description
    from 1-5 where 1 is no match at all and 5 is a perfect match in the "score" field of the JSON response. Then give a 1-2 sentence explanation of why you gave the score you did in the "comments" field of the JSON response.
Description: ${description}`;

    // ZotGPT's chat schema uses an `image_url` content part; base64 must be passed as a data URI.
    const imageDataUri = `data:${imageData.mimeType};base64,${imageData.data}`;

    const url = `${zotBaseUrl}/deployments/${encodeURIComponent(deploymentId)}/chat/completions`;

    const body = {
      temperature: 0.2,
      max_tokens: 256,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a fashion style matching assistant. Return ONLY valid JSON with keys "comments" (string) and "score" (integer 1-5).',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUri } },
          ],
        },
      ],
    };

    const result = await axios.post(`${url}?api-version=${encodeURIComponent(apiVersion)}`, body, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      timeout: 30000,
    });

    // Typical shape: { choices: [ { message: { content: "<json>" } } ] }
    const content = result?.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    let parsed;
    if (typeof content === 'string') {
      parsed = JSON.parse(content.trim());
    } else {
      parsed = content; // Some SDKs may already parse JSON if response_format is enabled.
    }

    console.log('parsed:', parsed);

    const score = parsed?.score;
    if (typeof score === 'number' && score >= 1 && score <= 5) return parsed;

    return null;
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.warn(
      `Failed to score image ${imageUrl} with ZotGPT: ${status || ''} ${error.message}`,
      data ? JSON.stringify(data).slice(0, 4000) : ''
    );
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

    // const visualScore = await scoreImage(imageUrl, description);
    const result = await scoreImageZotGPT(imageUrl, description);
    const visualScore = result?.score;
    const comments = result?.comments;
    console.log('comments:', comments);
    console.log('visualScore:', visualScore);
    return { item, bm25Score, visualScore, comments };
  });

  const results = await Promise.all(scoringPromises);
  console.log('results:', results);
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
  scoreImageZotGPT,
  scoreImageBatch,
  normalizeVisualScore,
};
