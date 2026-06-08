// ─────────────────────────────────────────────────────────────────────────────
// Centralized backend configuration.
//
// THIS IS THE ONLY FILE IN THE BACKEND THAT READS `process.env`.
// Every other module imports its configuration from here. This guarantees:
//   • a single, validated source of truth for all environment-specific values,
//   • fail-fast startup when required configuration is missing or invalid,
//   • zero hardcoded URLs / ports / model names / API keys / origins in source.
//
// Import order matters: this module loads `.env` as a side effect at import
// time, so it must be imported before any module that depends on configuration
// (the server entrypoint imports it first).
// ─────────────────────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// `.env` lives in the project root (the inner `pramaan/` directory):
//   backend/src/config -> ../../../ -> pramaan/.env
// On hosted platforms (e.g. Render) the variables come from the platform's
// environment instead; a missing .env file is fine — dotenv simply no-ops.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ── Helpers ──────────────────────────────────────────────────────────────────
const errors = [];

/** Read a required string. Records an error (never throws here) when absent. */
function required(key) {
  const raw = process.env[key];
  if (raw === undefined || String(raw).trim() === '') {
    errors.push(`Missing ${key}`);
    return '';
  }
  return String(raw).trim();
}

/** Read an optional string; returns `fallback` when the var is unset/empty. */
function optional(key, fallback = '') {
  const raw = process.env[key];
  return raw === undefined || String(raw).trim() === '' ? fallback : String(raw).trim();
}

/** Parse a comma-separated list into a trimmed, de-duplicated array. */
function list(value) {
  return [...new Set(String(value).split(',').map((s) => s.trim()).filter(Boolean))];
}

/** Parse a required integer. */
function requiredInt(key) {
  const raw = required(key);
  if (raw === '') return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n <= 0) {
    errors.push(`Invalid ${key} (expected a positive integer, got "${raw}")`);
    return 0;
  }
  return n;
}

const VALID_LOG_LEVELS = ['error', 'warn', 'info', 'debug'];
const VALID_NODE_ENVS = ['development', 'production', 'test'];

// ── Runtime ──────────────────────────────────────────────────────────────────
const nodeEnv = required('NODE_ENV');
if (nodeEnv && !VALID_NODE_ENVS.includes(nodeEnv)) {
  errors.push(`Invalid NODE_ENV "${nodeEnv}" (expected one of: ${VALID_NODE_ENVS.join(', ')})`);
}

// Render injects PORT automatically; locally it comes from .env.
const port = requiredInt('PORT');

// Optional in the default single-server deploy (frontend is same-origin).
// Only needed when the frontend is hosted on a separate origin.
const clientUrl = optional('CLIENT_URL', '');

const logLevel = optional('LOG_LEVEL', 'info');
if (!VALID_LOG_LEVELS.includes(logLevel)) {
  errors.push(`Invalid LOG_LEVEL "${logLevel}" (expected one of: ${VALID_LOG_LEVELS.join(', ')})`);
}

// CORS origins: explicit list if provided, else the client URL, else none
// (same-origin deploy — CORS does not apply).
const corsOrigins = process.env.CORS_ORIGINS && process.env.CORS_ORIGINS.trim() !== ''
  ? list(process.env.CORS_ORIGINS)
  : (clientUrl ? [clientUrl] : []);

// ── LLM configuration ────────────────────────────────────────────────────────
const llmProvider = required('LLM_PROVIDER');
// Optional: without a key the app runs in demo/fallback mode (no live LLM calls).
const groqApiKey = optional('GROQ_API_KEY', '');
const defaultModel = required('DEFAULT_MODEL');
const availableModels = list(required('AVAILABLE_MODELS') || '');

if (defaultModel && availableModels.length > 0 && !availableModels.includes(defaultModel)) {
  errors.push(
    `DEFAULT_MODEL "${defaultModel}" is not present in AVAILABLE_MODELS (${availableModels.join(', ')})`
  );
}

