import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../config';
import config from '../config';
import ModelSelector from '../components/ModelSelector';
import ClerkAuthButtons from '../components/ClerkAuthButtons';

const KNOWLEDGE_PCT = { beginner: 25, intermediate: 55, advanced: 80, expert: 100 };

// relevance_score is on a 1–10 scale from the backend
function relevanceStyle(score) {
  if (score >= 9) return { bar: 'bg-accent', text: 'text-accent-ink', tag: 'Top match' };
  if (score >= 7) return { bar: 'bg-teal', text: 'text-teal', tag: 'Strong' };
  return { bar: 'bg-line-strong', text: 'text-ink-soft', tag: 'Related' };
}

export default function NucleusDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [persona, setPersona] = useState(location.state?.persona || null);
  const [intent] = useState(location.state?.intent || null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [synthesisQuery, setSynthesisQuery] = useState('');
  const [briefing, setBriefing] = useState(null);
  const [synthLoading, setSynthLoading] = useState(false);
  const [model, setModel] = useState(() => localStorage.getItem('et_nucleus_model') || config.defaultModel);
  const userType = intent?.user_type || 'first_time_investor';

  useEffect(() => {
    if (!intent || !persona) {
      navigate('/nucleus');
      return;
    }
    loadPersonalizedFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordInteraction = async (type, data) => {
    if (!persona) return;
    try {
      const response = await axios.post(`${API_URL}/api/persona/${persona.user_id}/interaction`, { type, data });
      if (response.data.upgraded) {
        console.log('📈 Knowledge level upgraded!', response.data.persona.knowledge_level);
        setPersona({ ...response.data.persona, user_name: persona.user_name });
      } else if (response.data.persona) {
        setPersona({ ...response.data.persona, user_name: persona.user_name });
      }
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  const loadPersonalizedFeed = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/nucleus/personalized-feed`, {
        intent: { ...intent, user_type: userType },
        count: 6,
        model,
      });
      setArticles(response.data.articles || []);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSynthesis = async (queryText) => {
    const topic = (queryText ?? synthesisQuery).trim();
    if (!topic) return;
    setSynthesisQuery(topic);
    setSynthLoading(true);
    try {
      await recordInteraction('synthesis_request', { topic });
      const response = await axios.post(`${API_URL}/api/nucleus/synthesize`, { topic, intent, model });
      setBriefing(response.data.briefing);
    } catch (error) {
      console.error('Synthesis failed:', error);
    } finally {
      setSynthLoading(false);
    }
  };

  const handleArticleClick = async (article) => {
    setSelectedArticle(article);
    await recordInteraction('article_read', {
      article_id: article.id,
      title: article.title,
      category: article.category,
      relevance_score: article.relevance_score,
    });
  };

  if (loading && articles.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <div className="mx-auto mb-5 h-px w-40 overflow-hidden bg-line">
            <div className="shimmer h-full w-full" />
          </div>
          <p className="kicker mb-2">Setting your edition</p>
          <p className="font-display text-2xl text-ink">Personalizing your news…</p>
        </div>
      </div>
    );
  }

  const knowledge = (persona?.knowledge_level || 'beginner').toLowerCase();
  const knowledgePct = KNOWLEDGE_PCT[knowledge] ?? 40;

  return (
    <div className="relative z-10 min-h-screen">
      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-[2px] bg-accent font-display text-lg font-bold text-white">N</span>
            <div className="min-w-0 leading-none">
              <p className="font-display text-base font-semibold tracking-tight text-ink sm:text-lg">ET Nucleus</p>
              {persona && (
                <p className="mt-0.5 truncate font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-soft sm:text-[0.62rem]">
                  {persona.user_name || 'Reader'} · {persona.user_type.replace(/_/g, ' ')} · {knowledge}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button onClick={() => navigate('/nucleus')} aria-label="New search" title="New search" className="btn-ink">
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">New search</span>
            </button>
            <ClerkAuthButtons />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-9">
          {/* ── Main column ──────────────────────────────────── */}
          <div className="min-w-0">
            {/* Synthesis console */}
            <section className="editorial-card p-5 sm:p-7">
              <p className="kicker mb-2">The star feature · Deep-dive synthesis</p>
              <h2 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                Ask once. Read one answer.
              </h2>
              <p className="mt-2 max-w-xl text-ink-soft">
                We pull the relevant reporting and distill it into a single briefing,
                tuned to your level — instead of ten articles to reconcile yourself.
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  name="synthesisQuery"
                  value={synthesisQuery}
                  onChange={(e) => setSynthesisQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSynthesis()}
                  placeholder="e.g. Should I invest in mutual funds or stocks?"
                  className="field flex-1"
                />
                <button onClick={() => runSynthesis()} disabled={!synthesisQuery.trim() || synthLoading} className="btn-accent w-full sm:w-auto">
                  {synthLoading ? 'Synthesizing…' : 'Synthesize →'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {['Mutual funds vs stocks', 'Tech sector outlook', 'Safe investments for beginners'].map((q) => (
                  <button
                    key={q}
                    onClick={() => runSynthesis(q)}
                    className="rounded-full border border-line-strong bg-paper px-3 py-1.5 text-[0.7rem] text-ink-soft transition-colors hover:border-accent hover:text-accent-ink sm:py-1 sm:text-xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </section>

            {/* Briefing result */}
            <AnimatePresence mode="wait">
              {briefing && (
                <motion.section
                  key={briefing.briefing_title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="editorial-card mt-6 p-5 sm:p-7"
                >
                  <p className="kicker mb-3">Your briefing · {briefing.article_count || (briefing.source_articles?.length ?? 0)} sources synthesized</p>
                  <h3 className="font-display text-[1.7rem] font-semibold leading-[1.08] text-ink sm:text-[2rem]">
                    {briefing.briefing_title}
                  </h3>

                  {briefing.note && (
                    <p className="mt-3 rounded-[2px] border border-gold/40 bg-gold-soft px-3 py-2 text-sm text-ink-soft">
                      {briefing.note}
                    </p>
                  )}

                  <p className="dropcap mt-4 text-[1.05rem] leading-relaxed text-ink">
                    {briefing.summary}
                  </p>

                  {Array.isArray(briefing.sections) && briefing.sections.length > 0 && (
                    <div className="mt-6 space-y-5">
                      {briefing.sections.map((sec, i) => (
                        <div key={i} className="border-l-2 border-line pl-4">
                          <h4 className="kicker mb-1 text-ink-soft">{sec.heading}</h4>
                          <p className="leading-relaxed text-ink">{sec.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {Array.isArray(briefing.key_facts) && briefing.key_facts.length > 0 && (
                    <div className="mt-6 border-t border-line pt-5">
                      <p className="kicker mb-3 text-teal">By the numbers</p>
                      <ul className="space-y-2">
                        {briefing.key_facts.map((fact, i) => (
                          <li key={i} className="flex gap-3 text-[0.95rem] text-ink">
                            <span className="tabular mt-0.5 text-teal">{String(i + 1).padStart(2, '0')}</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(briefing.suggested_questions) && briefing.suggested_questions.length > 0 && (
                    <div className="mt-6 border-t border-line pt-5">
                      <p className="kicker mb-3 text-ink-faint">Keep digging</p>
                      <div className="flex flex-wrap gap-2">
                        {briefing.suggested_questions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => runSynthesis(q)}
                            className="rounded-full border border-line-strong bg-paper px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:bg-accent-soft"
                          >
                            {q} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* Article ledger */}
            <section className="mt-9">
              <div className="mb-4 flex items-baseline justify-between border-b border-ink pb-2">
                <h2 className="font-display text-2xl font-semibold text-ink">Tuned for you</h2>
                <span className="kicker text-ink-faint">{articles.length} stories</span>
              </div>

              <div className="space-y-px bg-line">
                {articles.slice(0, 6).map((article, index) => {
                  const r = relevanceStyle(article.relevance_score);
                  return (
                    <article
                      key={article.id || index}
                      onClick={() => handleArticleClick(article)}
                      className="group cursor-pointer bg-paper px-4 py-4 transition-colors hover:bg-card sm:px-5 sm:py-5"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className={`tabular text-sm font-semibold ${r.text}`}>
                          {article.relevance_score}/10
                        </span>
                        <span className={`font-mono text-[0.6rem] uppercase tracking-[0.18em] ${r.text}`}>{r.tag}</span>
                        <span className="h-1 w-1 rounded-full bg-line-strong" />
                        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-faint">{article.source}</span>
                      </div>

                      <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">
                        {article.personalized_headline}
                      </h3>

                      <p className="mt-1.5 line-clamp-2 leading-relaxed text-ink-soft">
                        {article.personalized_lead}
                      </p>

                      {article.why_relevant && (
                        <p className="mt-2 flex gap-2 text-sm text-ink">
                          <span className="kicker shrink-0 pt-0.5 text-accent-ink">Why you</span>
                          <span className="text-ink-soft">{article.why_relevant}</span>
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Sidebar ──────────────────────────────────────── */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {persona && (
              <div className="editorial-card p-6">
                <p className="kicker mb-4 text-ink-soft">Your reader profile</p>

                <p className="font-display text-2xl font-semibold text-ink">{persona.user_name || 'Reader'}</p>
                <p className="mt-0.5 capitalize text-accent-ink">{persona.user_type.replace(/_/g, ' ')}</p>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="kicker text-ink-faint">Knowledge</span>
                    <span className="font-mono text-xs capitalize text-ink-soft">{knowledge}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-paper-2">
                    <div className="h-1.5 rounded-full bg-teal transition-all duration-700" style={{ width: `${knowledgePct}%` }} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-line bg-line">
                  <div className="bg-card px-4 py-3">
                    <p className="tabular text-2xl font-semibold text-ink">{persona.interaction_count || 0}</p>
                    <p className="kicker text-ink-faint">Interactions</p>
                  </div>
                  <div className="bg-card px-4 py-3">
                    <p className="tabular text-2xl font-semibold text-ink">{persona.articles_read?.length || 0}</p>
                    <p className="kicker text-ink-faint">Read</p>
                  </div>
                </div>
              </div>
            )}

            <div className="editorial-card p-6">
              <p className="kicker mb-3 text-ink-soft">Model</p>
              <ModelSelector
                value={model}
                onChange={(v) => {
                  setModel(v);
                  localStorage.setItem('et_nucleus_model', v);
                }}
                label=""
              />
            </div>

            <div className="editorial-card p-6">
              <p className="kicker mb-2 text-ink-soft">How this works</p>
              <p className="text-sm leading-relaxed text-ink-soft">
                Headlines, briefings and explanations are rewritten by AI for your
                experience level and goals. Read more and your profile levels up —
                the edition adapts with you.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Article reader ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:p-8"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="editorial-card my-4 w-full max-w-2xl p-5 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-faint">{selectedArticle.source}</span>
                  <span className="h-1 w-1 rounded-full bg-line-strong" />
                  <span className="tabular text-sm text-accent-ink">{selectedArticle.relevance_score}/10</span>
                </div>
                <button onClick={() => setSelectedArticle(null)} className="text-2xl leading-none text-ink-faint hover:text-ink">×</button>
              </div>

              <h2 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                {selectedArticle.personalized_headline}
              </h2>

              {selectedArticle.why_relevant && (
                <p className="mt-4 flex gap-2 rounded-[2px] border border-accent/30 bg-accent-soft px-4 py-3">
                  <span className="kicker shrink-0 pt-0.5">Why you</span>
                  <span className="text-ink">{selectedArticle.why_relevant}</span>
                </p>
              )}

              <div className="dropcap mt-5 space-y-4 leading-relaxed text-ink">
                <p>{selectedArticle.personalized_lead}</p>
                <p className="text-ink-soft">{selectedArticle.content}</p>
              </div>

              {selectedArticle.key_takeaway && (
                <div className="mt-6 border-t border-line pt-5">
                  <p className="kicker mb-2 text-teal">Key takeaway</p>
                  <p className="text-ink">{selectedArticle.key_takeaway}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
