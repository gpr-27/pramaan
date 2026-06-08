import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { personaStore } from '../store/personaStore.js';
import { analyzeIntent } from '../agents/intent_analyzer.js';
import { shouldEvolvePersona, evolvePersona, autoUpgradeKnowledge } from '../agents/persona_evolver.js';
import logger from '../lib/logger.js';
import { isModelAllowed } from '../config/index.js';
import { resolveUserId } from '../lib/auth.js';

const router = express.Router();

/**
 * POST /api/persona/migrate
 * Continuity: copy a guest persona into an authenticated account on sign-in.
 * Idempotent — if the account already has a persona, nothing is overwritten.
 */
router.post('/migrate', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ success: false, error: 'fromUserId and toUserId are required' });
    }
    // Prefer the verified Clerk id for the migration TARGET when signed in.
    const target = resolveUserId(req, toUserId);
    const persona = await personaStore.migratePersona(fromUserId, target);
    logger.info('persona migrate', { fromUserId, toUserId: target, migrated: Boolean(persona) });
    res.json({ success: true, migrated: Boolean(persona), persona: persona || null });
  } catch (error) {
    logger.error('Persona migration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/persona/create
 * Create a new persona from natural language input.
 */
router.post('/create', async (req, res) => {
  try {
    const { userInput, userId, model } = req.body;

    if (!userInput || !userInput.trim()) {
      return res.status(400).json({ success: false, error: 'User input is required' });
    }

    // When signed in, the verified Clerk id wins over the client-supplied id.
    const finalUserId = resolveUserId(req, userId || uuidv4());

    if (await personaStore.hasPersona(finalUserId)) {
      const existingPersona = await personaStore.getPersona(finalUserId);
      return res.json({
        success: true,
        persona: existingPersona,
        message: 'Persona already exists',
        is_new: false,
      });
    }

    const useModel = isModelAllowed(model) ? model : undefined;
    logger.info('persona create', { userId: finalUserId, userInput, model: useModel });

    const intent = await analyzeIntent(userInput, useModel);

    const profile = {
      user_type: intent.user_type,
      intent_category: intent.intent_category,
      context: intent.context,
      topics: intent.topics,
      emotional_tone: intent.emotional_tone,
      action_needed: intent.action_needed,
      goals: intent.goals || [],
      original_input: userInput,
    };

    const persona = await personaStore.createPersona(finalUserId, profile);

    res.json({
      success: true,
      persona,
      intent,
      message: 'Persona created successfully',
      is_new: true,
    });
  } catch (error) {
    logger.error('Persona creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/persona/:userId
 * Retrieve persona by user ID. A missing persona is the NORMAL "new visitor"
 * case (the home page probes this on load), so return 200 with persona:null
 * instead of a 404; the client branches on `exists`.
 */
router.get('/:userId', async (req, res) => {
  try {
    const persona = await personaStore.getPersona(req.params.userId);
    res.json({ success: true, exists: Boolean(persona), persona: persona || null });
  } catch (error) {
    logger.error('Persona retrieval error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/persona/:userId/interaction
 * Record a user interaction.
 */
router.post('/:userId/interaction', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, data } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, error: 'Interaction type is required' });
    }

    const persona = await personaStore.getPersona(userId);
    if (!persona) {
      return res.status(404).json({ success: false, error: 'Persona not found' });
    }

    const updatedPersona = await personaStore.recordInteraction(userId, { type, data: data || {} });

    // Rule-based knowledge auto-upgrade (no LLM call).
    const interactions = await personaStore.getInteractions(userId);
    const upgradeCheck = autoUpgradeKnowledge(updatedPersona, interactions);

    if (upgradeCheck.upgraded) {
      logger.info('persona auto-upgrade', { userId, from: persona.knowledge_level, to: upgradeCheck.new_level });

      await personaStore.updatePersona(userId, { knowledge_level: upgradeCheck.new_level });
      await personaStore.addEvolutionEvent(userId, {
        event: 'knowledge_upgrade',
        from: persona.knowledge_level,
        to: upgradeCheck.new_level,
        reason: upgradeCheck.reason,
        interaction_count: updatedPersona.interaction_count,
      });
    }

    res.json({
      success: true,
      persona: await personaStore.getPersona(userId),
      interaction_recorded: true,
      upgraded: upgradeCheck.upgraded,
    });
  } catch (error) {
    logger.error('Interaction recording error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/persona/:userId/evolve
 * Trigger AI-powered persona evolution.
 */
router.post('/:userId/evolve', async (req, res) => {
  try {
    const { userId } = req.params;
    const { force, model } = req.body;

    const persona = await personaStore.getPersona(userId);
    if (!persona) {
      return res.status(404).json({ success: false, error: 'Persona not found' });
    }

    const useModel = isModelAllowed(model) ? model : undefined;
    const interactions = await personaStore.getInteractions(userId);

    const shouldEvolve = await shouldEvolvePersona(persona, interactions, useModel);

    if (!shouldEvolve.should_evolve && !force) {
      return res.json({ success: true, evolved: false, reason: shouldEvolve.reason, persona });
    }

    logger.info('persona evolve', { userId, model: useModel, signals: shouldEvolve.signals });

    const evolved = await evolvePersona(persona, interactions, shouldEvolve.signals || [], useModel);

    await personaStore.updatePersona(userId, {
      user_type: evolved.user_type,
      knowledge_level: evolved.knowledge_level,
      intent_category: evolved.intent_category,
      interests: evolved.interests,
      goals: evolved.goals,
    });

    await personaStore.addEvolutionEvent(userId, {
      event: 'ai_evolution',
      changes: evolved.changes_made,
      reasoning: evolved.reasoning,
      personalization_note: evolved.personalization_note,
      interaction_count: persona.interaction_count,
      confidence: shouldEvolve.confidence,
    });

    res.json({
      success: true,
      evolved: true,
      persona: await personaStore.getPersona(userId),
      changes: evolved.changes_made,
      reasoning: evolved.reasoning,
    });
  } catch (error) {
    logger.error('Persona evolution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/persona/:userId/history
 * Get evolution + interaction history.
 */
router.get('/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;

    const persona = await personaStore.getPersona(userId);
    if (!persona) {
      return res.status(404).json({ success: false, error: 'Persona not found' });
    }

    const interactions = await personaStore.getInteractions(userId);

    res.json({
      success: true,
      history: {
        evolution: persona.evolution_history,
        interactions: interactions.slice(-20),
        stats: {
          total_interactions: persona.interaction_count,
          articles_read: persona.articles_read.length,
          questions_asked: persona.questions_asked.length,
          topics_explored: Array.from(persona.topics_explored || []),
        },
      },
    });
  } catch (error) {
    logger.error('History retrieval error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/persona/
 * List all personas (for debugging).
 */
router.get('/', async (req, res) => {
  try {
    const personas = await personaStore.getAllPersonas();
    res.json({ success: true, personas, count: personas.length });
  } catch (error) {
    logger.error('Personas retrieval error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/persona/:userId
 * Delete a persona (for testing).
 */
router.delete('/:userId', async (req, res) => {
  try {
    const deleted = await personaStore.deletePersona(req.params.userId);
    if (deleted) {
      res.json({ success: true, message: 'Persona deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Persona not found' });
    }
  } catch (error) {
    logger.error('Persona deletion error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
