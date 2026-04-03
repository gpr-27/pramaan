import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import UploadZone from '../components/UploadZone.jsx';
import { uploadMedia } from '../lib/api.js';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (file, setProgress) => {
    setLoading(true);
    setError('');
    try {
      const result = await uploadMedia(file, setProgress);
      if (result.jobId) {
        navigate(`/analyze/${result.jobId}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-white font-semibold tracking-tight">Pramaan</span>
          </div>
          <span className="text-xs text-gray-600 font-mono">v1.0 · Local</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/60 border border-blue-800 rounded-full text-xs text-blue-300 font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Responsible GenAI · Human-in-the-Loop
          </div>

          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Verify before you<br />
            <span className="text-blue-400">publish.</span>
          </h1>

          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Upload citizen media. Four AI agents verify authenticity, locate the scene, find context,
            and generate an evidence-anchored editorial brief — in under 60 seconds.
          </p>
        </motion.div>

        {/* Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-2xl"
        >
          <UploadZone onUpload={handleUpload} loading={loading} />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-950/50 border border-red-800 rounded-lg"
            >
              <p className="text-sm text-red-400 text-center">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Pipeline steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl w-full"
        >
          {[
            { icon: '🔬', label: 'Provenance', desc: 'Authenticity & manipulation detection' },
            { icon: '🗺️', label: 'Spatial', desc: 'Location & scene context' },
            { icon: '📡', label: 'Retrieval', desc: 'Corroborating news sources' },
            { icon: '✍️', label: 'Draft', desc: 'Evidence-constrained brief' },
          ].map((step, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div className="text-2xl mb-2">{step.icon}</div>
              <p className="text-sm font-semibold text-gray-200 mb-1">{step.label}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="border-t border-gray-900 px-6 py-4 text-center">
        <p className="text-xs text-gray-700">
          Pramaan · Built for responsible civic journalism · AI assists, humans decide
        </p>
      </footer>
    </div>
  );
}
