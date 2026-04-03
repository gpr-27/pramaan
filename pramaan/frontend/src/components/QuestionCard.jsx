import React from 'react';

export default function QuestionCard({ option, selected, onSelect }) {
  const isSelected = selected === option.id;

  return (
    <button
      onClick={() => onSelect(option.id)}
      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 transform ${
        isSelected
          ? 'bg-slate-800/70 border-cyan-500 ring-2 ring-cyan-500/50 scale-[1.02]'
          : 'bg-slate-800/50 border-slate-600 hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-lg'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{option.icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {option.label}
          </h3>
          <p className="text-sm text-gray-400">
            {option.desc}
          </p>
        </div>
        {isSelected && (
          <div className="text-cyan-500 text-xl flex-shrink-0">✓</div>
        )}
      </div>
    </button>
  );
}
