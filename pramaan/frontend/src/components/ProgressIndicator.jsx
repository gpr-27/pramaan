import React from 'react';

export default function ProgressIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all duration-300 ${
            index < current
              ? 'w-8 bg-cyan-500'
              : index === current
              ? 'w-8 bg-cyan-500/50'
              : 'w-2 bg-slate-600'
          }`}
        />
      ))}
    </div>
  );
}
