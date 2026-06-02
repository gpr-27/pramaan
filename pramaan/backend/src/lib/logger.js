// Leveled logger gated by LOG_LEVEL from the centralized config.
//
// Never reads process.env directly — the log level comes from `config`.
// Levels (most → least severe): error > warn > info > debug.
import config from '../config/index.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

function emit(level, stream, label, args) {
  if (LEVELS[level] > threshold) return;
  const ts = new Date().toISOString();
  stream(`${ts} ${label}`, ...args);
}

export const logger = {
  error: (...args) => emit('error', console.error, '✗ [error]', args),
  warn: (...args) => emit('warn', console.warn, '⚠ [warn] ', args),
  info: (...args) => emit('info', console.log, 'ℹ [info] ', args),
  debug: (...args) => emit('debug', console.log, '· [debug]', args),
};

export default logger;
