import { groq, resolveModel } from '../lib/groqClient.js';
import logger from '../lib/logger.js';

/**
 * Intent Analyzer Agent
 * Extracts user intent, context, and topics from natural language input
 */
export async function analyzeIntent(userInput, model) {
  try {
    const prompt = `You are an AI that understands what people want from business news.

User said: "${userInput}"

Extract the following in JSON format:
{
  "intent_category": "Investment Decision" | "Concept Learning" | "Competitive Tracking" | "Market Analysis" | "Career/Business Planning",
  "user_type": "first_time_investor" | "experienced_investor" | "day_trader" | "startup_founder" | "student" | "professional" | "entrepreneur",
  "context": {
    "budget": "extract if mentioned (e.g. '5 lakhs', '1 crore') or null",
    "risk_tolerance": "conservative" | "moderate" | "aggressive" | "unknown",
    "knowledge_level": "beginner" | "intermediate" | "expert",
    "time_horizon": "short_term" | "long_term" | "unknown"
  },
  "topics": ["array", "of", "relevant", "topics"],
  "keywords": ["specific", "financial", "terms"],
  "emotional_tone": "anxious" | "confident" | "curious" | "neutral",
  "action_needed": "explanation" | "recommendation" | "comparison" | "tracking" | "analysis"
}

Examples:
- "I have 5 lakhs to invest" → Investment Decision, first_time_investor, budget: 5 lakhs, beginner, anxious
- "Explain mutual funds to me" → Concept Learning, student/first_time_investor, beginner, curious
- "Track Swiggy's funding rounds" → Competitive Tracking, entrepreneur/founder, intermediate, tracking
- "Should I buy Nifty at 22,500?" → Investment Decision, experienced_investor/day_trader, intermediate, recommendation

Be intelligent about inference. "5 lakhs" suggests first-time investor. Technical terms suggest experience.`;

    const resolvedModel = resolveModel(model);
    logger.debug(`analyzeIntent using model: ${resolvedModel}`);
    const completion = await groq.chat.completions.create({
      model: resolvedModel,
      messages: [
        {
          role: 'system',
          content: 'You are a business news intelligence system that understands user intent.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const intent = JSON.parse(completion.choices[0].message.content);

    // Add confidence score based on how specific the input is
    intent.confidence = userInput.length > 20 ? 'high' : 'medium';
    intent.original_input = userInput;

    logger.info('Intent analysis:', JSON.stringify(intent, null, 2));
    return intent;

  } catch (error) {
    logger.error('Intent analysis error:', error.message);

    // Fallback: Basic intent detection
    return {
      intent_category: 'Market Analysis',
      user_type: 'professional',
      context: {
        budget: null,
        risk_tolerance: 'unknown',
        knowledge_level: 'intermediate',
        time_horizon: 'unknown'
      },
      topics: ['general'],
      keywords: [],
      emotional_tone: 'neutral',
      action_needed: 'explanation',
      confidence: 'low',
      original_input: userInput,
      error: 'fallback_mode'
    };
  }
}

/**
 * Generate user profile summary from intent
 */
export function generateProfileSummary(intent) {
  const summaries = {
    first_time_investor: "You're starting your investment journey",
    experienced_investor: "You're an experienced market participant",
    day_trader: "You're looking for technical trading signals",
    startup_founder: "You're building a business",
    student: "You're learning about business and finance",
    professional: "You're staying informed for your career",
    entrepreneur: "You're exploring business opportunities"
  };

  const actionPhrases = {
    explanation: "Let me explain this clearly for you",
    recommendation: "I'll help you make an informed decision",
    comparison: "I'll compare your options",
    tracking: "I'll keep you updated on this",
    analysis: "I'll break down the key insights"
  };

  return {
    greeting: summaries[intent.user_type] || "Welcome to ET Nucleus",
    action: actionPhrases[intent.action_needed] || "Let me help you understand this better",
    focus: intent.topics.length > 0
      ? `Focusing on: ${intent.topics.slice(0, 3).join(', ')}`
      : "Showing you relevant business news"
  };
}
