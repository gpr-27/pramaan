import React from 'react';

export default function ProgressIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-3">
      <span className="kicker">Step {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      <div className="flex-1 flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className={`h-[3px] flex-1 rounded-full transition-all duration-500 ${
              index < current ? 'bg-accent' : 'bg-line-strong'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
