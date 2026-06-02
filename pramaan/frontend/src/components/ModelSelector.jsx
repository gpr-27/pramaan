import React from 'react';
import config from '../config';

// Dynamic model selector. Options are populated entirely from configuration
// (VITE_AVAILABLE_MODELS) with labels derived/overridden in the config layer.
// Adding, removing, or renaming models in the environment updates this selector
// automatically — no code changes required.
export default function ModelSelector({ value, onChange, className = '', label = 'Model' }) {
  const selected = value || config.defaultModel;

  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="kicker mb-1.5 block text-ink-soft">{label}</span>
      )}
      <select
        name="model"
        value={selected}
        onChange={(e) => onChange?.(e.target.value)}
        className="field w-full"
      >
        {config.availableModels.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </label>
  );
}
