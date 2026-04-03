import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'provenance', label: 'Provenance', icon: '🔬' },
  { id: 'spatial', label: 'Spatial', icon: '🗺️' },
  { id: 'retrieval', label: 'Retrieval', icon: '📡' },
];

function ConfidencePill({ level }) {
  const colors = {
    high: 'bg-emerald-900/40 text-emerald-400 border-emerald-700',
    medium: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
    low: 'bg-red-900/40 text-red-400 border-red-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[level] || colors.low}`}>
      {level?.toUpperCase()} confidence
    </span>
  );
}

function KeyValue({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-200">{String(value)}</span>
    </div>
  );
}

function TagList({ items, color = 'gray' }) {
  if (!items || items.length === 0) return <span className="text-xs text-gray-600">None detected</span>;
  const colors = {
    gray: 'bg-gray-800 text-gray-300',
    red: 'bg-red-950/50 text-red-300',
    blue: 'bg-blue-950/50 text-blue-300',
    emerald: 'bg-emerald-950/50 text-emerald-300',
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`px-2 py-0.5 text-xs rounded ${colors[color]}`}>{item}</span>
      ))}
    </div>
  );
}

function ProvenanceView({ data }) {
  const syntheticPct = Math.round((data.synthetic_probability || 0) * 100);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <ConfidencePill level={data.confidence} />
        <span className={`text-sm font-semibold ${data.reuse_detected ? 'text-red-400' : 'text-emerald-400'}`}>
          {data.reuse_detected ? '⚠ Reuse Detected' : '✓ No Reuse Detected'}
        </span>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Synthetic Probability</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${syntheticPct > 60 ? 'bg-red-500' : syntheticPct > 30 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
              style={{ width: `${syntheticPct}%` }}
            />
          </div>
          <span className={`text-sm font-bold min-w-[3rem] ${syntheticPct > 60 ? 'text-red-400' : syntheticPct > 30 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {syntheticPct}%
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Manipulation Signals</p>
        <TagList items={data.manipulation_signs} color={data.manipulation_signs?.length > 0 ? 'red' : 'gray'} />
      </div>

      {data.ai_generated_indicators?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">AI Generation Indicators</p>
          <TagList items={data.ai_generated_indicators} color="red" />
        </div>
      )}

      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Metadata</p>
        <div className="grid grid-cols-2 gap-3">
          <KeyValue label="Device" value={data.metadata?.device} />
          <KeyValue label="Software" value={data.metadata?.software} />
          <KeyValue label="Timestamp" value={data.metadata?.timestamp} />
          <KeyValue label="GPS" value={data.metadata?.gps ? `${data.metadata.gps.lat?.toFixed(4)}, ${data.metadata.gps.lng?.toFixed(4)}` : 'Not found'} />
        </div>
        {data.metadata?.anomalies?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1.5">Anomalies</p>
            <TagList items={data.metadata.anomalies} color="red" />
          </div>
        )}
      </div>
    </div>
  );
}

function SpatialView({ data }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <ConfidencePill level={data.confidence} />
        <span className="text-sm text-blue-300 font-medium">{data.region_type}</span>
      </div>

      <div className="p-4 bg-gray-800/60 rounded-lg">
        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Estimated Location</p>
        <p className="text-base font-semibold text-gray-100">{data.estimated_location || 'Unknown'}</p>
        <p className="text-sm text-gray-400">{data.country}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-gray-800/40 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">Time</p>
          <p className="text-sm text-gray-300 capitalize">{data.time_of_day || '—'}</p>
        </div>
        <div className="p-3 bg-gray-800/40 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">Weather</p>
          <p className="text-sm text-gray-300 capitalize">{data.weather || '—'}</p>
        </div>
        <div className="p-3 bg-gray-800/40 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">Environment</p>
          <p className="text-xs text-gray-300 leading-tight">{data.environment || '—'}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Visual Signals</p>
        <TagList items={data.signals} color="blue" />
      </div>

      {data.ocr?.hasText && (
        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">OCR Text Detected</p>
          <div className="bg-gray-800/60 rounded-lg p-3 font-mono text-xs text-gray-300 max-h-24 overflow-y-auto">
            {data.ocr.text}
          </div>
        </div>
      )}
    </div>
  );
}

function RetrievalView({ data }) {
  const scorePct = Math.round((data.context_score || 0) * 100);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <ConfidencePill level={data.confidence} />
        <span className="text-sm text-purple-300 font-medium capitalize">{data.event_type} event</span>
      </div>

      <div className="p-4 bg-gray-800/60 rounded-lg">
        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Event Description</p>
        <p className="text-sm text-gray-200 leading-relaxed">{data.event_description}</p>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Search Keywords</p>
        <TagList items={data.keywords} color="blue" />
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Context Match Score</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scorePct > 60 ? 'bg-emerald-500' : scorePct > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${scorePct}%` }}
            />
          </div>
          <span className="text-sm font-bold text-gray-300 min-w-[3rem]">{scorePct}%</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Context Analysis</p>
        <p className="text-sm text-gray-300 leading-relaxed">{data.context_analysis}</p>
      </div>

      {data.relevant_articles?.length > 0 && (
        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Related Articles ({data.relevant_articles.length})</p>
          <div className="space-y-2">
            {data.relevant_articles.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <p className="text-sm text-gray-200 font-medium line-clamp-2">{article.title}</p>
                <p className="text-xs text-gray-500 mt-1">{article.source} · {new Date(article.publishedAt).toLocaleDateString()}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvidencePanel({ provenance, spatial, retrieval }) {
  const [activeTab, setActiveTab] = useState('provenance');

  const views = {
    provenance: provenance ? <ProvenanceView data={provenance} /> : null,
    spatial: spatial ? <SpatialView data={spatial} /> : null,
    retrieval: retrieval ? <RetrievalView data={retrieval} /> : null,
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex border-b border-gray-800">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200
              ${activeTab === tab.id
                ? 'text-white border-b-2 border-blue-500 bg-gray-800/50'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'
              }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {views[activeTab] || (
              <p className="text-gray-600 text-sm text-center py-8">No data available</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
