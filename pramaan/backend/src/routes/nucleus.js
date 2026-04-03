import express from 'express';
import { fetchNews } from '../tools/news_fetcher.js';
import { personalizeArticles, getComparisonView } from '../agents/personalizer.js';
import { synthesizeTopic, answerQuestion } from '../agents/synthesizer.js';
import { adaptArticle, getTranslationComparison } from '../agents/adaptor.js';

const router = express.Router();

/**
 * POST /api/nucleus/personalized-feed
 * Get personalized news feed based on user intent
 */
router.post('/personalized-feed', async (req, res) => {
  try {
    const { intent, count = 5 } = req.body;

    if (!intent) {
      return res.status(400).json({ error: 'intent is required' });
    }

    console.log(`Fetching personalized feed for ${intent.user_type}...`);

    // Fetch news articles
    const articles = await fetchNews({ count: count * 2 });

    // Personalize for user
    const personalizedArticles = await personalizeArticles(articles, intent, count);

    res.json({
      articles: personalizedArticles,
      user_type: intent.user_type,
      intent_category: intent.intent_category,
      count: personalizedArticles.length,
      success: true
    });

  } catch (error) {
    console.error('Personalized feed error:', error);
    res.status(500).json({
      error: 'Failed to generate personalized feed',
      message: error.message
    });
  }
});

/**
 * POST /api/nucleus/compare
 * Get side-by-side comparison of same article for different users
 */
router.post('/compare', async (req, res) => {
  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'articleId is required' });
    }

    // Fetch article
    const articles = await fetchNews({ count: 10 });
    const article = articles.find(a => a.id === articleId) || articles[0];

    // Get comparison view
    const comparison = await getComparisonView(article);

    res.json({
      comparison,
      success: true
    });

  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({
      error: 'Failed to generate comparison',
      message: error.message
    });
  }
});

/**
 * POST /api/nucleus/synthesize
 * Synthesize multiple articles into one briefing
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { topic, intent } = req.body;

    if (!topic || !intent) {
      return res.status(400).json({ error: 'topic and intent are required' });
    }

    console.log(`Synthesizing topic: ${topic}`);

    // Generate synthesis
    const briefing = await synthesizeTopic(topic, intent);

    res.json({
      briefing,
      success: true
    });

  } catch (error) {
    console.error('Synthesis error:', error);
    res.status(500).json({
      error: 'Failed to synthesize topic',
      message: error.message
    });
  }
});

/**
 * POST /api/nucleus/ask
 * Answer a question about a briefing
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, briefing, intent } = req.body;

    if (!question || !briefing || !intent) {
      return res.status(400).json({ error: 'question, briefing, and intent are required' });
    }

    console.log(`Answering question: ${question}`);

    // Answer question
    const answer = await answerQuestion(question, briefing, intent);

    res.json({
      answer,
      success: true
    });

  } catch (error) {
    console.error('Q&A error:', error);
    res.status(500).json({
      error: 'Failed to answer question',
      message: error.message
    });
  }
});

/**
 * POST /api/nucleus/translate
 * Translate and culturally adapt article to Hindi
 */
router.post('/translate', async (req, res) => {
  try {
    const { article, intent } = req.body;

    if (!article) {
      return res.status(400).json({ error: 'article is required' });
    }

    console.log('Translating article to Hindi...');

    // Adapt article
    const adapted = await adaptArticle(article, intent || {});

    res.json({
      adapted,
      success: true
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: 'Failed to translate article',
      message: error.message
    });
  }
});

/**
 * POST /api/nucleus/translation-comparison
 * Compare Google Translate vs ET Nucleus adaptation
 */
router.post('/translation-comparison', async (req, res) => {
  try {
    const { content, intent } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    console.log('Generating translation comparison...');

    // Get comparison
    const comparison = await getTranslationComparison(content, intent || {});

    res.json({
      comparison,
      success: true
    });

  } catch (error) {
    console.error('Translation comparison error:', error);
    res.status(500).json({
      error: 'Failed to generate translation comparison',
      message: error.message
    });
  }
});

export default router;
