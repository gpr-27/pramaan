// ─────────────────────────────────────────────────────────────────────────────
// Centralized frontend configuration.
//
// THIS IS THE ONLY MODULE IN THE FRONTEND THAT READS `import.meta.env`.
// Every component/page must import configuration from here. No hardcoded API
// URLs, ports, provider names, or model strings live anywhere else.
//
// All values come from Vite env vars (must be prefixed with VITE_ to be exposed
// to client code). Missing required values throw immediately with a clear error.
// ─────────────────────────────────────────────────────────────────────────────
const env = import.meta.env;

const errors = [];

function required(key) {
  const raw = env[key];
  if (raw === undefined || String(raw).trim() === '') {
    errors.push(`Missing ${key}`);
    return '';
  }
  return String(raw).trim();
}

function optional(key, fallback = '') {
  const raw = env[key];
  return raw === undefined || String(raw).trim() === '' ? fallback : String(raw).trim();
}

function parseList(value) {
  return [...new Set(String(value).split(',').map((s) => s.trim()).filter(Boolean))];
}

// ── Human-friendly model labels ──────────────────────────────────────────────
// Derives a display label from a model id so the selector reflects whatever is
// configured without any hardcoded option list. Optional VITE_MODEL_LABELS
// ("id=Label;id=Label") overrides the derived label for any id.
function parseLabelOverrides(value) {
  const map = {};
  if (!value) return map;
  for (const pair of String(value).split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const id = pair.slice(0, idx).trim();
    const label = pair.slice(idx + 1).trim();
    if (id && label) map[id] = label;
  }
  return map;
}

const SIZE_TOKEN = /^\d+(\.\d+)?[bm]$/i; // 70b, 120b, 8b, 32b, 9b …
const UPPER_TOKENS = new Set(['gpt', 'oss', 'llm', 'ai', 'rag']);

function titleizeToken(token) {
  if (SIZE_TOKEN.test(token)) return token.toUpperCase();        // 70b -> 70B
  if (/^\d/.test(token)) return token;                            // version numbers: 3.3, 4
  if (UPPER_TOKENS.has(token.toLowerCase())) return token.toUpperCase();
  return token.charAt(0).toUpperCase() + token.slice(1);
}

export function deriveModelLabel(id) {
  const base = String(id).split('/').pop();      // drop provider prefix (openai/…)
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map(titleizeToken)
    .join(' ');
}

// ── Read & validate ──────────────────────────────────────────────────────────
// Optional: in the default single-server deploy the API is served from the SAME
// origin as the app, so this stays empty and requests use relative paths
// (`/api/...`). Set it only when the API is hosted on a separate origin.
const apiUrl = optional('VITE_API_URL', '');
const appEnv = required('VITE_APP_ENV');
// Optional: Clerk publishable key. Absent = auth disabled (app still boots).
const clerkPublishableKey = optional('VITE_CLERK_PUBLISHABLE_KEY', '');
const llmProvider = required('VITE_LLM_PROVIDER');
const defaultModel = required('VITE_DEFAULT_MODEL');
const modelIds = parseList(required('VITE_AVAILABLE_MODELS') || '');
const labelOverrides = parseLabelOverrides(optional('VITE_MODEL_LABELS', ''));

if (defaultModel && modelIds.length > 0 && !modelIds.includes(defaultModel)) {
  errors.push(
    `VITE_DEFAULT_MODEL "${defaultModel}" is not in VITE_AVAILABLE_MODELS (${modelIds.join(', ')})`
  );
}

if (errors.length > 0) {
  const message =
    'Invalid frontend environment configuration:\n' +
    errors.map((e) => `  ❌ ${e}`).join('\n') +
    '\n  Fix the project-root .env file (see .env.example).';
  // Surface loudly in the console and halt module evaluation.
  console.error(message);
  throw new Error(message);
}

// Each available model as { id, label } — fully derived from configuration.
const availableModels = modelIds.map((id) => ({
  id,
  label: labelOverrides[id] || deriveModelLabel(id),
}));

export const config = Object.freeze({
  apiUrl,
  appEnv,
  isProduction: appEnv === 'production',
  isDevelopment: appEnv === 'development',
  llmProvider,
  defaultModel,
  modelIds,
  availableModels,
  clerkPublishableKey,
  isAuthEnabled: Boolean(clerkPublishableKey),
});

// Convenient named exports.
export const API_URL = config.apiUrl;
export const APP_ENV = config.appEnv;
export const LLM_PROVIDER = config.llmProvider;
export const DEFAULT_MODEL = config.defaultModel;
export const AVAILABLE_MODELS = config.availableModels;
export const CLERK_PUBLISHABLE_KEY = config.clerkPublishableKey;

export default config;
