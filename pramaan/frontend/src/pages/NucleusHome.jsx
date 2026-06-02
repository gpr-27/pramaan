import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import PersonaQuestionnaire from '../components/PersonaQuestionnaire';
import ClerkAuthButtons from '../components/ClerkAuthButtons';
import { API_URL } from '../config';
import { useIdentity } from '../lib/identity.jsx';

const quickOptions = [
  { label: 'I have ₹5 lakhs to invest', tag: 'Investing' },
  { label: 'Explain mutual funds to me', tag: 'Learning' },
  { label: 'Track startup funding trends', tag: 'Startups' },
  { label: "What's happening in the markets?", tag: 'Markets' },
];

const features = [
  { no: '01', label: 'Personalized', desc: 'Every headline rewritten for your level and goals.' },
  { no: '02', label: 'Synthesized', desc: 'One coherent briefing distilled from many sources.' },
  { no: '03', label: 'Vernacular', desc: 'Hindi that keeps the context, not just the words.' },
];

export default function NucleusHome() {
  const identity = useIdentity();
  const [userInput, setUserInput] = useState('');
  const [userName, setUserName] = useState('');
  const [personaData, setPersonaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingPersona, setExistingPersona] = useState(null);
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Load the persona for the CURRENT identity (continuous guest id or signed-in
  // account). When signed in, first migrate any guest history into the account
  // (idempotent) so the reader's edition continues seamlessly.
  useEffect(() => {
    if (!identity?.ready) return;
    let cancelled = false;

    if (identity.isSignedIn && identity.displayName) {
      setUserName(identity.displayName);
    } else {
      const storedName = localStorage.getItem('et_nucleus_user_name');
      if (storedName) setUserName(storedName);
    }

    const load = async () => {
      if (identity.isSignedIn && identity.guestId) {
        try {
          await axios.post(`${API_URL}/api/persona/migrate`, {
            fromUserId: identity.guestId,
            toUserId: identity.userId,
          });
        } catch (err) {
          console.warn('Guest→account migration skipped:', err.message);
        }
      }
      try {
        const response = await axios.get(`${API_URL}/api/persona/${identity.userId}`);
        if (!cancelled && response.data.success) {
          setExistingPersona(response.data.persona);
        } else if (!cancelled) {
          setExistingPersona(null);
        }
      } catch (err) {
        if (!cancelled) setExistingPersona(null);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [identity?.ready, identity?.userId, identity?.isSignedIn, identity?.guestId, identity?.displayName]);

  const handleAnalyze = async () => {
    if (!userInput.trim()) {
      setError('Please tell us what brings you to ET today');
      return;
    }
    if (!existingPersona && !identity?.isSignedIn && !userName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!personaData && !existingPersona) {
      setError('Please complete the questionnaire to create your profile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nameToUse = identity.isSignedIn
        ? (identity.displayName || 'Reader')
        : (userName.trim() || localStorage.getItem('et_nucleus_user_name') || 'Reader');
      const selectedUserType = personaData?.user_type || existingPersona?.user_type || 'first_time_investor';

      const personaResponse = await axios.post(`${API_URL}/api/persona/create`, {
        userInput: userInput.trim(),
        userId: identity.userId,
      });

      const { persona, intent, is_new } = personaResponse.data;

      if (!identity.isSignedIn) {
        localStorage.setItem('et_nucleus_user_name', nameToUse);
      }

      console.log(is_new ? '🆕 New persona created' : '👋 Welcome back!', persona.user_type);

      navigate('/nucleus/dashboard', {
        state: {
          persona: { ...persona, user_name: nameToUse, user_type: selectedUserType, ...personaData },
          intent: { ...intent, user_type: selectedUserType, context: persona.context },
          userInput,
          is_returning_user: !is_new,
        },
      });
    } catch (err) {
      console.error('Persona creation failed:', err);
      setError('Failed to create your persona. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen">
      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[2px] bg-accent font-display text-lg font-bold text-white">N</span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">ET Nucleus</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="kicker text-ink-soft">{today}</p>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-faint">Personal Edition</p>
            </div>
            <ClerkAuthButtons />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* ── Hero ───────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="border-b border-line py-10 sm:py-20"
        >
          <p className="kicker mb-5">Intelligence-First Business News</p>
          <h1 className="max-w-3xl font-display text-[clamp(2.1rem,8vw,3.9rem)] font-semibold leading-[1.05] tracking-tight text-ink">
            The market,{' '}
            <span className="italic text-accent">rewritten</span>{' '}
            for the way <span className="italic">you</span> read.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Tell ET Nucleus who you are and what you're chasing. We tune every
            headline, briefing and explanation to your level — no jargon walls,
            no noise.
          </p>
        </motion.section>

        {/* ── Onboarding ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-6 py-10 sm:py-12 lg:grid-cols-[1.15fr_1fr]"
        >
          {/* Profile calibration */}
          <div className="editorial-card p-5 sm:p-7">
            {identity?.authEnabled && (
              identity.isSignedIn ? (
                <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[2px] border border-teal/30 bg-teal-soft px-3 py-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                  <span className="font-semibold text-teal">Signed in as {identity.displayName}</span>
                  <span className="text-ink-soft">· your edition syncs to your account</span>
                </div>
              ) : (
                <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[2px] border border-line-strong bg-paper px-3 py-2 text-sm text-ink-soft">
                  <span className="font-semibold text-ink">Browsing as a guest</span>
                  <span>— continue freely, or sign in (top-right) to save across devices.</span>
                </div>
              )
            )}

            {existingPersona && (
              <div className="mb-6 flex items-start gap-3 rounded-[2px] border border-teal/30 bg-teal-soft px-4 py-3">
                <span className="text-xl">👋</span>
                <div>
                  <p className="font-semibold text-teal">Welcome back, {userName}.</p>
                  <p className="text-sm text-ink-soft">
                    You're a <span className="font-semibold">{existingPersona.user_type.replace(/_/g, ' ')}</span>{' '}
                    ({existingPersona.knowledge_level}) · {existingPersona.interaction_count} interactions so far
                  </p>
                </div>
              </div>
            )}

            {!existingPersona && !identity?.isSignedIn && (
              <label className="mb-6 block">
                <span className="kicker text-ink-soft">Your name</span>
                <input
                  type="text"
                  name="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g., Priya Sharma"
                  className="field mt-2"
                  disabled={loading}
                />
              </label>
            )}

            <div className="mb-4 flex items-baseline gap-2">
              <span className="font-mono text-sm font-semibold text-accent">01</span>
              <span className="kicker text-ink-soft">Calibrate your reader profile</span>
            </div>

            {!personaData ? (
              <PersonaQuestionnaire onComplete={(data) => setPersonaData(data)} />
            ) : (
              <div className="flex items-center justify-between rounded-[2px] border border-teal/40 bg-teal-soft px-4 py-3">
                <div>
                  <p className="font-semibold text-teal">✓ Profile configured</p>
                  <p className="text-sm text-ink-soft">
                    {personaData.knowledge_level} · {personaData.user_type.replace(/_/g, ' ')}
                  </p>
                </div>
                <button
                  onClick={() => setPersonaData(null)}
                  className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft underline-offset-4 hover:text-accent hover:underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Intent console */}
          <div className="editorial-card flex flex-col p-5 sm:p-7">
            <div className="mb-4 flex items-baseline gap-2">
              <span className="font-mono text-sm font-semibold text-accent">02</span>
              <span className="kicker text-ink-soft">What brings you to ET today?</span>
            </div>

            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
              placeholder="In your own words — e.g. I have ₹5 lakhs to invest. Should I go with mutual funds or stocks?"
              className="field h-32 resize-none"
            />

            <div className="mt-4">
              <p className="kicker mb-2 text-ink-faint">Or start from one of these</p>
              <div className="flex flex-wrap gap-2">
                {quickOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setUserInput(option.label)}
                    className="group rounded-full border border-line-strong bg-paper px-3 py-2 text-left text-sm text-ink transition-colors hover:border-accent hover:bg-accent-soft sm:py-1.5"
                  >
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-faint group-hover:text-accent-ink">{option.tag}</span>
                    <span className="ml-2">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-[2px] border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
                {error}
              </div>
            )}

            <button onClick={handleAnalyze} disabled={loading || !userInput.trim()} className="btn-accent mt-5 w-full">
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Reading your intent…
                </>
              ) : (
                'Get my personalized edition →'
              )}
            </button>
          </div>
        </motion.section>

        {/* ── Feature ledger ─────────────────────────────────── */}
        <section className="grid gap-px border-t border-line bg-line pb-20 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.no} className="bg-paper px-6 py-8">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm font-semibold text-accent">{f.no}</span>
                <h3 className="font-display text-lg font-semibold text-ink">{f.label}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
