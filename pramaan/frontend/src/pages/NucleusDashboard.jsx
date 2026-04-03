import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Helper function for article relevance colors
const getRelevanceBorder = (score) => {
  if (score >= 90) return 'border-l-cyan-500';
  if (score >= 70) return 'border-l-blue-500';
  return 'border-l-slate-600';
};

export default function NucleusDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [persona, setPersona] = useState(location.state?.persona || null);
  const [intent, setIntent] = useState(location.state?.intent || null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [language, setLanguage] = useState('english');
  const [synthesisQuery, setSynthesisQuery] = useState('');
  const [briefing, setBriefing] = useState(null);
  const [userType, setUserType] = useState(intent?.user_type || 'first_time_investor');

  useEffect(() => {
    if (!intent || !persona) {
      navigate('/nucleus');
      return;
    }
    loadPersonalizedFeed();
  }, [intent, userType]);

  // Record interaction with backend
  const recordInteraction = async (type, data) => {
    if (!persona) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/persona/${persona.user_id}/interaction`,
        { type, data }
      );

      if (response.data.upgraded) {
        console.log('📈 Knowledge level upgraded!', response.data.persona.knowledge_level);
        setPersona(response.data.persona);
      }
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  const loadPersonalizedFeed = async () => {
    setLoading(true);
    try {
      // Update intent with new user type
      const currentIntent = { ...intent, user_type: userType };

      const response = await axios.post(`${API_URL}/api/nucleus/personalized-feed`, {
        intent: currentIntent,
        count: 5
      });

      setArticles(response.data.articles);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const synthesizeTopic = async () => {
    if (!synthesisQuery.trim()) return;

    try {
      // Record synthesis request
      await recordInteraction('synthesis_request', {
        topic: synthesisQuery
      });

      const response = await axios.post(`${API_URL}/api/nucleus/synthesize`, {
        topic: synthesisQuery,
        intent
      });

      setBriefing(response.data.briefing);
    } catch (error) {
      console.error('Synthesis failed:', error);
    }
  };

  const handleArticleClick = async (article) => {
    setSelectedArticle(article);

    // Record article read interaction
    await recordInteraction('article_read', {
      article_id: article.id,
      title: article.title,
      category: article.category,
      relevance_score: article.relevance_score
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Personalizing your news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xl">
                ✨
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ET Nucleus</h1>
                <p className="text-sm text-gray-400">
                  {persona ? `${persona.user_name || 'User'} • ${persona.user_type.replace(/_/g, ' ')} • ${persona.knowledge_level}` : 'Your Personalized News'}
                </p>
              </div>
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <span>🌐</span>
              <span>{language === 'english' ? 'English' : 'हिंदी'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Demo Mode Notice */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 text-xl">ℹ️</span>
            <div>
              <p className="text-yellow-200 text-sm font-semibold mb-1">Demo Mode</p>
              <p className="text-yellow-200/80 text-xs">
                Showing 8 sample ET-style articles with AI-powered personalization.
                Production version would fetch live articles from Economic Times API.
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 SYNTHESIS HERO - THE STAR OF THE SHOW */}
        <div className="mb-8 bg-gradient-to-br from-purple-900/30 via-slate-800/50 to-cyan-900/30 backdrop-blur-xl rounded-2xl border-2 border-purple-500/50 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-white mb-2">
              📊 Deep Dive Synthesis
            </h2>
            <p className="text-gray-300 text-lg">
              Ask anything - we'll synthesize insights from multiple sources
            </p>
          </div>

          <div className="max-w-3xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                value={synthesisQuery}
                onChange={(e) => setSynthesisQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && synthesizeTopic()}
                placeholder="e.g., Should I invest in mutual funds or stocks? What's the outlook for tech sector?"
                className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-lg border-2 border-purple-400/50 rounded-xl text-white text-lg placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
              />
              <button
                onClick={synthesizeTopic}
                disabled={!synthesisQuery.trim()}
                className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Synthesize →
              </button>
            </div>

            {/* Example queries */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {['Mutual funds vs stocks', 'Tech sector outlook', 'Safe investments for beginners'].map(q => (
                <button
                  key={q}
                  onClick={() => setSynthesisQuery(q)}
                  className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-full text-xs text-purple-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Results Section */}
          {briefing && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {briefing.briefing_title}
                </h3>

                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {briefing.summary}
                  </p>
                </div>

                <div className="border-t border-slate-600 pt-4">
                  <p className="text-sm text-gray-400 mb-3">
                    📚 Synthesized from {briefing.article_count} articles
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New 2-Column Layout */}
        <div className="grid grid-cols-3 gap-8">
          {/* Left: Compact Articles (2 cols) */}
          <div className="col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              📰 Related Articles
            </h2>

            {articles.slice(0, 6).map((article, index) => (
              <div
                key={index}
                onClick={() => handleArticleClick(article)}
                className={`bg-slate-800/60 backdrop-blur-lg rounded-lg border border-slate-600 ${getRelevanceBorder(article.relevance_score)} border-l-4 hover:border-cyan-500/50 cursor-pointer transition-all p-4`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-300 rounded">
                        {article.relevance_score}/10 match
                      </span>
                      <span className="text-xs text-gray-400">
                        {article.source}
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-white mb-2 line-clamp-2">
                      {article.personalized_headline}
                    </h4>

                    <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                      {article.personalized_lead?.substring(0, 150)}...
                    </p>

                    {/* Compact Why This Matters */}
                    <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border-l-2 border-cyan-500">
                      <p className="text-xs text-cyan-400 font-semibold mb-1">💡 Why This Matters</p>
                      <p className="text-xs text-gray-300 line-clamp-2">{article.why_relevant}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Profile Mini-Card */}
          <div className="space-y-6">
            {/* Your Profile */}
            <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border-l-4 border-cyan-500 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                👤 Your Profile
              </h3>

              {persona && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Name</p>
                    <p className="text-white font-semibold">{persona.user_name || 'User'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Persona Type</p>
                    <p className="text-blue-300 capitalize">{persona.user_type.replace(/_/g, ' ')}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Knowledge Level</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            persona.knowledge_level === 'beginner' ? 'bg-green-500 w-1/3' :
                            persona.knowledge_level === 'intermediate' ? 'bg-yellow-500 w-2/3' :
                            'bg-blue-500 w-full'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-300 capitalize">{persona.knowledge_level}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-600">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-2xl font-bold text-purple-400">{persona.interaction_count || 0}</p>
                        <p className="text-xs text-gray-400">Interactions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-400">{persona.articles_read?.length || 0}</p>
                        <p className="text-xs text-gray-400">Articles Read</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={() => setSelectedArticle(null)}>
          <div className="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedArticle.personalized_headline}</h2>
              <button onClick={() => setSelectedArticle(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-purple-300">💡 {selectedArticle.why_relevant}</p>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">{selectedArticle.personalized_lead}</p>
              <p className="text-gray-300 mt-4">{selectedArticle.content}</p>
            </div>

            {selectedArticle.key_takeaway && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-300"><strong>Key Takeaway:</strong> {selectedArticle.key_takeaway}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
