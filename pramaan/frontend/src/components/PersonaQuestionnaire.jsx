import React, { useState } from 'react';
import QuestionCard from './QuestionCard';
import ProgressIndicator from './ProgressIndicator';

// Persona mapping logic
const personaMap = {
  'investing': {
    'just_starting': { type: 'first_time_investor', level: 'beginner' },
    'some_experience': { type: 'first_time_investor', level: 'intermediate' },
    'experienced': { type: 'experienced_investor', level: 'advanced' },
    'active_trader': { type: 'day_trader', level: 'expert' }
  },
  'business': {
    'industry_trends': { type: 'business_professional', level: 'intermediate' },
    'company_news': { type: 'business_professional', level: 'intermediate' },
    'entrepreneur': { type: 'entrepreneur', level: 'advanced' },
    'career': { type: 'business_professional', level: 'beginner' }
  },
  'startups': {
    'funding': { type: 'startup_enthusiast', level: 'intermediate' },
    'tech_trends': { type: 'tech_professional', level: 'advanced' },
    'unicorns': { type: 'startup_enthusiast', level: 'intermediate' },
    'ecosystem': { type: 'entrepreneur', level: 'advanced' }
  },
  'economy': {
    'macro': { type: 'policy_researcher', level: 'advanced' },
    'policy': { type: 'policy_researcher', level: 'advanced' },
    'rbi_banking': { type: 'financial_professional', level: 'advanced' },
    'markets_impact': { type: 'informed_investor', level: 'intermediate' }
  },
  'learning': {
    'basics': { type: 'student', level: 'beginner' },
    'investing_intro': { type: 'student', level: 'beginner' },
    'economy_intro': { type: 'student', level: 'beginner' },
    'everything': { type: 'student', level: 'beginner' }
  }
};

const preferenceMap = {
  'get_to_point': 'summary',
  'deep_dives': 'detailed',
  'show_data': 'data_driven',
  'simple_language': 'simplified'
};

// Questions
const questions = {
  q1: {
    prompt: "What brings you to Economic Times today?",
    options: [
      { id: 'investing', icon: '💰', label: 'Markets & Investing', desc: 'Learn about stocks, mutual funds, and investments' },
      { id: 'business', icon: '💼', label: 'Business News', desc: 'Company updates, industry trends, corporate news' },
      { id: 'startups', icon: '🚀', label: 'Startups & Tech', desc: 'Startup funding, tech innovations, unicorns' },
      { id: 'economy', icon: '📊', label: 'Economy & Policy', desc: 'GDP, budget, RBI, government policies' },
      { id: 'learning', icon: '📚', label: 'General Learning', desc: 'Understanding business and finance basics' }
    ]
  },
  q2_investing: {
    prompt: "How familiar are you with investing?",
    options: [
      { id: 'just_starting', icon: '🌱', label: 'Just Starting Out', desc: 'New to investing, learning basics' },
      { id: 'some_experience', icon: '📊', label: 'Some Experience', desc: 'Understand basics, actively learning' },
      { id: 'experienced', icon: '💼', label: 'Experienced', desc: 'Regular investor, comfortable with markets' },
      { id: 'active_trader', icon: '📈', label: 'Active Trader', desc: 'Frequent trading, technical analysis' }
    ]
  },
  q2_business: {
    prompt: "What's your focus?",
    options: [
      { id: 'industry_trends', icon: '📈', label: 'Industry Trends', desc: 'Track sector performance and opportunities' },
      { id: 'company_news', icon: '🏢', label: 'Company News', desc: 'Follow specific companies and corporates' },
      { id: 'entrepreneur', icon: '💡', label: 'Entrepreneur', desc: 'Running or planning to start a business' },
      { id: 'career', icon: '👔', label: 'Career & Jobs', desc: 'Job market, salaries, company culture' }
    ]
  },
  q2_startups: {
    prompt: "What interests you most?",
    options: [
      { id: 'funding', icon: '💰', label: 'Funding News', desc: 'Who raised how much, valuations, investors' },
      { id: 'tech_trends', icon: '🔧', label: 'Tech Innovations', desc: 'New products, AI, blockchain, Web3' },
      { id: 'unicorns', icon: '🦄', label: 'Unicorn Journey', desc: 'Success stories, IPOs, exits' },
      { id: 'ecosystem', icon: '🌐', label: 'Startup Ecosystem', desc: 'Incubators, policies, challenges' }
    ]
  },
  q2_economy: {
    prompt: "What do you track?",
    options: [
      { id: 'macro', icon: '🌍', label: 'Macro Economics', desc: 'GDP, inflation, trade, global economy' },
      { id: 'policy', icon: '📋', label: 'Policy & Budget', desc: 'Government policies, budget, regulations' },
      { id: 'rbi_banking', icon: '🏦', label: 'RBI & Banking', desc: 'Interest rates, banking sector, RBI moves' },
      { id: 'markets_impact', icon: '📊', label: 'Market Impact', desc: 'How economy affects markets and stocks' }
    ]
  },
  q2_learning: {
    prompt: "What do you want to learn about?",
    options: [
      { id: 'basics', icon: '📖', label: 'Business Basics', desc: 'How businesses work, financial terms' },
      { id: 'investing_intro', icon: '💰', label: 'Investing 101', desc: 'Introduction to stocks, mutual funds' },
      { id: 'economy_intro', icon: '🌍', label: 'Economy Basics', desc: 'How economy works, GDP, inflation' },
      { id: 'everything', icon: '🎓', label: 'Everything', desc: 'Broad understanding of business world' }
    ]
  },
  q3: {
    prompt: "How do you like your news?",
    options: [
      { id: 'get_to_point', icon: '🎯', label: 'Get to the Point', desc: 'Quick summaries, key takeaways' },
      { id: 'deep_dives', icon: '📖', label: 'Deep Dives', desc: 'Detailed analysis, full context' },
      { id: 'show_data', icon: '🔢', label: 'Show Me the Data', desc: 'Charts, numbers, statistics' },
      { id: 'simple_language', icon: '💬', label: 'Simple Language', desc: 'Explain like I\'m new to this' }
    ]
  }
};

