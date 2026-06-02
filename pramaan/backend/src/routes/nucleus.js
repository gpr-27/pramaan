import express from 'express';
import { fetchNews } from '../tools/news_fetcher.js';
import { personalizeArticles, getComparisonView } from '../agents/personalizer.js';
import { synthesizeTopic, answerQuestion } from '../agents/synthesizer.js';
import { adaptArticle, getTranslationComparison } from '../agents/adaptor.js';
import logger from '../lib/logger.js';
import { isModelAllowed } from '../config/index.js';

const router = express.Router();

/**
 * POST /api/nucleus/personalized-feed
 * Get personalized news feed based on user intent
 */
router.post('/personalized-feed', async (req, res) => {
  try {
    const { intent, count = 5, model } = req.body;

    if (!intent) {
      return res.status(400).json({ error: 'intent is required' });
    }

    const useModel = isModelAllowed(model) ? model : undefined;

    logger.info('personalized-feed', { user_type: intent.user_type, model: useModel });

    // Fetch news articles
    const articles = await fetchNews({ count: count * 2 });

    // Personalize for user
    const personalizedArticles = await personalizeArticles(articles, intent, count, useModel);

    res.json({
      articles: personalizedArticles,
      user_type: intent.user_type,
      intent_category: intent.intent_category,
      count: personalizedArticles.length,
      success: true
    });

  } catch (error) {
    logger.error('Personalized feed error:', error);
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
    const { articleId, model } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'articleId is required' });
    }

    const useModel = isModelAllowed(model) ? model : undefined;

    // Fetch article
    const articles = await fetchNews({ count: 10 });
    const article = articles.find(a => a.id === articleId) || articles[0];

    logger.info('compare', { articleId, model: useModel });

    // Get comparison view
    const comparison = await getComparisonView(article, useModel);

    res.json({
      comparison,
      success: true
    });

  } catch (error) {
    logger.error('Comparison error:', error);
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
    const { topic, intent, model } = req.body;

    if (!topic || !intent) {
      return res.status(400).json({ error: 'topic and intent are required' });
    }

    const useModel = isModelAllowed(model) ? model : undefined;

    logger.info('synthesize', { topic, model: useModel });

    // Generate synthesis
    const briefing = await synthesizeTopic(topic, intent, 5, useModel);

    res.json({
      briefing,
      success: true
    });

  } catch (error) {
    logger.error('Synthesis error:', error);
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
    const { question, briefing, intent, model } = req.body;

    if (!question || !briefing || !intent) {
      return res.status(400).json({ error: 'question, briefing, and intent are required' });
    }

    const useModel = isModelAllowed(model) ? model : undefined;

    logger.info('ask', { question, model: useModel });

    // Answer question
    const answer = await answerQuestion(question, briefing, intent, useModel);

    res.json({
      answer,
      success: true
    });

  } catch (error) {
    logger.error('Q&A error:', error);
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
    const { article, intent, model } = req.body;

    if (!article) {
      return res.status(400).json({ error: 'article is required' });
    }

    const useModel = isModelAllowed(model) ? model : undefined;

    logger.info('translate', { model: useModel });

    // Adapt article
    const adapted = await adaptArticle(article, intent || {}, useModel);

    res.json({
      adapted,
      success: true
    });

  } catch (error) {
    logger.error('Translation error:', error);
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
    const { content, intent, model } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const useModel = isModelAllowed(model) ? model : undefined;

    logger.info('translation-comparison', { model: useModel });

    // Get comparison
    const comparison = await getTranslationComparison(content, intent || {}, useModel);

    res.json({
      comparison,
      success: true
    });

  } catch (error) {
    logger.error('Translation comparison error:', error);
    res.status(500).json({
      error: 'Failed to generate translation comparison',
      message: error.message
    });
  }
});

export default router;
