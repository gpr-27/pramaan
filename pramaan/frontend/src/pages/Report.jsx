import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchReport, approveReport } from '../lib/api.js';
import RiskBadge from '../components/RiskBadge.jsx';
import EvidencePanel from '../components/EvidencePanel.jsx';
import DraftEditor from '../components/DraftEditor.jsx';
import CivicExport from '../components/CivicExport.jsx';

export default function Report() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [discarded, setDiscarded] = useState(false);

  useEffect(() => {
    fetchReport(reportId)
      .then(data => {
        setReport(data);
        setDraft(data.draft || '');
        setApproved(data.approved === 1);
      })
      .catch(err => setError(err.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [reportId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveReport(reportId);
      setApproved(true);
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setApproving(false);
    }
  };

  const handleDiscard = () => {
    setDiscarded(true);
    setTimeout(() => navigate('/'), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading report…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-red-400 font-medium mb-2">Failed to load report</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-ghost">← Back Home</button>
        </div>
      </div>
    );
  }

  const { provenance, spatial, retrieval, risk } = report;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-900 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
            >
              ←
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">Editorial Brief</p>
                <p className="text-xs text-gray-600 font-mono truncate">Report #{reportId.slice(0, 8)}</p>
              </div>
            </div>
            {risk?.level && <RiskBadge level={risk.level} score={risk.score} inline />}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {discarded ? (
              <span className="text-xs text-gray-500">Discarded.</span>
            ) : approved ? (
              <span className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-700 text-emerald-400 text-xs font-semibold rounded-lg">
                ✓ Approved
              </span>
            ) : (
              <>
                <button
                  onClick={handleDiscard}
                  className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-900 hover:border-red-800 rounded-lg transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="px-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {approving ? 'Approving…' : '✓ Approve & Publish'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {discarded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-950/30 border border-red-900 rounded-xl text-center text-red-400 text-sm"
          >
            Story discarded. Redirecting to home…
          </motion.div>
        )}

        {approved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-950/30 border border-emerald-800 rounded-xl text-center text-emerald-400 text-sm"
          >
            ✓ Editorial brief approved and logged for publication.
          </motion.div>
        )}

        {/* Risk summary */}
        {risk && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className={`p-5 rounded-xl border ${
              risk.level === 'HIGH' ? 'bg-red-950/30 border-red-800' :
              risk.level === 'MEDIUM' ? 'bg-yellow-950/30 border-yellow-800' :
              'bg-emerald-950/20 border-emerald-900'
            }`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <RiskBadge level={risk.level} score={risk.score} />
                  </div>
                  <p className={`text-sm font-medium ${
                    risk.level === 'HIGH' ? 'text-red-300' :
                    risk.level === 'MEDIUM' ? 'text-yellow-300' : 'text-emerald-300'
                  }`}>
                    {risk.publish_recommendation}
                  </p>
                </div>
              </div>

              {risk.flags?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Risk Flags</p>
                  <div className="space-y-1.5">
                    {risk.flags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={`flex-shrink-0 font-bold ${
                          flag.severity === 'HIGH' ? 'text-red-500' :
                          flag.severity === 'MEDIUM' ? 'text-yellow-500' : 'text-gray-500'
                        }`}>{flag.severity}</span>
                        <span className="text-gray-400">{flag.flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Evidence panel — takes 3/5 */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <EvidencePanel
              provenance={provenance}
              spatial={spatial}
              retrieval={retrieval}
            />
          </motion.div>

          {/* Draft + Civic — takes 2/5 */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 space-y-5"
          >
            <DraftEditor
              draft={draft}
              onDraftChange={setDraft}
            />

            <CivicExport
              civicAction={report?.civic_action}
              draft={draft}
              location={spatial?.estimated_location}
              eventType={retrieval?.event_type}
            />
          </motion.div>
        </div>

        {/* Spatial quick view */}
        {spatial && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 glass-card p-5"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Location Summary</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Estimated Location</p>
                <p className="text-sm text-gray-200 font-medium">{spatial.estimated_location || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Country</p>
                <p className="text-sm text-gray-200 font-medium">{spatial.country || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Time of Day</p>
                <p className="text-sm text-gray-200 font-medium capitalize">{spatial.time_of_day || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Event Type</p>
                <p className="text-sm text-gray-200 font-medium capitalize">{retrieval?.event_type || '—'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-gray-900 px-6 py-4">
        <p className="text-xs text-gray-700 text-center">
          Pramaan · AI assists, humans decide · All editorial decisions remain with the journalist
        </p>
      </footer>
    </div>
  );
}
