import { groq, resolveModel } from '../lib/groqClient.js';
import logger from '../lib/logger.js';

/**
 * Persona Evolution Agent
 * Analyzes user behavior and evolves their persona using AI
 */

/**
 * Analyze if persona should evolve based on interactions
 */
export async function shouldEvolvePersona(persona, interactions, model) {
  // Rule-based checks first (to save LLM calls)

  // Need at least 5 interactions
  if (persona.interaction_count < 5) {
    return {
      should_evolve: false,
      reason: 'Insufficient interaction history (need 5+)'
    };
  }

  // Has persona been updated recently? (wait at least 10 interactions)
  const lastEvolution = persona.evolution_history[persona.evolution_history.length - 1];
  const interactionsSinceEvolution = persona.interaction_count -
    (lastEvolution.interaction_count || 0);

  if (interactionsSinceEvolution < 10) {
    return {
      should_evolve: false,
      reason: `Only ${interactionsSinceEvolution} interactions since last evolution (need 10+)`
    };
  }

  // Use AI to analyze behavior patterns
  try {
    const recentInteractions = interactions.slice(-15); // Last 15 interactions

    const prompt = `You are analyzing if a user's persona should evolve based on their behavior.

CURRENT PERSONA:
- User Type: ${persona.user_type}
- Knowledge Level: ${persona.knowledge_level}
- Topics: ${persona.interests.join(', ')}
- Total Interactions: ${persona.interaction_count}

RECENT BEHAVIOR (Last ${recentInteractions.length} interactions):
${recentInteractions.map((int, i) => `${i+1}. ${int.type}: ${JSON.stringify(int.data)}`).join('\n')}

QUESTIONS ASKED:
${persona.questions_asked.slice(-5).map((q, i) => `${i+1}. "${q}"`).join('\n')}

TASK: Analyze if this persona should evolve. Return JSON:
{
  "should_evolve": true/false,
  "confidence": 0.0-1.0,
  "signals": ["signal1", "signal2", ...],
  "reasoning": "Why evolution is/isn't needed"
}

EVOLUTION SIGNALS:
- Asking advanced questions beyond current knowledge level
- Exploring topics outside initial interests
- Reading technical analysis articles despite beginner label
- Consistent engagement with specific topic area
- Questions showing deeper understanding than knowledge_level suggests
- Behavior change (e.g., investor → trader patterns)

EXAMPLES:
1. Beginner asking "What is P/E ratio?" → DON'T EVOLVE (expected)
2. Beginner asking "How does DCF valuation compare to comparable analysis?" → EVOLVE (advanced question)
3. First-time investor reading 20+ technical analysis articles → EVOLVE (behavior mismatch)
4. Student exploring only startup funding for 30 interactions → EVOLVE (narrow interest)

Be conservative. Only suggest evolution if there are CLEAR signals.`;

    const resolvedModel = resolveModel(model);
    logger.debug(`shouldEvolvePersona using model: ${resolvedModel}`);
    const completion = await groq.chat.completions.create({
      model: resolvedModel,
      messages: [
        {
          role: 'system',
          content: 'You are an AI that analyzes user behavior patterns to determine when personas should evolve.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    logger.info(`🔍 Persona evolution analysis for ${persona.user_id}:`, analysis);

    return analysis;

  } catch (error) {
    logger.error('Persona evolution analysis error:', error.message);

    // Fallback: Conservative rule-based decision
    return {
      should_evolve: false,
      confidence: 0.0,
      signals: [],
      reasoning: 'AI analysis failed, defaulting to no evolution'
    };
  }
}

/**
 * Generate evolved persona using AI
 */
export async function evolvePersona(persona, interactions, evolutionSignals, model) {
  try {
    const recentInteractions = interactions.slice(-20); // Last 20 interactions

    const prompt = `You are evolving a user persona based on their behavior.

CURRENT PERSONA:
- User Type: ${persona.user_type}
- Knowledge Level: ${persona.knowledge_level}
- Intent: ${persona.intent_category}
- Topics: ${persona.interests.join(', ')}
- Goals: ${persona.goals.join(', ')}
- Interactions: ${persona.interaction_count}

EVOLUTION SIGNALS:
${evolutionSignals.map((s, i) => `${i+1}. ${s}`).join('\n')}

RECENT BEHAVIOR:
${recentInteractions.map((int, i) => `${i+1}. ${int.type}: ${JSON.stringify(int.data)}`).join('\n')}

QUESTIONS ASKED:
${persona.questions_asked.slice(-10).map((q, i) => `${i+1}. "${q}"`).join('\n')}

TOPICS EXPLORED:
${Array.from(persona.topics_explored).join(', ')}

TASK: Generate evolved persona. Return JSON:
{
  "user_type": "updated type if behavior changed, else same",
  "knowledge_level": "beginner" | "intermediate" | "expert",
  "intent_category": "updated if changed",
  "interests": ["topic1", "topic2", ...],
  "goals": ["goal1", "goal2", ...],
  "changes_made": ["change1", "change2", ...],
  "reasoning": "Why these changes",
  "personalization_note": "How to personalize content now"
}

RULES:
1. Knowledge level progression: beginner → intermediate → expert (never regress)
2. Update interests based on what they ACTUALLY explored
3. Refine goals based on questions and interactions
4. If behavior shifted (investor → trader), update user_type
5. Be specific in changes_made (not generic)

EXAMPLES:

Input: Beginner reading 15 technical articles, asking about RSI/MACD
Output: {
  "knowledge_level": "intermediate",
  "interests": ["technical analysis", "trading", "chart patterns"],
  "changes_made": ["Upgraded to intermediate - shows understanding of technical indicators"],
  "personalization_note": "Use more technical jargon, include chart analysis"
}

Input: Student exploring only startup funding for 40 interactions
Output: {
  "interests": ["startup funding", "venture capital", "entrepreneurship"],
  "goals": ["Understand VC ecosystem", "Learn fundraising process"],
  "changes_made": ["Narrowed interests to startup/VC focus"],
  "personalization_note": "Focus on funding rounds, valuations, cap tables"
}`;

    const resolvedModel = resolveModel(model);
    logger.debug(`evolvePersona using model: ${resolvedModel}`);
    const completion = await groq.chat.completions.create({
      model: resolvedModel,
      messages: [
        {
          role: 'system',
          content: 'You are an AI that evolves user personas based on behavior analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const evolved = JSON.parse(completion.choices[0].message.content);

    logger.info(`✨ Persona evolved for ${persona.user_id}:`, evolved.changes_made);

    return evolved;

  } catch (error) {
    logger.error('Persona evolution error:', error.message);

    // Fallback: Return current persona unchanged
    return {
      user_type: persona.user_type,
      knowledge_level: persona.knowledge_level,
      intent_category: persona.intent_category,
      interests: persona.interests,
      goals: persona.goals,
      changes_made: [],
      reasoning: 'Evolution failed, keeping current persona',
      personalization_note: 'Continue with current personalization approach'
    };
  }
}

/**
 * Auto-upgrade knowledge level based on simple rules
 */
export function autoUpgradeKnowledge(persona, interactions) {
  const currentLevel = persona.knowledge_level;

  // Count advanced behaviors
  let advancedSignals = 0;

  // Check questions for complexity
  const recentQuestions = persona.questions_asked.slice(-10);
  const advancedKeywords = [
    'dcf', 'valuation', 'rsi', 'macd', 'bollinger', 'fibonacci',
    'options', 'derivatives', 'hedge', 'arbitrage', 'alpha', 'beta',
    'cap table', 'liquidation preference', 'vesting', 'term sheet'
  ];

  recentQuestions.forEach(q => {
    const qLower = q.toLowerCase();
    if (advancedKeywords.some(kw => qLower.includes(kw))) {
      advancedSignals += 1;
    }
  });

  // Check article categories
  const recentReads = interactions
    .filter(int => int.type === 'article_read')
    .slice(-15);

  const technicalReads = recentReads.filter(int =>
    int.data.category === 'technical' ||
    int.data.category === 'analysis'
  ).length;

  if (technicalReads >= 8) advancedSignals += 2;

  // Upgrade logic
  if (currentLevel === 'beginner' && advancedSignals >= 3) {
    return {
      upgraded: true,
      new_level: 'intermediate',
      reason: `${advancedSignals} advanced signals detected`
    };
  }

  if (currentLevel === 'intermediate' && advancedSignals >= 5) {
    return {
      upgraded: true,
      new_level: 'expert',
      reason: `${advancedSignals} advanced signals detected`
    };
  }

  return {
    upgraded: false,
    new_level: currentLevel,
    reason: 'Not enough signals for upgrade'
  };
}
