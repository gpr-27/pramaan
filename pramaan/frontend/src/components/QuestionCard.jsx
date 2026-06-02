import React from 'react';

export default function QuestionCard({ option, selected, onSelect }) {
  const isSelected = selected === option.id;

  return (
    <button
      onClick={() => onSelect(option.id)}
      className={`group w-full text-left rounded-[2px] border px-4 py-3.5 transition-all duration-200 sm:px-5 sm:py-4 ${
        isSelected
          ? 'bg-accent-soft border-accent'
          : 'bg-card border-line hover:border-line-strong hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <span
          className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-[2px] text-2xl transition-colors ${
            isSelected ? 'bg-card' : 'bg-paper-2 group-hover:bg-paper'
          }`}
        >
          {option.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-[1rem] font-semibold leading-tight text-ink sm:text-[1.05rem]">
            {option.label}
          </h3>
          <p className="mt-0.5 text-[0.82rem] leading-snug text-ink-soft">
            {option.desc}
          </p>
        </div>
        <span
          className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border text-sm transition-all ${
            isSelected
              ? 'border-accent bg-accent text-white'
              : 'border-line-strong text-transparent group-hover:border-ink-faint'
          }`}
        >
          ✓
        </span>
      </div>
    </button>
  );
}
