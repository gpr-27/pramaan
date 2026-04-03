import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PersonaQuestionnaire from '../components/PersonaQuestionnaire';

const API_URL = 'http://localhost:3001';

export default function NucleusHome() {
  const [userInput, setUserInput] = useState('');
  const [userName, setUserName] = useState('');
  const [personaData, setPersonaData] = useState(null); // From questionnaire
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingPersona, setExistingPersona] = useState(null);
  const navigate = useNavigate();

  const quickOptions = [
    { label: "I have ₹5 lakhs to invest", icon: "💰" },
    { label: "Explain mutual funds to me", icon: "📚" },
    { label: "Track startup funding trends", icon: "🚀" },
    { label: "What's happening in the markets?", icon: "📈" }
  ];

  // Check for existing persona on mount
  useEffect(() => {
    const checkExistingPersona = async () => {
      const userId = localStorage.getItem('et_nucleus_user_id');
      const storedName = localStorage.getItem('et_nucleus_user_name');

      if (storedName) {
        setUserName(storedName);
      }

      if (userId) {
        try {
          const response = await axios.get(`${API_URL}/api/persona/${userId}`);
          if (response.data.success) {
            setExistingPersona(response.data.persona);
            console.log('✅ Welcome back! Persona loaded:', response.data.persona.user_type);
          }
        } catch (err) {
          console.log('No existing persona found or error:', err.message);
          localStorage.removeItem('et_nucleus_user_id');
          localStorage.removeItem('et_nucleus_user_name');
        }
      }
    };

    checkExistingPersona();
  }, []);

  const handleAnalyze = async () => {
    if (!userInput.trim()) {
      setError('Please tell us what brings you to ET today');
      return;
    }

    // Only require name for new users
    if (!existingPersona && !userName.trim()) {
      setError('Please enter your name');
      return;
    }

    // Require questionnaire completion
    if (!personaData && !existingPersona) {
      setError('Please complete the questionnaire to create your profile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get existing user ID or will create new one
      let userId = localStorage.getItem('et_nucleus_user_id');

      // For returning users, use stored name; for new users, use input
      const nameToUse = existingPersona
        ? (localStorage.getItem('et_nucleus_user_name') || 'User')
        : userName.trim();

      // Use questionnaire persona data or existing
      const selectedUserType = personaData?.user_type || existingPersona?.user_type || 'first_time_investor';

      // Create/update persona
      const personaResponse = await axios.post(`${API_URL}/api/persona/create`, {
        userInput: userInput.trim(),
        userId: userId || undefined
      });

      const { persona, intent, is_new } = personaResponse.data;

      // Store user ID and name for future visits
      localStorage.setItem('et_nucleus_user_id', persona.user_id);
      if (is_new) {
        // Store new name for new users
        localStorage.setItem('et_nucleus_user_name', userName.trim());
      }

      console.log(is_new ? '🆕 New persona created' : '👋 Welcome back!', persona.user_type);

      // Navigate to dashboard with persona and intent
      navigate('/nucleus/dashboard', {
        state: {
          persona: {
            ...persona,
            user_name: nameToUse,
            user_type: selectedUserType,
            ...personaData  // Include questionnaire data
          },
          intent: {
            ...intent,
            user_type: selectedUserType,
            context: persona.context
          },
          userInput,
          is_returning_user: !is_new
        }
      });

    } catch (err) {
      console.error('Persona creation failed:', err);
      setError('Failed to create your persona. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-slate-900 to-purple-900/20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Logo & Title */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
              ✨
            </div>
            <h1 className="text-5xl font-extrabold text-white tracking-tight">ET Nucleus</h1>
          </div>
          <p className="text-lg text-gray-300">
            Intelligence-First Business News
          </p>
          <p className="text-sm text-gray-400 mt-2">
            News that adapts to <span className="text-blue-400 font-semibold">you</span>
          </p>
        </div>

        {/* Main Input Card */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          {/* Welcome Back Message */}
          {existingPersona && (
            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👋</span>
                <div>
                  <p className="text-blue-300 font-semibold">Welcome back, {userName}!</p>
                  <p className="text-sm text-blue-200/80">
                    You're a <span className="font-semibold">{existingPersona.user_type.replace(/_/g, ' ')}</span>
                    {' '}({existingPersona.knowledge_level} level) •{' '}
                    {existingPersona.interaction_count} interactions so far
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Name Input - Only for new users */}
          {!existingPersona && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., Priya Sharma"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
                disabled={loading}
              />
            </div>
          )}

          {/* Smart Questionnaire */}
          {!personaData ? (
            <PersonaQuestionnaire onComplete={(data) => setPersonaData(data)} />
          ) : (
            <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <p className="text-sm text-cyan-400 font-semibold mb-1">
                ✓ Profile configured
              </p>
              <p className="text-xs text-gray-300">
                {personaData.knowledge_level} • {personaData.user_type.replace(/_/g, ' ')}
              </p>
              <button
                onClick={() => setPersonaData(null)}
                className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                Change answers
              </button>
            </div>
          )}

          <h2 className="text-2xl font-semibold text-white mb-3">
            What brings you to ET today?
          </h2>
          <p className="text-gray-300 mb-6">
            Tell us in your own words - we'll personalize everything for you
          </p>

          {/* Text Input */}
          <div className="relative mb-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
              placeholder="Example: I have 5 lakhs to invest. Should I go with mutual funds or stocks?"
              className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 resize-none"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              Press Enter to continue
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !userInput.trim()}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing your intent...
              </span>
            ) : (
              'Get Your Personalized News →'
            )}
          </button>

          {/* Quick Options */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-3">Or try one of these:</p>
            <div className="grid grid-cols-2 gap-3">
              {quickOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setUserInput(option.label)}
                  className="p-3 bg-slate-800/30 hover:bg-slate-700/50 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg text-left transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-sm text-gray-300 group-hover:text-white">
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          {[
            { icon: '🎯', label: 'Personalized', desc: 'For your needs' },
            { icon: '📊', label: 'Synthesized', desc: 'Multi-article insights' },
            { icon: '🌏', label: 'Vernacular', desc: 'Hindi with context' }
          ].map((feature, i) => (
            <div key={i} className="text-center p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-600/50 shadow-lg">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <div className="text-white font-semibold text-sm">{feature.label}</div>
              <div className="text-gray-400 text-xs mt-1">{feature.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
