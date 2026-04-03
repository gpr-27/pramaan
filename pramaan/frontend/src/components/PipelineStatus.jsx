import { motion } from 'framer-motion';

const AGENTS = [
  { id: 'ingestor', label: 'Media Ingestor', icon: '🎞️', desc: 'Extracting frames & metadata' },
  { id: 'provenance', label: 'Provenance Agent', icon: '🔬', desc: 'Checking authenticity & manipulation signals' },
  { id: 'spatial', label: 'Spatial Agent', icon: '🗺️', desc: 'Identifying location & environment' },
  { id: 'retrieval', label: 'Retrieval Agent', icon: '📡', desc: 'Searching corroborating news context' },
  { id: 'risk', label: 'Risk Analyzer', icon: '⚠️', desc: 'Scoring publication risk' },
  { id: 'draft', label: 'Draft Generator', icon: '✍️', desc: 'Generating evidence-constrained brief' },
];

function StateIndicator({ state }) {
  if (state === 'done') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-500 flex items-center justify-center"
      >
        <span className="text-emerald-400 text-sm">✓</span>
      </motion.div>
    );
  }
  if (state === 'running') {
    return (
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full border border-gray-700 bg-gray-800" />
  );
}

export default function PipelineStatus({ agentStates }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {AGENTS.map((agent, i) => {
        const state = agentStates[agent.id] || 'waiting';
        const isActive = state === 'running';
        const isDone = state === 'done';

        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className={`glass-card p-5 flex items-start gap-4 transition-all duration-300
              ${isActive ? 'border-blue-500/50 shadow-lg shadow-blue-900/20' : ''}
              ${isDone ? 'border-emerald-800/50' : ''}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              <StateIndicator state={state} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{agent.icon}</span>
                <h3 className={`text-sm font-semibold truncate
                  ${isDone ? 'text-emerald-400' : isActive ? 'text-blue-300' : 'text-gray-400'}
                `}>
                  {agent.label}
                </h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{agent.desc}</p>
              {isActive && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs text-blue-400 mt-1.5"
                >
                  Processing…
                </motion.p>
              )}
              {isDone && (
                <p className="text-xs text-emerald-600 mt-1.5">Complete</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
