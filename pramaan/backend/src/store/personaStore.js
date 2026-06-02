/**
 * In-Memory Persona Store
 * Manages user personas and their evolution over time
 */

class PersonaStore {
  constructor() {
    // Map: user_id -> persona object
    this.personas = new Map();

    // Map: user_id -> interaction history
    this.interactions = new Map();
  }

  /**
   * Create a new persona
   */
  createPersona(userId, profile) {
    const persona = {
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Core profile from Intent Analyzer
      user_type: profile.user_type,
      intent_category: profile.intent_category,
      context: profile.context || {},
      topics: profile.topics || [],
      emotional_tone: profile.emotional_tone || 'neutral',
      action_needed: profile.action_needed || 'exploration',

      // Learning journey
      knowledge_level: profile.context?.knowledge_level || 'beginner',
      interests: profile.topics || [],
      goals: profile.goals || [],

      // Behavior tracking
      interaction_count: 0,
      articles_read: [],
      topics_explored: new Set(profile.topics || []),
      questions_asked: [],

      // Evolution metadata
      evolution_history: [{
        date: new Date().toISOString(),
        event: 'persona_created',
        knowledge_level: profile.context?.knowledge_level || 'beginner',
        details: {
          initial_input: profile.original_input || ''
        }
      }]
    };

    this.personas.set(userId, persona);
    this.interactions.set(userId, []);

    console.log(`✅ Persona created for user ${userId}: ${persona.user_type}`);
    return persona;
  }

  /**
   * Get persona by user ID
   */
  getPersona(userId) {
    return this.personas.get(userId);
  }

  /**
   * Check if persona exists
   */
  hasPersona(userId) {
    return this.personas.has(userId);
  }

  /**
   * Record an interaction
   */
  recordInteraction(userId, interaction) {
    if (!this.personas.has(userId)) {
      console.warn(`⚠️ No persona found for user ${userId}`);
      return null;
    }

    const persona = this.personas.get(userId);
    const interactions = this.interactions.get(userId);

    // Add interaction to history
    const interactionRecord = {
      timestamp: new Date().toISOString(),
      type: interaction.type,
      data: interaction.data
    };
    interactions.push(interactionRecord);

    // Update persona stats
    persona.interaction_count += 1;
    persona.updated_at = new Date().toISOString();

    // Track specific behaviors
    if (interaction.type === 'article_read') {
      persona.articles_read.push(interaction.data.article_id);

      // Track topics from article
      if (interaction.data.category) {
        persona.topics_explored.add(interaction.data.category);
      }
    } else if (interaction.type === 'question_asked') {
      persona.questions_asked.push(interaction.data.question);
    } else if (interaction.type === 'synthesis_request') {
      persona.topics_explored.add(interaction.data.topic);
    }

    this.personas.set(userId, persona);
    this.interactions.set(userId, interactions);

    console.log(`📝 Interaction recorded for ${userId}: ${interaction.type} (total: ${persona.interaction_count})`);
    return persona;
  }

  /**
   * Update persona profile (after evolution)
   */
  updatePersona(userId, updates) {
    if (!this.personas.has(userId)) {
      console.warn(`⚠️ No persona found for user ${userId}`);
      return null;
    }

    const persona = this.personas.get(userId);

    // Merge updates
    Object.assign(persona, updates);
    persona.updated_at = new Date().toISOString();

    this.personas.set(userId, persona);

    console.log(`✨ Persona updated for ${userId}`);
    return persona;
  }

  /**
   * Add evolution event
   */
  addEvolutionEvent(userId, event) {
    if (!this.personas.has(userId)) {
      return null;
    }

    const persona = this.personas.get(userId);
    persona.evolution_history.push({
      date: new Date().toISOString(),
      ...event
    });

    this.personas.set(userId, persona);
    return persona;
  }

  /**
   * Migrate a guest persona to an authenticated account (continuity on sign-in).
   * Idempotent: if the target already has a persona, the account's persona is
   * kept and nothing is overwritten. Returns the target persona (or null).
   */
  migratePersona(fromUserId, toUserId) {
    if (!fromUserId || !toUserId || fromUserId === toUserId) return this.personas.get(toUserId) || null;

    // Account already has a persona — keep it, do not clobber with guest data.
    if (this.personas.has(toUserId)) return this.personas.get(toUserId);

    const src = this.personas.get(fromUserId);
    if (!src) return null;

    const clone = {
      ...src,
      user_id: toUserId,
      topics_explored: new Set(src.topics_explored),
      interests: [...(src.interests || [])],
      articles_read: [...(src.articles_read || [])],
      questions_asked: [...(src.questions_asked || [])],
      goals: [...(src.goals || [])],
      evolution_history: [
        ...(src.evolution_history || []),
        { date: new Date().toISOString(), event: 'guest_migrated', details: { from: fromUserId } },
      ],
      updated_at: new Date().toISOString(),
    };

    this.personas.set(toUserId, clone);
    this.interactions.set(toUserId, [...(this.interactions.get(fromUserId) || [])]);
    return clone;
  }

  /**
   * Get interaction history
   */
  getInteractions(userId) {
    return this.interactions.get(userId) || [];
  }

  /**
   * Get all personas (for debugging)
   */
  getAllPersonas() {
    return Array.from(this.personas.entries()).map(([userId, persona]) => ({
      user_id: userId,
      user_type: persona.user_type,
      knowledge_level: persona.knowledge_level,
      interaction_count: persona.interaction_count,
      created_at: persona.created_at
    }));
  }

  /**
   * Clear store (for testing)
   */
  clear() {
    this.personas.clear();
    this.interactions.clear();
    console.log('🗑️  Persona store cleared');
  }
}

// Singleton instance
export const personaStore = new PersonaStore();
