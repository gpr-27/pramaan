import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
const MAX_SIZE_MB = 200;

export default function UploadZone({ onUpload, loading }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = (f) => {
    if (!ACCEPTED.includes(f.type)) {
      return 'Unsupported file type. Upload JPG, PNG, WebP, GIF, MP4, MOV, MKV, or WebM.';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFile = useCallback((f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError('');
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview({ type: 'image', url: e.target.result });
      reader.readAsDataURL(f);
    } else {
      setPreview({ type: 'video', name: f.name, size: (f.size / 1024 / 1024).toFixed(1) });
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);

  const handleSubmit = async () => {
    if (!file) return;
    await onUpload(file, setProgress);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-200
              ${dragActive
                ? 'border-blue-400 bg-blue-950/30 scale-[1.01]'
                : 'border-gray-700 hover:border-gray-500 bg-gray-900/50 hover:bg-gray-900'
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
            />

            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-200 ${dragActive ? 'bg-blue-900/50 scale-110' : 'bg-gray-800'}`}>
                📁
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-200">
                  {dragActive ? 'Drop to verify' : 'Drop media here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['JPG', 'PNG', 'WebP', 'MP4', 'MOV', 'MKV'].map(t => (
                  <span key={t} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded font-mono">{t}</span>
                ))}
              </div>
              <p className="text-xs text-gray-600">Max {MAX_SIZE_MB}MB</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass-card p-6"
          >
            {preview?.type === 'image' ? (
              <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-800 max-h-64">
                <img src={preview.url} alt="Preview" className="w-full h-64 object-contain" />
              </div>
            ) : (
              <div className="flex items-center gap-4 mb-4 p-4 bg-gray-800 rounded-lg">
                <span className="text-4xl">🎬</span>
                <div>
                  <p className="font-medium text-gray-200 truncate max-w-xs">{preview?.name}</p>
                  <p className="text-sm text-gray-500">{preview?.size} MB</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-300 truncate max-w-[60%]">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>

            {loading && (
              <div className="mt-3 mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading…' : '🔍 Start Verification'}
              </button>
              {!loading && (
                <button onClick={reset} className="btn-ghost">
                  Change
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-red-400 text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
