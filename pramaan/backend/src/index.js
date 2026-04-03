import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import uploadRouter from './routes/upload.js';
import analyzeRouter from './routes/analyze.js';
import reportRouter from './routes/report.js';
import intentRouter from './routes/intent.js';
import nucleusRouter from './routes/nucleus.js';
import personaRouter from './routes/persona.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media files
const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/upload', uploadRouter);
app.use('/analyze', analyzeRouter);
app.use('/report', reportRouter);

// ET Nucleus routes
app.use('/api/intent', intentRouter);
app.use('/api/nucleus', nucleusRouter);
app.use('/api/persona', personaRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use((err, req, res, next) => {
  console.error('[Express Error]', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n✨ ET Nucleus backend running at http://localhost:${PORT}`);
  console.log(`   GROQ: ${process.env.GROQ_API_KEY ? '✓ configured' : '✗ missing'}`);
  console.log(`   NewsAPI: ${process.env.NEWS_API_KEY ? '✓ configured' : '⚠ not configured (optional)'}`);
  console.log(`\n   ET Nucleus API:`);
  console.log(`   POST /api/intent/analyze - Analyze user intent`);
  console.log(`   POST /api/nucleus/personalized-feed - Get personalized news`);
  console.log(`   POST /api/nucleus/synthesize - Synthesize topic briefing`);
  console.log(`   POST /api/nucleus/ask - Answer questions`);
  console.log(`   POST /api/nucleus/translate - Translate to Hindi`);
  console.log(`\n   Persona Management:`);
  console.log(`   POST /api/persona/create - Create new persona`);
  console.log(`   GET  /api/persona/:userId - Get persona`);
  console.log(`   POST /api/persona/:userId/interaction - Record interaction`);
  console.log(`   POST /api/persona/:userId/evolve - Evolve persona with AI\n`);
});