// ── External news API (optional) ─────────────────────────────────────────────
// Without a key, news comes from the built-in demo dataset. NEWS_API_URL is only
// required when a key is supplied.
const newsApiKey = optional('NEWS_API_KEY', '');
const newsApiUrl = optional('NEWS_API_URL', '');
if (newsApiKey && newsApiUrl === '') {
  errors.push('Missing NEWS_API_URL (required when NEWS_API_KEY is set)');
}

// ── Persistence & auth (both optional) ───────────────────────────────────────
// MongoDB connection string. When empty (or unreachable at boot) the app falls
// back to an in-memory persona store, so it still runs without a database.
const mongodbUri = optional('MONGODB_URI', '');
// Clerk secret key (backend session verification). When empty, backend auth is a
// no-op and the app uses guest ids only (still fully usable).
const clerkSecretKey = optional('CLERK_SECRET_KEY', '');
// Clerk publishable key — the frontend uses VITE_CLERK_PUBLISHABLE_KEY; the
// backend middleware accepts either name. Optional.
const clerkPublishableKey = optional('CLERK_PUBLISHABLE_KEY', '') || optional('VITE_CLERK_PUBLISHABLE_KEY', '');

// ── Fail fast ────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  // Use raw stderr here: the logger depends on a valid config, which we do not
  // yet have. Keep the output unmistakable so misconfiguration is obvious.
  process.stderr.write('\n');
  process.stderr.write('═══════════════════════════════════════════════════════\n');
  process.stderr.write('  ✗ Invalid environment configuration — startup aborted\n');
  process.stderr.write('═══════════════════════════════════════════════════════\n');
  for (const message of errors) {
    process.stderr.write(`  ❌ ${message}\n`);
  }
  process.stderr.write('───────────────────────────────────────────────────────\n');
  process.stderr.write('  Fix your environment (.env locally, or the host env vars).\n');
  process.stderr.write('  See .env.example for the full list.\n');
  process.stderr.write('═══════════════════════════════════════════════════════\n\n');
  process.exit(1);
}

// ── Public configuration object ──────────────────────────────────────────────
export const config = Object.freeze({
  // Runtime
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',
  port,
  clientUrl,
  corsOrigins,
  logLevel,

  // LLM
  llmProvider,
  groqApiKey,
  defaultModel,
  availableModels,

  // External services
  newsApiKey,
  newsApiUrl,

  // Persistence & auth
  mongodbUri,
  clerkSecretKey,
  clerkPublishableKey,
});

// Convenient named exports.
export const {
  nodeEnv: NODE_ENV,
  port: PORT,
  clientUrl: CLIENT_URL,
  corsOrigins: CORS_ORIGINS,
  logLevel: LOG_LEVEL,
  llmProvider: LLM_PROVIDER,
  groqApiKey: GROQ_API_KEY,
  defaultModel: DEFAULT_MODEL,
  availableModels: AVAILABLE_MODELS,
  newsApiKey: NEWS_API_KEY,
  newsApiUrl: NEWS_API_URL,
  mongodbUri: MONGODB_URI,
  clerkSecretKey: CLERK_SECRET_KEY,
} = config;

/** True when an LLM API key is configured. */
export const isGroqConfigured = Boolean(config.groqApiKey);

/** True when a MongoDB connection string is configured. */
export const isMongoConfigured = Boolean(config.mongodbUri);

/** True when a Clerk secret key is configured (backend session verification). */
export const isClerkConfigured = Boolean(config.clerkSecretKey);

/** Is `model` one of the configured AVAILABLE_MODELS? */
export function isModelAllowed(model) {
  return typeof model === 'string' && config.availableModels.includes(model);
}

/**
 * Resolve a requested model id to a valid configured model.
 * Returns the request when it is in AVAILABLE_MODELS, otherwise DEFAULT_MODEL.
 */
export function resolveModel(requested) {
  return isModelAllowed(requested) ? requested : config.defaultModel;
}

export default config;
