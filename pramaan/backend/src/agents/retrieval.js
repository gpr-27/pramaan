import { analyzeImage, chatGroq, chatGroqJSON } from '../lib/groq.js';
import { searchNews } from '../tools/newsSearch.js';

export async function retrievalAgent(primaryFrame) {
  try {
    // Step 1: Extract keywords from image
    const keywordResult = await analyzeImage(primaryFrame, `Extract search keywords for the civic event or incident shown in this image.
Think like a journalist searching for related news.
Return JSON with exactly these fields:
{
  "keywords": ["3 to 5 specific search terms"],
  "event_type": "flood" | "fire" | "protest" | "accident" | "construction" | "pollution" | "crime" | "infrastructure" | "disaster" | "civic" | "other",
  "event_description": "one sentence describing the visible event"
}`);

    const keywords = keywordResult?.keywords || ['civic incident'];
    const eventType = keywordResult?.event_type || 'civic';
    const eventDescription = keywordResult?.event_description || 'Unknown civic event';

    // Step 2: Search news
    const newsResult = await searchNews(keywords, eventType);

    // Step 3: Score relevance of articles if any found
    let contextAnalysis = 'No related news articles found for context comparison.';
    let contextScore = 0;
    let relevantArticles = [];

    if (newsResult.articles.length > 0) {
      const articlesText = newsResult.articles
        .map((a, i) => `[${i + 1}] "${a.title}" — ${a.description || ''} (${a.publishedAt})`)
        .join('\n');

      const relevanceAnalysis = await chatGroqJSON(
        'You are a journalism context analyzer. Score relevance of news articles to an event.',
        `Event description: "${eventDescription}"\nEvent type: ${eventType}\n\nNews articles:\n${articlesText}\n\nReturn JSON:\n{"context_score": 0.0 to 1.0, "relevant_articles": [indices of relevant articles starting from 1], "analysis": "2-3 sentence context analysis"}`
      );

      contextScore = relevanceAnalysis.context_score || 0;
      contextAnalysis = relevanceAnalysis.analysis || 'Context analysis unavailable.';
      relevantArticles = (relevanceAnalysis.relevant_articles || [])
        .map(i => newsResult.articles[i - 1])
        .filter(Boolean);
    }

    return {
      keywords,
      event_type: eventType,
      event_description: eventDescription,
      related_news: newsResult.articles,
      relevant_articles: relevantArticles,
      context_analysis: contextAnalysis,
      context_score: contextScore,
      news_source: newsResult.source,
      confidence: contextScore > 0.6 ? 'high' : contextScore > 0.3 ? 'medium' : 'low',
    };
  } catch (err) {
    console.error('[retrievalAgent] Error:', err.message);
    return {
      keywords: [],
      event_type: 'unknown',
      event_description: 'Retrieval analysis failed',
      related_news: [],
      relevant_articles: [],
      context_analysis: 'Retrieval agent failed: ' + err.message,
      context_score: 0,
      news_source: 'error',
      confidence: 'low',
    };
  }
}
