import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PipelineStatus from '../components/PipelineStatus.jsx';

export default function Analyze() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [agentStates, setAgentStates] = useState({});
  const [log, setLog] = useState([]);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());
  const timerRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    const es = new EventSource(`/analyze/${jobId}`);
    esRef.current = es;

    es.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      setAgentStates(prev => ({ ...prev, [data.agent]: data.state }));
      setLog(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        agent: data.agent,
        state: data.state,
        result: data.result,
      }]);
    });

    es.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      clearInterval(timerRef.current);
      es.close();
      setTimeout(() => navigate(`/report/${data.reportId}`), 600);
    });

    es.addEventListener('error', (e) => {
      let msg = 'Pipeline error occurred';
      try { msg = JSON.parse(e.data).message; } catch {}
      setError(msg);
      clearInterval(timerRef.current);
      es.close();
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) return;
      setError('Connection to backend lost. Make sure the server is running.');
      clearInterval(timerRef.current);
      es.close();
    };

    return () => {
      clearInterval(timerRef.current);
      es.close();
    };
  }, [jobId, navigate]);

  const doneCount = Object.values(agentStates).filter(s => s === 'done').length;
  const totalAgents = 6;
  const progressPct = Math.round((doneCount / totalAgents) * 100);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-white font-semibold">Pramaan</span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-500 text-sm">Analyzing media</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono">{elapsed}s</span>
            {!error && (
              <span className="flex items-center gap-1.5 text-xs text-blue-400">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Running
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Pipeline Progress</span>
            <span>{doneCount} / {totalAgents} agents complete</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-red-950/40 border border-red-800 rounded-xl text-center"
          >
            <p className="text-red-400 font-medium mb-1">Pipeline Failed</p>
            <p className="text-sm text-red-300/70">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 btn-ghost text-sm"
            >
              ← Try Again
            </button>
          </motion.div>
        ) : (
          <>
            <PipelineStatus agentStates={agentStates} />

            {/* Activity Log */}
            {log.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 glass-card p-5"
              >
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Activity Log</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {log.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-gray-700">{entry.time}</span>
                      <span className={`${entry.state === 'done' ? 'text-emerald-500' : entry.state === 'running' ? 'text-blue-400' : 'text-gray-500'}`}>
                        {entry.state === 'done' ? '✓' : entry.state === 'running' ? '▶' : '·'}
                      </span>
                      <span className="text-gray-400 capitalize">{entry.agent}</span>
                      <span className={`${entry.state === 'done' ? 'text-emerald-600' : entry.state === 'running' ? 'text-blue-600' : 'text-gray-600'}`}>
                        {entry.state}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {doneCount === totalAgents && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-center"
              >
                <p className="text-emerald-400 font-medium">✓ Analysis complete — redirecting to report…</p>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