export default function PersonaQuestionnaire({ onComplete }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});

  const handleAnswer = (questionKey, answerId) => {
    const newAnswers = { ...answers, [questionKey]: answerId };
    setAnswers(newAnswers);

    // Auto-advance to next question
    if (step < 3) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      // Compute final persona
      setTimeout(() => {
        const persona = computePersona(newAnswers);
        onComplete(persona);
      }, 300);
    }
  };

  const computePersona = (answers) => {
    const basePersona = personaMap[answers.q1]?.[answers.q2];
    const preference = preferenceMap[answers.q3] || 'balanced';

    return {
      user_type: basePersona?.type || 'first_time_investor',
      knowledge_level: basePersona?.level || 'beginner',
      content_preference: preference,
      interest_area: answers.q1,  // Primary interest (investing/business/startups/economy/learning)
      focus: answers.q2,           // Specific focus within that interest
      experience: answers.q1
    };
  };

  const getCurrentQuestion = () => {
    if (step === 1) return { key: 'q1', ...questions.q1 };
    if (step === 2) {
      // Adaptive Q2 based on Q1
      const interest = answers.q1;
      if (interest === 'investing') return { key: 'q2', ...questions.q2_investing };
      if (interest === 'business') return { key: 'q2', ...questions.q2_business };
      if (interest === 'startups') return { key: 'q2', ...questions.q2_startups };
      if (interest === 'economy') return { key: 'q2', ...questions.q2_economy };
      if (interest === 'learning') return { key: 'q2', ...questions.q2_learning };
      return { key: 'q2', ...questions.q2_investing }; // fallback
    }
    if (step === 3) return { key: 'q3', ...questions.q3 };
  };

  const currentQ = getCurrentQuestion();

  return (
    <div className="mb-6">
      <ProgressIndicator current={step} total={3} />

      <div className="mb-6">
        <p className="text-sm text-gray-400 text-center mb-2">
          Question {step} of 3
        </p>
        <h3 className="text-xl font-semibold text-white text-center mb-6">
          {currentQ.prompt}
        </h3>
      </div>

      <div className="space-y-3">
        {currentQ.options.map((option) => (
          <QuestionCard
            key={option.id}
            option={option}
            selected={answers[currentQ.key]}
            onSelect={(id) => handleAnswer(currentQ.key, id)}
          />
        ))}
      </div>

      {step > 1 && (
        <div className="mt-4">
          <button
            onClick={() => setStep(step - 1)}
            className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
