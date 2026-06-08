import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { personaStore } from '../store/personaStore.js';
import { analyzeIntent } from '../agents/intent_analyzer.js';
import { shouldEvolvePersona, evolvePersona, autoUpgradeKnowledge } from '../agents/persona_evolver.js';
import logger from '../lib/logger.js';
import { isModelAllowed } from '../config/index.js';

const router = express.Router();

/**
 * POST /api/persona/migrate
 * Continuity: copy a guest persona into an authenticated account on sign-in.
 * Idempotent — if the account already has a persona, nothing is overwritten.
 */
router.post('/migrate', (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ success: false, error: 'fromUserId and toUserId are required' });
    }
    const persona = personaStore.migratePersona(fromUserId, toUserId);
    logger.info('persona migrate', { fromUserId, toUserId, migrated: Boolean(persona) });
    res.json({ success: true, migrated: Boolean(persona), persona: persona || null });
  } catch (error) {
    logger.error('Persona migration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/persona/create
 * Create a new persona from natural language input
 */
router.post('/create', async (req, res) => {
  try {
    const { userInput, userId, model } = req.body;

    if (!userInput || !userInput.trim()) {
      return res.status(400).json({
        success: false,
        error: 'User input is required'
      });
    }

    // Generate user ID if not provided
    const finalUserId = userId || uuidv4();

    // Check if persona already exists
    if (personaStore.hasPersona(finalUserId)) {
      const existingPersona = personaStore.getPersona(finalUserId);
      return res.json({
        success: true,
        persona: existingPersona,
        message: 'Persona already exists',
        is_new: false
      });
    }

    // Use Intent Analyzer to create profile from natural language
    const useModel = isModelAllowed(model) ? model : undefined;
    logger.info('persona create', { userId: finalUserId, userInput, model: useModel });

    const intent = await analyzeIntent(userInput, useModel);

    // Create persona profile
    const profile = {
      user_type: intent.user_type,
      intent_category: intent.intent_category,
      context: intent.context,
      topics: intent.topics,
      emotional_tone: intent.emotional_tone,
      action_needed: intent.action_needed,
      goals: intent.goals || [],
      original_input: userInput
    };

    // Store persona
    const persona = personaStore.createPersona(finalUserId, profile);

    res.json({
      success: true,
      persona,
      intent,
      message: 'Persona created successfully',
      is_new: true
    });

  } catch (error) {
    logger.error('Persona creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/persona/:userId
 * Retrieve persona by user ID
 */
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const persona = personaStore.getPersona(userId);

    // A missing persona is the NORMAL "new visitor" case — the home page probes
    // this on every load. Return 200 with persona:null (instead of a 404 that
    // would log a red error in the browser console on every fresh visit); the
    // client branches on `exists`.
    res.json({
      success: true,
      exists: Boolean(persona),
      persona: persona || null,
    });

  } catch (error) {
    logger.error('Persona retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/persona/:userId/interaction
 * Record a user interaction
 */
router.post('/:userId/interaction', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, data } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Interaction type is required'
      });
    }

    const persona = personaStore.getPersona(userId);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    // Record interaction
    const updatedPersona = personaStore.recordInteraction(userId, {
      type,
      data: data || {}
    });

    // Check for auto-upgrade (rule-based, no LLM call)
    const interactions = personaStore.getInteractions(userId);
    const upgradeCheck = autoUpgradeKnowledge(updatedPersona, interactions);

    if (upgradeCheck.upgraded) {
      logger.info('persona auto-upgrade', { userId, from: persona.knowledge_level, to: upgradeCheck.new_level });

      personaStore.updatePersona(userId, {
        knowledge_level: upgradeCheck.new_level
      });

      personaStore.addEvolutionEvent(userId, {
        event: 'knowledge_upgrade',
        from: persona.knowledge_level,
        to: upgradeCheck.new_level,
        reason: upgradeCheck.reason,
        interaction_count: updatedPersona.interaction_count
      });
    }

    res.json({
      success: true,
      persona: personaStore.getPersona(userId),
      interaction_recorded: true,
      upgraded: upgradeCheck.upgraded
    });

  } catch (error) {
    logger.error('Interaction recording error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/persona/:userId/evolve
 * Trigger AI-powered persona evolution
 */
router.post('/:userId/evolve', async (req, res) => {
  try {
    const { userId } = req.params;
    const { force, model } = req.body; // Force evolution even if rules say no

    const persona = personaStore.getPersona(userId);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    const useModel = isModelAllowed(model) ? model : undefined;

    const interactions = personaStore.getInteractions(userId);

    // Check if evolution is needed
    const shouldEvolve = await shouldEvolvePersona(persona, interactions, useModel);

    if (!shouldEvolve.should_evolve && !force) {
      return res.json({
        success: true,
        evolved: false,
        reason: shouldEvolve.reason,
        persona
      });
    }

    logger.info('persona evolve', { userId, model: useModel, signals: shouldEvolve.signals });

    // Generate evolved persona using AI
    const evolved = await evolvePersona(persona, interactions, shouldEvolve.signals || [], useModel);

    // Update persona
    const updates = {
      user_type: evolved.user_type,
      knowledge_level: evolved.knowledge_level,
      intent_category: evolved.intent_category,
      interests: evolved.interests,
      goals: evolved.goals
    };

    personaStore.updatePersona(userId, updates);

    // Record evolution event
    personaStore.addEvolutionEvent(userId, {
      event: 'ai_evolution',
      changes: evolved.changes_made,
      reasoning: evolved.reasoning,
      personalization_note: evolved.personalization_note,
      interaction_count: persona.interaction_count,
      confidence: shouldEvolve.confidence
    });

    const finalPersona = personaStore.getPersona(userId);

    res.json({
      success: true,
      evolved: true,
      persona: finalPersona,
      changes: evolved.changes_made,
      reasoning: evolved.reasoning
    });

  } catch (error) {
    logger.error('Persona evolution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/persona/:userId/history
 * Get evolution history
 */
router.get('/:userId/history', (req, res) => {
  try {
    const { userId } = req.params;

    const persona = personaStore.getPersona(userId);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    const interactions = personaStore.getInteractions(userId);

    res.json({
      success: true,
      history: {
        evolution: persona.evolution_history,
        interactions: interactions.slice(-20), // Last 20 interactions
        stats: {
          total_interactions: persona.interaction_count,
          articles_read: persona.articles_read.length,
          questions_asked: persona.questions_asked.length,
          topics_explored: Array.from(persona.topics_explored)
        }
      }
    });

  } catch (error) {
    logger.error('History retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/persona/all
 * Get all personas (for debugging)
 */
router.get('/', (req, res) => {
  try {
    const personas = personaStore.getAllPersonas();

    res.json({
      success: true,
      personas,
      count: personas.length
    });

  } catch (error) {
    logger.error('Personas retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/persona/:userId
 * Delete a persona (for testing)
 */
router.delete('/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (personaStore.hasPersona(userId)) {
      personaStore.personas.delete(userId);
      personaStore.interactions.delete(userId);

      res.json({
        success: true,
        message: 'Persona deleted'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

  } catch (error) {
    logger.error('Persona deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
