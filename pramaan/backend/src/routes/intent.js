import express from 'express';
import { analyzeIntent, generateProfileSummary } from '../agents/intent_analyzer.js';
import logger from '../lib/logger.js';

const router = express.Router();

/**
 * POST /api/intent/analyze
 * Analyze user intent from natural language input
 */
router.post('/analyze', async (req, res) => {
  try {
    const { userInput, model } = req.body;

    if (!userInput || userInput.trim().length === 0) {
      return res.status(400).json({ error: 'userInput is required' });
    }

    logger.info('analyze', { userInput, model });

    // Analyze intent
    const intent = await analyzeIntent(userInput, model);

    // Generate friendly profile summary
    const profile = generateProfileSummary(intent);

    res.json({
      intent,
      profile,
      success: true
    });

  } catch (error) {
    logger.error('Intent analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze intent',
      message: error.message
    });
  }
});

export default router;
