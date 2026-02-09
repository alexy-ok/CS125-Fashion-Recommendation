require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const app = express();
const PORT = 3000;

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

app.listen(PORT, (error) => {
  if (!error)
    console.log('Server is Successfully Running, and App is listening on port ' + PORT);
  else
    console.log("Error occurred, server can't start", error);
});