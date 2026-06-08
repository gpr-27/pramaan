// Mongoose model for a persisted persona.
//
// The document mirrors the in-memory persona shape 1:1 so the store can swap
// between Mongo and the in-memory fallback without the routes noticing. Flexible
// nested structures (context, evolution events, interactions) use Mixed.
import mongoose from 'mongoose';

const { Mixed } = mongoose.Schema.Types;

const personaSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    created_at: String,
    updated_at: String,

    // Core profile (from the Intent Analyzer)
    user_type: String,
    intent_category: String,
    context: { type: Mixed, default: {} },
    topics: { type: [String], default: [] },
    emotional_tone: { type: String, default: 'neutral' },
    action_needed: { type: String, default: 'exploration' },

    // Learning journey
    knowledge_level: { type: String, default: 'beginner' },
    interests: { type: [String], default: [] },
    goals: { type: [String], default: [] },

    // Behaviour tracking
    interaction_count: { type: Number, default: 0 },
    articles_read: { type: [String], default: [] },
    topics_explored: { type: [String], default: [] }, // plain array (deduped by the store)
    questions_asked: { type: [String], default: [] },

    // Evolution metadata + raw interaction log (embedded)
    evolution_history: { type: [Mixed], default: [] },
    interactions: { type: [Mixed], default: [] },
  },
  { minimize: false, versionKey: false }
);

export const Persona = mongoose.models.Persona || mongoose.model('Persona', personaSchema);

export default Persona;
