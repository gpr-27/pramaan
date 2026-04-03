import { motion } from 'framer-motion';

const CONFIG = {
  HIGH: {
    bg: 'bg-red-950/60',
    border: 'border-red-700',
    text: 'text-red-400',
    dot: 'bg-red-500',
    label: 'HIGH RISK',
    icon: '🔴',
  },
  MEDIUM: {
    bg: 'bg-yellow-950/60',
    border: 'border-yellow-700',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500',
    label: 'MEDIUM RISK',
    icon: '🟡',
  },
  LOW: {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-700',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'LOW RISK',
    icon: '🟢',
  },
};

export default function RiskBadge({ level, score, inline = false }) {
  const cfg = CONFIG[level] || CONFIG.LOW;

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
    >
      <span className="text-xl">{cfg.icon}</span>
      <div>
        <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
        {score !== undefined && (
          <p className="text-xs text-gray-500">Risk score: {score}/10</p>
        )}
      </div>
    </motion.div>
  );
}
