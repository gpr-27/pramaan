import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

export async function searchNews(keywords, eventType = '') {
  const apiKey = process.env.NEWS_API_KEY;
  const query = [...keywords, eventType].filter(Boolean).slice(0, 4).join(' ');

  if (!apiKey) {
    return { articles: [], query, source: 'unavailable', note: 'NewsAPI key not configured' };
  }

  try {
    const url = `https://newsapi.org/v2/everything`;
    const response = await axios.get(url, {
      params: {
        q: query,
        sortBy: 'publishedAt',
        pageSize: 5,
        language: 'en',
        apiKey,
      },
      timeout: 10000,
    });

    const articles = (response.data.articles || []).map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      publishedAt: a.publishedAt,
      source: a.source?.name,
    }));

    return { articles, query, source: 'newsapi', note: null };
  } catch (err) {
    console.error('[newsSearch] NewsAPI error:', err.message);
    return { articles: [], query, source: 'error', note: err.message };
  }
}
