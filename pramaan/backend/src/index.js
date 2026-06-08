// Load configuration FIRST. Importing the config module loads `.env` as a side
// effect, so every module that depends on configuration sees it.
import config, { isMongoConfigured, isClerkConfigured } from './config/index.js';
import logger from './lib/logger.js';

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { clerkMiddleware } from '@clerk/express';
import { isGroqConfigured } from './lib/groqClient.js';
import { personaStore } from './store/personaStore.js';

// ET Nucleus routers (the only product).
import intentRouter from './routes/intent.js';
import nucleusRouter from './routes/nucleus.js';
import personaRouter from './routes/persona.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.disable('x-powered-by');

// CORS. In the default single-server deploy the frontend is served from the SAME
// origin as the API, so CORS never applies. This check only matters when the
// frontend is hosted on a separate origin (set CLIENT_URL / CORS_ORIGINS then).
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) {
        return cb(null, true);
      }
      logger.warn(`Blocked CORS origin: ${origin}`);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk session verification (no-op when CLERK_SECRET_KEY is unset). Populates
// req.auth so routes can trust the verified user id over a client-claimed one.
if (isClerkConfigured) {
  app.use(
    clerkMiddleware({
      secretKey: config.clerkSecretKey,
      publishableKey: config.clerkPublishableKey || undefined,
    })
  );
  logger.info('Clerk: backend session verification enabled');
}

// ── ET Nucleus API ───────────────────────────────────────────────
app.use('/api/intent', intentRouter);
app.use('/api/nucleus', nucleusRouter);
app.use('/api/persona', personaRouter);

app.get('/health', (req, res) =>
  res.json({
    status: 'ok',
    version: '1.0.0',
    groq: isGroqConfigured ? 'configured' : 'missing',
    store: personaStore.backend,
    mongo: isMongoConfigured ? (personaStore.backend === 'mongodb' ? 'connected' : 'configured-but-unreachable') : 'not-configured',
    clerk: isClerkConfigured ? 'configured' : 'not-configured',
  })
);

// ── Serve the built frontend (single-server production deploy) ────
// `npm run build` (frontend) emits static files to frontend/dist. When present,
// Express serves them and falls back to index.html for client-side routes so the
// SPA survives hard refresh / deep links. In local dev the Vite dev server
// handles the frontend, so dist is absent and this block is skipped.
const distDir = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const hasFrontend = fs.existsSync(path.join(distDir, 'index.html'));
if (hasFrontend) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/health') {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

// Final error handler (must stay last, after all routes/middleware).
app.use((err, req, res, next) => {
  logger.error('Express error:', err.message);
  res.status(500).json({ error: err.message });
});

// Connect the persistence layer first (best-effort), then start listening.
async function start() {
  await personaStore.init();

  app.listen(config.port, () => {
    logger.info('─────────────────────────────────────────────────────────');
    logger.info('ET Nucleus server started');
    logger.info(`Listening on port ${config.port}`);
    logger.info(`NODE_ENV=${config.nodeEnv}`);
    logger.info(`LLM_PROVIDER=${config.llmProvider}`);
    logger.info(`DEFAULT_MODEL=${config.defaultModel}`);
    logger.info(`AVAILABLE_MODELS=${config.availableModels.length}`);
    logger.info(
      `CORS origins: ${config.corsOrigins.length ? config.corsOrigins.join(', ') : '(same-origin only)'}`
    );
    logger.info(`Groq: ${isGroqConfigured ? 'configured' : 'missing (demo/fallback mode)'}`);
    logger.info(`NewsAPI: ${config.newsApiKey ? 'configured' : 'not configured (optional, demo data)'}`);
    logger.info(`Persona store: ${personaStore.backend}`);
    logger.info(`Clerk: ${isClerkConfigured ? 'configured (backend verification on)' : 'not configured (guest-only)'}`);
    logger.info(`Frontend: ${hasFrontend ? 'served from frontend/dist' : 'not built (use Vite dev server)'}`);
    logger.info('─────────────────────────────────────────────────────────');
    logger.info('API:');
    logger.info('  POST /api/intent/analyze              - Analyze user intent');
    logger.info('  POST /api/nucleus/personalized-feed   - Get personalized news');
    logger.info('  POST /api/nucleus/synthesize          - Synthesize topic briefing');
    logger.info('  POST /api/nucleus/ask                 - Answer questions');
    logger.info('  POST /api/nucleus/translate           - Translate to Hindi');
    logger.info('  POST /api/persona/create              - Create new persona');
    logger.info('  GET  /api/persona/:userId             - Get persona');
    logger.info('  POST /api/persona/:userId/interaction - Record interaction');
    logger.info('  POST /api/persona/:userId/evolve      - Evolve persona with AI');
    logger.info('─────────────────────────────────────────────────────────');
  });
}

start();
