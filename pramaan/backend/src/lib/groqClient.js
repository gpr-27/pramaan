// Shared LLM client for the ET Nucleus agents.
//
// All provider/model/key configuration comes from the centralized config — no
// hardcoded model strings, provider names, or API keys live here.
import config, { resolveModel, isGroqConfigured } from '../config/index.js';
import Groq from 'groq-sdk';
import logger from './logger.js';

// Currently the only supported provider is Groq. The provider NAME still comes
// from configuration so deployments can document/route accordingly; when other
// providers are added, branch on `config.llmProvider` here.
export const LLM_PROVIDER = config.llmProvider;
export const DEFAULT_MODEL = config.defaultModel;
export const AVAILABLE_MODELS = config.availableModels;

// Backwards-compatible alias for older imports. Prefer `resolveModel(model)`.
export const TEXT_MODEL = config.defaultModel;

export { resolveModel, isGroqConfigured };

export const groq = new Groq({ apiKey: config.groqApiKey });

logger.info(
  `LLM client ready · provider=${LLM_PROVIDER} · default=${DEFAULT_MODEL} · ` +
  `${AVAILABLE_MODELS.length} model(s) available`
);
logger.debug(`Available models: ${AVAILABLE_MODELS.join(', ')}`);
