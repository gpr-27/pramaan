import { groq, resolveModel } from '../lib/groqClient.js';
import logger from '../lib/logger.js';
import { getDemoPersonalizedArticle } from '../data/demo_personalized.js';

// Demo mode flag (set to true when API rate limited or for consistent demos)
const USE_DEMO_MODE = true;

/**
 * Personalization Agent
 * Adapts news articles to user intent and context
 */
export async function personalizeArticle(article, intent, model) {
  try {
    // Check if we have pre-generated demo data for this article
    if (USE_DEMO_MODE) {
      const demoData = getDemoPersonalizedArticle(article.id, intent.user_type);
      if (demoData) {
        logger.info(`Using demo personalization for article ${article.id}, user ${intent.user_type}`);
        return {
          ...article,
          ...demoData,
          relevance_score: calculateRelevanceScore(article, intent),
          explanation_level: intent.context.knowledge_level,
          original_headline: article.title
        };
      }
    }
    const prompt = `You are an AI that personalizes business news for different users.

ORIGINAL ARTICLE:
Title: ${article.title}
Description: ${article.description}
Content: ${article.content?.substring(0, 500) || article.description}

USER PROFILE:
- Type: ${intent.user_type}
- Intent: ${intent.intent_category}
- Context: ${JSON.stringify(intent.context)}
- Topics of interest: ${intent.topics.join(', ')}
- Knowledge level: ${intent.context.knowledge_level}
- Action needed: ${intent.action_needed}

TASK: Rewrite this article for THIS specific user. Return JSON:
{
  "personalized_headline": "New headline that speaks to their intent (max 80 chars)",
  "why_relevant": "One sentence explaining why this matters to THEM (max 100 chars)",
  "personalized_lead": "Rewritten opening paragraph (max 150 words)",
  "key_takeaway": "What they should do/know (max 50 words)",
  "relevance_score": 1-10,
  "explanation_level": "basic" | "intermediate" | "expert"
}

EXAMPLES:

First-time investor seeing "Nifty hits record high":
- Headline: "Market at record high: Is this a good time to invest your ₹5L?"
- Why relevant: "You asked about investing - timing matters for your entry point"
- Lead: "Indian stocks are at all-time highs. For someone starting with ₹5 lakh, this raises an important question: should you invest now or wait? Here's what experts say about entering at market peaks..."
- Key takeaway: "High markets aren't necessarily bad - focus on your time horizon, not market timing"

Day trader seeing same article:
- Headline: "Nifty breaks 22,500 - Technical targets & momentum signals"
- Why relevant: "Key technical level crossed - trading opportunity"
- Lead: "Nifty closed above 22,500 resistance with strong volumes. RSI at 68 (not overbought), MACD showing bullish crossover. Next resistance: 22,750. Support: 22,350..."
- Key takeaway: "Bullish momentum intact, watch 22,750 for breakout trades"

Student seeing same article:
- Headline: "What does 'Nifty hits record high' actually mean? Explained"
- Why relevant: "Understanding market indices is fundamental to business news"
- Lead: "The Nifty is India's main stock market index - think of it as a scorecard for the top 50 companies. When it hits a 'record high', it means these companies are worth more than ever before. Here's why this matters..."
- Key takeaway: "Market indices track overall business health - a simple way to understand the economy"

Be highly specific to their context. Use their budget numbers, their specific questions, their language.`;

    const resolvedModel = resolveModel(model);
    logger.debug(`personalizeArticle using model: ${resolvedModel}`);
    const completion = await groq.chat.completions.create({
      model: resolvedModel,
      messages: [
        {
          role: 'system',
          content: 'You are a business news personalization expert. Adapt content to user needs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const personalized = JSON.parse(completion.choices[0].message.content);

    return {
      ...article,
      personalized_headline: personalized.personalized_headline,
      why_relevant: personalized.why_relevant,
      personalized_lead: personalized.personalized_lead,
      key_takeaway: personalized.key_takeaway,
      relevance_score: personalized.relevance_score || 5,
      explanation_level: personalized.explanation_level || 'intermediate',
      original_headline: article.title
    };

  } catch (error) {
    logger.error('Personalization error:', error.message);

    // Fallback: Return original with basic relevance
    return {
      ...article,
      personalized_headline: article.title,
      why_relevant: 'Relevant to your interests',
      personalized_lead: article.description,
      key_takeaway: 'Stay informed about this development',
      relevance_score: 5,
      explanation_level: 'intermediate',
      original_headline: article.title
    };
  }
}

/**
 * Batch personalize multiple articles
 */
export async function personalizeArticles(articles, intent, maxArticles = 5, model) {
  logger.info(`Personalizing ${articles.length} articles for ${intent.user_type}...`);

  // Personalize articles in parallel
  const personalizedPromises = articles.slice(0, maxArticles).map(article =>
    personalizeArticle(article, intent, model)
  );

  const personalized = await Promise.all(personalizedPromises);

  // Sort by relevance score
  return personalized.sort((a, b) => b.relevance_score - a.relevance_score);
}

/**
 * Get comparison view for multiple user types
 */
export async function getComparisonView(article, model) {
  const userTypes = [
    {
      user_type: 'first_time_investor',
      intent_category: 'Investment Decision',
      context: { knowledge_level: 'beginner', budget: '5 lakhs' },
      topics: ['investing', 'mutual funds'],
      action_needed: 'recommendation'
    },
    {
      user_type: 'day_trader',
      intent_category: 'Market Analysis',
      context: { knowledge_level: 'expert' },
      topics: ['technical analysis', 'trading'],
      action_needed: 'analysis'
    },
    {
      user_type: 'student',
      intent_category: 'Concept Learning',
      context: { knowledge_level: 'beginner' },
      topics: ['business basics'],
      action_needed: 'explanation'
    }
  ];

  const comparisons = await Promise.all(
    userTypes.map(async (intent) => {
      const personalized = await personalizeArticle(article, intent, model);
      return {
        user_type: intent.user_type,
        headline: personalized.personalized_headline,
        why_relevant: personalized.why_relevant,
        lead: personalized.personalized_lead
      };
    })
  );

  return {
    original: {
      headline: article.title,
      description: article.description
    },
    personalized: comparisons
  };
}

/**
 * Calculate relevance score based on article content and user intent
 */
function calculateRelevanceScore(article, intent) {
  let score = 5; // Base score

  // Check if article topics match user interests
  const articleLower = (article.title + ' ' + article.description).toLowerCase();
  const userTopics = intent.topics || [];

  userTopics.forEach(topic => {
    if (articleLower.includes(topic.toLowerCase())) {
      score += 2;
    }
  });

  // Boost score based on user type relevance
  const relevanceMap = {
    first_time_investor: ['invest', 'mutual fund', 'portfolio', 'beginner', 'strategy'],
    day_trader: ['technical', 'trade', 'momentum', 'levels', 'breakout', 'target'],
    student: ['explained', 'understand', 'what is', 'how does', 'basics'],
    startup_founder: ['startup', 'funding', 'vc', 'raise', 'series'],
    entrepreneur: ['business', 'opportunity', 'market', 'growth']
  };

  const keywords = relevanceMap[intent.user_type] || [];
  keywords.forEach(keyword => {
    if (articleLower.includes(keyword)) {
      score += 1;
    }
  });

  return Math.min(10, Math.max(1, score)); // Clamp between 1-10
}
