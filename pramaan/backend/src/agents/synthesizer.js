import { groq, resolveModel } from '../lib/groqClient.js';
import logger from '../lib/logger.js';
import { searchArticles } from '../tools/news_fetcher.js';

/**
 * Synthesis Agent
 * Combines multiple articles into one structured briefing
 */
export async function synthesizeTopic(topic, intent, maxArticles = 5, model) {
  try {
    logger.info(`Synthesizing topic: ${topic} for ${intent.user_type}`);

    // Step 1: Search for relevant articles
    const articles = await searchArticles(topic, maxArticles);

    if (articles.length === 0) {
      throw new Error('No articles found for this topic');
    }

    // Step 2: Extract key points from each article
    const articleSummaries = articles.map(article => ({
      title: article.title,
      key_points: article.description,
      source: article.source,
      url: article.url
    }));

    // Step 3: Synthesize into unified briefing
    const prompt = `You are synthesizing multiple business news articles into ONE comprehensive briefing.

TOPIC: ${topic}

USER PROFILE:
- Type: ${intent.user_type}
- Knowledge level: ${intent.context.knowledge_level}
- Intent: ${intent.intent_category}
- Needs: ${intent.action_needed}

ARTICLES TO SYNTHESIZE (${articles.length} sources):
${articleSummaries.map((a, i) => `
${i + 1}. ${a.title}
   ${a.key_points}
   Source: ${a.source}
`).join('\n')}

TASK: Create a unified, structured briefing in JSON:
{
  "briefing_title": "Clear, specific title for this briefing",
  "summary": "2-3 sentence overview (max 100 words)",
  "sections": [
    {
      "heading": "What's Happening",
      "content": "Current situation (100-150 words)",
      "sources": [1, 2]
    },
    {
      "heading": "Why It Matters",
      "content": "Impact and implications FOR THIS USER (100-150 words)",
      "sources": [2, 3]
    },
    {
      "heading": "Key Players",
      "content": "Who's involved and their roles (50-100 words)",
      "sources": [1, 3]
    },
    {
      "heading": "What To Watch",
      "content": "Future developments and predictions (50-100 words)",
      "sources": [2, 4]
    }
  ],
  "key_facts": [
    "Bullet point 1 with number/data",
    "Bullet point 2 with number/data",
    "Bullet point 3"
  ],
  "suggested_questions": [
    "What does this mean for my investments?",
    "How will this affect the market?",
    "What should I do next?"
  ]
}

Guidelines:
- Synthesize, don't just summarize each article
- Resolve conflicts between sources (mention if articles disagree)
- Cite sources using array indices
- Adapt language to user's knowledge level
- Focus on what matters to THEIR intent`;

    const resolvedModel = resolveModel(model);
    logger.debug(`synthesizeTopic using model: ${resolvedModel}`);
    const completion = await groq.chat.completions.create({
      model: resolvedModel,
      messages: [
        {
          role: 'system',
          content: 'You are a business news synthesis expert. Combine multiple sources into coherent briefings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const briefing = JSON.parse(completion.choices[0].message.content);

    // Add source articles
    briefing.source_articles = articles;
    briefing.article_count = articles.length;
    briefing.generated_at = new Date().toISOString();

    return briefing;

  } catch (error) {
    logger.error('Synthesis error:', error.message);

    // Fallback: at least return the articles we found
    const articles = await searchArticles(topic, maxArticles);

    // Fallback briefing with actual articles
    return {
      briefing_title: `Understanding: ${topic}`,
      summary: `Here's what we know about ${topic} based on recent coverage from ${articles.length} articles.`,
      sections: [
        {
          heading: 'Overview',
          content: articles.length > 0
            ? `Based on recent news coverage, here are the key developments: ${articles.map(a => a.title).join('; ')}.`
            : 'Information is being gathered from multiple sources.',
          sources: articles.map((_, i) => i + 1)
        }
      ],
      key_facts: articles.slice(0, 3).map(a => a.title),
      suggested_questions: ['What does this mean?', 'Why is this important?', 'What should I do?'],
      source_articles: articles,
      article_count: articles.length,
      error: error.message.includes('rate_limit') ? 'rate_limit_exceeded' : 'synthesis_failed',
      note: error.message.includes('rate_limit')
        ? 'AI synthesis temporarily unavailable due to rate limits. Articles shown below for reference.'
        : 'AI synthesis temporarily unavailable. Articles shown below for reference.'
    };
  }
}

/**
 * Answer a question about a briefing
 */
export async function answerQuestion(question, briefing, intent, model) {
  try {
    const prompt = `You are answering a user's question about a news briefing.

USER QUESTION: "${question}"

BRIEFING CONTEXT:
${JSON.stringify(briefing.sections, null, 2)}

KEY FACTS:
${briefing.key_facts.join('\n')}

USER PROFILE:
- Type: ${intent.user_type}
- Knowledge level: ${intent.context.knowledge_level}

TASK: Answer the question in JSON:
{
  "answer": "Clear, specific answer (max 150 words)",
  "confidence": "high" | "medium" | "low",
  "sources": [1, 2],
  "follow_up": "Optional suggested follow-up question"
}

Guidelines:
- Answer ONLY based on the briefing content (don't hallucinate)
- If the briefing doesn't contain the answer, say so
- Cite which sections/sources support your answer
- Use language appropriate for the user's knowledge level
- Be concise but complete`;

    const resolvedModel = resolveModel(model);
    logger.debug(`answerQuestion using model: ${resolvedModel}`);
    const completion = await groq.chat.completions.create({
      model: resolvedModel,
      messages: [
        {
          role: 'system',
          content: 'You are a Q&A assistant that answers questions based on provided context.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0].message.content);

    return {
      question,
      ...response,
      answered_at: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Q&A error:', error.message);

    return {
      question,
      answer: 'I apologize, but I\'m having trouble processing that question right now. Please try rephrasing it.',
      confidence: 'low',
      sources: [],
      error: 'qa_failed'
    };
  }
}
