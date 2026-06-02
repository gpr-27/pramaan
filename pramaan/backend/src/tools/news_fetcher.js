import axios from 'axios';
import config from '../config/index.js';
import logger from '../lib/logger.js';

/**
 * News Fetcher Tool
 * Fetches business news from NewsAPI or uses cached/sample data
 */

// Sample ET-style business articles for demo/fallback
const SAMPLE_ARTICLES = [
  {
    id: '1',
    title: 'Nifty hits all-time high on IT rally, crosses 22,500 mark',
    description: 'Indian benchmark indices surged to record highs led by strong gains in IT stocks. Nifty crossed the 22,500 level for the first time amid positive global cues and strong FII inflows.',
    content: 'The Nifty 50 index closed at 22,547, up 1.8% from the previous session. IT stocks led the rally with Infosys and TCS gaining over 3% each. Market experts attribute the surge to improving earnings outlook and steady foreign institutional investor (FII) buying. The rally comes amid expectations of a dovish stance from the RBI in upcoming policy meetings.',
    url: 'https://economictimes.indiatimes.com/sample1',
    source: 'ET Markets',
    publishedAt: new Date().toISOString(),
    category: 'markets',
    image: 'https://via.placeholder.com/400x200?text=Stock+Market'
  },
  {
    id: '2',
    title: 'SEBI tightens mutual fund regulations for investor protection',
    description: 'Market regulator SEBI has introduced new guidelines for mutual fund schemes, focusing on transparency and investor protection. The changes will come into effect from April 2026.',
    content: 'The Securities and Exchange Board of India (SEBI) has mandated stricter disclosure norms for mutual funds, including clearer communication of risks and costs. Fund houses will need to provide simplified fact sheets and enhanced digital accessibility. The regulator also capped certain fees and introduced benchmarking requirements. Industry experts believe these changes will benefit retail investors but may impact fund profitability short-term.',
    url: 'https://economictimes.indiatimes.com/sample2',
    source: 'ET Prime',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    category: 'regulation',
    image: 'https://via.placeholder.com/400x200?text=SEBI+Regulations'
  },
  {
    id: '3',
    title: 'Zomato Q4 results beat estimates, stock rallies 8% on profitability focus',
    description: 'Food delivery major Zomato posted better-than-expected Q4 results with improved unit economics. The company narrowed losses and guided for profitability in FY27.',
    content: 'Zomato reported a 28% YoY revenue growth to ₹2,800 crore in Q4, beating analyst estimates. The company s adjusted EBITDA loss narrowed to ₹50 crore from ₹180 crore in the previous quarter. Management highlighted improving order frequency and reduced customer acquisition costs. The stock surged 8% in trading as investors cheered the path to profitability. Analysts maintain a positive outlook citing market leadership and operational efficiencies.',
    url: 'https://economictimes.indiatimes.com/sample3',
    source: 'ET Now',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    category: 'corporate',
    image: 'https://via.placeholder.com/400x200?text=Zomato+Results'
  },
  {
    id: '4',
    title: 'RBI holds repo rate at 6.5%, maintains accommodative stance',
    description: 'The Reserve Bank of India kept the benchmark interest rate unchanged in its latest monetary policy review, citing balanced inflation and growth dynamics.',
    content: 'In the April 2026 policy review, the RBI Monetary Policy Committee (MPC) voted 5-1 to maintain the repo rate at 6.5%. Governor Shaktikanta Das emphasized that inflation remains within the target band while growth momentum is intact. The central bank revised its GDP growth forecast to 7.1% for FY27. Market participants had expected the hold given recent inflation prints. Bond yields fell marginally post-announcement while the rupee strengthened against the dollar.',
    url: 'https://economictimes.indiatimes.com/sample4',
    source: 'ET Markets',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    category: 'policy',
    image: 'https://via.placeholder.com/400x200?text=RBI+Policy'
  },
  {
    id: '5',
    title: 'Indian startups raise $1.2 billion in Q1 2026, funding picks up pace',
    description: 'Startup funding in India showed signs of recovery with $1.2 billion raised across 180 deals in the first quarter, marking a 35% increase from the previous quarter.',
    content: 'The Indian startup ecosystem witnessed improved investor sentiment in Q1 2026, with SaaS and fintech sectors leading fundraising activity. Notable deals included a $150 million Series D round for AI startup Sarvam AI and a $120 million round for logistics unicorn Delhivery. Venture capital firms cited improving unit economics and a return to fundamentals as key reasons for renewed interest. However, late-stage funding remains challenging, with companies focusing on profitability over growth.',
    url: 'https://economictimes.indiatimes.com/sample5',
    source: 'ET Startup',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    category: 'startups',
    image: 'https://via.placeholder.com/400x200?text=Startup+Funding'
  },
  {
    id: '6',
    title: 'Rupee weakens to 83.50 against dollar on crude oil surge',
    description: 'The Indian rupee declined to a two-month low of 83.50 per dollar as crude oil prices surged past $90/barrel amid geopolitical tensions.',
    content: 'Currency markets saw the rupee depreciate 0.6% to 83.50/$, pressured by rising crude oil imports and dollar demand from importers. Brent crude crossed $90/barrel on supply concerns, directly impacting India\'s trade deficit. The RBI is believed to have intervened to prevent sharper declines. Forex strategists expect continued volatility with a near-term range of 83.30-83.80. The depreciation may add to inflationary pressures through higher import costs.',
    url: 'https://economictimes.indiatimes.com/sample6',
    source: 'ET Markets',
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    category: 'forex',
    image: 'https://via.placeholder.com/400x200?text=Rupee+Dollar'
  },
  {
    id: '7',
    title: 'Electric vehicle sales cross 1 million mark in India, Tesla launch awaited',
    description: 'India\'s EV adoption accelerated in FY26 with total sales exceeding 1 million units. Market leaders expect Tesla\'s entry to further boost the segment.',
    content: 'The electric vehicle market in India reached a milestone with cumulative sales of 1.02 million units in FY26, a 48% YoY increase. Tata Motors dominated with 45% market share, followed by Ola Electric and Ather Energy. The government\'s FAME subsidies and improving charging infrastructure aided adoption. Industry insiders anticipate Tesla\'s launch later this year will intensify competition. Analysts project EV penetration to reach 15% of total vehicle sales by FY28.',
    url: 'https://economictimes.indiatimes.com/sample7',
    source: 'ET Auto',
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    category: 'automotive',
    image: 'https://via.placeholder.com/400x200?text=Electric+Vehicles'
  },
  {
    id: '8',
    title: 'HDFC Bank Q4 profit rises 20% to ₹16,512 crore, asset quality improves',
    description: 'India\'s largest private sector lender HDFC Bank reported strong Q4 results with profit growth of 20% YoY and improving asset quality metrics.',
    content: 'HDFC Bank posted a standalone net profit of ₹16,512 crore for Q4 FY26, up 20% from ₹13,760 crore a year ago. Net interest income grew 12% while asset quality improved with gross NPA ratio declining to 1.24% from 1.33%. The bank added 1.2 million new customers and expanded its branch network by 150 locations. Management guided for 14-15% loan growth in FY27. Analysts maintain a buy rating citing strong fundamentals and digital banking initiatives.',
    url: 'https://economictimes.indiatimes.com/sample8',
    source: 'ET Banking',
    publishedAt: new Date(Date.now() - 25200000).toISOString(),
    category: 'banking',
    image: 'https://via.placeholder.com/400x200?text=HDFC+Bank'
  }
];

