import { useState } from 'react';
import { motion } from 'framer-motion';

export default function DraftEditor({ draft, onDraftChange }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft || '');
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    onDraftChange?.(text);
    setEditing(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Highlight evidence tags
  const renderTaggedText = (rawText) => {
    const parts = rawText.split(/(\[Provenance\]|\[Spatial\]|\[Retrieval\])/g);
    const tagColors = {
      '[Provenance]': 'bg-blue-900/40 text-blue-300 border border-blue-800',
      '[Spatial]': 'bg-emerald-900/40 text-emerald-300 border border-emerald-800',
      '[Retrieval]': 'bg-purple-900/40 text-purple-300 border border-purple-800',
    };
    return parts.map((part, i) =>
      tagColors[part]
        ? <span key={i} className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${tagColors[part]}`}>{part}</span>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-base">✍️</span>
          <h3 className="text-sm font-semibold text-gray-200">Evidence-Constrained Draft</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-950/60 border border-blue-800 rounded-lg transition-colors"
            >
              ✏️ Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-800 rounded-lg transition-colors"
            >
              💾 Save
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        {editing ? (
          <motion.textarea
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-48 bg-gray-800/60 border border-gray-700 rounded-lg p-4 text-sm text-gray-200 font-sans leading-relaxed resize-none focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="Draft will appear here..."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-300 leading-relaxed min-h-[6rem]"
          >
            {text ? renderTaggedText(text) : (
              <p className="text-gray-600 italic">No draft generated.</p>
            )}
          </motion.div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-blue-500" /> [Provenance] — authenticity signal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-emerald-500" /> [Spatial] — location signal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-purple-500" /> [Retrieval] — news context
          </span>
        </div>
      </div>
    </div>
  );
}
