/**
 * Persona store — MongoDB-backed when a reachable MONGODB_URI is configured,
 * otherwise an in-memory fallback. Both backends expose the SAME async API and
 * return the SAME persona shape, so routes never branch on the backend.
 *
 * `interactions` are stored alongside each persona but kept OUT of the persona
 * object returned to clients (fetched separately via getInteractions), matching
 * the original API. `topics_explored` is a plain deduped array.
 */
import { connectMongo, isMongoConnected } from './db.js';
import { Persona } from './models/Persona.js';
import logger from '../lib/logger.js';

const nowIso = () => new Date().toISOString();
const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];

// Build a fresh persona object from an Intent-Analyzer profile.
function buildPersona(userId, profile) {
  const knowledge = profile.context?.knowledge_level || 'beginner';
  return {
    user_id: userId,
    created_at: nowIso(),
    updated_at: nowIso(),

    user_type: profile.user_type,
    intent_category: profile.intent_category,
    context: profile.context || {},
    topics: profile.topics || [],
    emotional_tone: profile.emotional_tone || 'neutral',
    action_needed: profile.action_needed || 'exploration',

    knowledge_level: knowledge,
    interests: profile.topics || [],
    goals: profile.goals || [],

    interaction_count: 0,
    articles_read: [],
    topics_explored: uniq(profile.topics || []),
    questions_asked: [],

    evolution_history: [
      {
        date: nowIso(),
        event: 'persona_created',
        knowledge_level: knowledge,
        details: { initial_input: profile.original_input || '' },
      },
    ],
    interactions: [],
  };
}

// Strip storage-only fields before returning a persona to a client.
function toPublicPersona(p) {
  if (!p) return null;
  const { interactions, _id, __v, ...rest } = p;
  return rest;
}

class PersonaStore {
  constructor() {
    this.useMongo = false;
    this.personas = new Map(); // in-memory fallback: userId -> full persona (incl. interactions)
  }

  /** Connect to Mongo if configured/reachable; otherwise stay in-memory. */
  async init() {
    this.useMongo = await connectMongo();
    return this.useMongo;
  }

  get backend() {
    return this._mongo() ? 'mongodb' : 'in-memory';
  }

  _mongo() {
    return this.useMongo && isMongoConnected();
  }

  async _load(userId) {
    if (this._mongo()) return (await Persona.findOne({ user_id: userId }).lean()) || null;
    return this.personas.get(userId) || null;
  }

  async _save(persona) {
    if (this._mongo()) {
      const { _id, __v, ...doc } = persona;
      await Persona.updateOne({ user_id: doc.user_id }, { $set: doc }, { upsert: true });
    } else {
      this.personas.set(persona.user_id, persona);
    }
    return persona;
  }

  async createPersona(userId, profile) {
    const persona = buildPersona(userId, profile);
    await this._save(persona);
    logger.info(`Persona created for ${userId}: ${persona.user_type} [${this.backend}]`);
    return toPublicPersona(persona);
  }

  async getPersona(userId) {
    return toPublicPersona(await this._load(userId));
  }

  async hasPersona(userId) {
    if (this._mongo()) return Boolean(await Persona.exists({ user_id: userId }));
    return this.personas.has(userId);
  }

  async recordInteraction(userId, interaction) {
    const persona = await this._load(userId);
    if (!persona) {
      logger.warn(`recordInteraction: no persona for ${userId}`);
      return null;
    }
    persona.interactions = persona.interactions || [];
    persona.interactions.push({ timestamp: nowIso(), type: interaction.type, data: interaction.data || {} });
    persona.interaction_count = (persona.interaction_count || 0) + 1;
    persona.updated_at = nowIso();

    const data = interaction.data || {};
    if (interaction.type === 'article_read') {
      if (data.article_id) persona.articles_read.push(data.article_id);
      if (data.category) persona.topics_explored = uniq([...persona.topics_explored, data.category]);
    } else if (interaction.type === 'question_asked') {
      if (data.question) persona.questions_asked.push(data.question);
    } else if (interaction.type === 'synthesis_request') {
      if (data.topic) persona.topics_explored = uniq([...persona.topics_explored, data.topic]);
    }

    await this._save(persona);
    return toPublicPersona(persona);
  }

  async updatePersona(userId, updates) {
    const persona = await this._load(userId);
    if (!persona) {
      logger.warn(`updatePersona: no persona for ${userId}`);
      return null;
    }
    Object.assign(persona, updates);
    persona.updated_at = nowIso();
    await this._save(persona);
    return toPublicPersona(persona);
  }

  async addEvolutionEvent(userId, event) {
    const persona = await this._load(userId);
    if (!persona) return null;
    persona.evolution_history = persona.evolution_history || [];
    persona.evolution_history.push({ date: nowIso(), ...event });
    await this._save(persona);
    return toPublicPersona(persona);
  }

  /**
   * Copy a guest persona into an authenticated account on sign-in. Idempotent:
   * if the target already has a persona, it is kept and nothing is overwritten.
   */
  async migratePersona(fromUserId, toUserId) {
    if (!fromUserId || !toUserId || fromUserId === toUserId) {
      return toPublicPersona(await this._load(toUserId));
    }
    if (await this.hasPersona(toUserId)) return toPublicPersona(await this._load(toUserId));

    const src = await this._load(fromUserId);
    if (!src) return null;

    const clone = {
      ...src,
      user_id: toUserId,
      topics_explored: uniq(src.topics_explored),
      interests: [...(src.interests || [])],
      articles_read: [...(src.articles_read || [])],
      questions_asked: [...(src.questions_asked || [])],
      goals: [...(src.goals || [])],
      interactions: [...(src.interactions || [])],
      evolution_history: [
        ...(src.evolution_history || []),
        { date: nowIso(), event: 'guest_migrated', details: { from: fromUserId } },
      ],
      updated_at: nowIso(),
    };
    delete clone._id;
    delete clone.__v;
    await this._save(clone);
    return toPublicPersona(clone);
  }

  async getInteractions(userId) {
    const p = await this._load(userId);
    return p?.interactions || [];
  }

  async getAllPersonas() {
    const pick = (p) => ({
      user_id: p.user_id,
      user_type: p.user_type,
      knowledge_level: p.knowledge_level,
      interaction_count: p.interaction_count,
      created_at: p.created_at,
    });
    if (this._mongo()) {
      const docs = await Persona.find({}, 'user_id user_type knowledge_level interaction_count created_at').lean();
      return docs.map(pick);
    }
    return Array.from(this.personas.values()).map(pick);
  }

  async deletePersona(userId) {
    if (this._mongo()) {
      const res = await Persona.deleteOne({ user_id: userId });
      return res.deletedCount > 0;
    }
    return this.personas.delete(userId);
  }
}

// Singleton instance.
export const personaStore = new PersonaStore();
export default personaStore;