/**
 * Fetch business news articles
 */
export async function fetchNews(options = {}) {
  const {
    query = 'business india',
    category = 'business',
    count = 8,
    language = 'en'
  } = options;

  try {
    // Try NewsAPI if key is configured
    if (config.newsApiKey && config.newsApiKey !== '') {
      const response = await axios.get(config.newsApiUrl, {
        params: {
          q: query,
          language,
          pageSize: count,
          sortBy: 'publishedAt',
          apiKey: config.newsApiKey
        },
        timeout: 5000
      });

      if (response.data.articles && response.data.articles.length > 0) {
        return response.data.articles.map((article, index) => ({
          id: `news_${index}`,
          title: article.title,
          description: article.description || '',
          content: article.content || article.description || '',
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          image: article.urlToImage,
          category: 'business'
        }));
      }
    }
  } catch (error) {
    logger.warn('NewsAPI fetch failed, using sample data:', error.message);
  }

  // Fallback to sample articles
  logger.info('Using sample articles for demo');
  return SAMPLE_ARTICLES.slice(0, count);
}

/**
 * Search articles by query
 */
export async function searchArticles(query, count = 5) {
  const articles = await fetchNews({ query, count: 20 });

  // Improved relevance scoring with better keyword matching
  const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);

  const scoredArticles = articles.map(article => {
    let score = 0;
    const searchText = (article.title + ' ' + article.description + ' ' + (article.content || '')).toLowerCase();

    // Score each query word
    queryWords.forEach(word => {
      // Title matches are worth more
      if (article.title.toLowerCase().includes(word)) {
        score += 5;
      }
      // Description matches
      if (article.description.toLowerCase().includes(word)) {
        score += 3;
      }
      // Content matches
      if (searchText.includes(word)) {
        score += 1;
      }
    });

    // Boost for exact phrase match
    if (searchText.includes(query.toLowerCase())) {
      score += 10;
    }

    // Keyword-based boosting
    const keywords = {
      'invest': ['investment', 'investor', 'mutual fund', 'stocks', 'portfolio', 'market', 'nifty', 'sebi', 'returns', 'profit'],
      'time': ['market', 'timing', 'opportunity', 'outlook', 'forecast', 'quarter', 'q4'],
      'good': ['profit', 'rally', 'beat', 'rise', 'growth', 'positive', 'gain', 'high'],
      'startup': ['funding', 'vc', 'entrepreneur', 'unicorn', 'series', 'raise'],
      'market': ['nifty', 'sensex', 'stock', 'rally', 'trading', 'index'],
      'mutual fund': ['mf', 'sebi', 'amc', 'sip', 'investment', 'fund'],
      'policy': ['rbi', 'rate', 'repo', 'monetary', 'bank'],
      'tech': ['zomato', 'startup', 'ipo', 'tech stock', 'digital'],
      'stock': ['equity', 'share', 'rally', 'nifty', 'market', 'trading']
    };

    Object.entries(keywords).forEach(([key, relatedWords]) => {
      if (query.toLowerCase().includes(key)) {
        relatedWords.forEach(related => {
          if (searchText.includes(related)) {
            score += 2;
          }
        });
      }
    });

    return {
      ...article,
      relevance_score: score
    };
  });

  // Sort by relevance and return top matches
  const sorted = scoredArticles.sort((a, b) => b.relevance_score - a.relevance_score);

  // If no good matches found (all scores are 0), return top articles anyway
  const topMatches = sorted.filter(a => a.relevance_score > 0).slice(0, count);

  if (topMatches.length === 0) {
    logger.info(`No relevant matches for "${query}", returning general articles`);
    // Return general articles based on category
    return sorted.slice(0, count);
  }

  return topMatches;
}

/**
 * Get cached articles for demo
 */
export function getCachedArticles() {
  return [...SAMPLE_ARTICLES];
}
