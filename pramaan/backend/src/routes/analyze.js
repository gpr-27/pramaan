import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getJob, updateJobStatus, saveReport } from '../db.js';
import { extractFrames } from '../tools/mediaIngestor.js';
import { runPipeline } from '../agents/orchestrator.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Track active SSE connections to avoid running pipeline twice
const activeJobs = new Set();

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const job = getJob(id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush();
  };

  if (activeJobs.has(id)) {
    send('error', { message: 'Job already running' });
    return res.end();
  }

  activeJobs.add(id);

  const emit = (agent, state, result = null) => {
    send('status', { agent, state, result });
  };

  try {
    updateJobStatus(id, 'running');

    // Extract frames
    emit('ingestor', 'running');
    const jobDir = path.dirname(job.media_path);
    const framesDir = path.join(jobDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });

    const frames = await extractFrames(job.media_path, framesDir);

    if (!frames || frames.length === 0) {
      throw new Error('No frames could be extracted from the media file');
    }

    emit('ingestor', 'done', { frames_extracted: frames.length });

    // Run full pipeline
    const results = await runPipeline(frames, job.media_path, emit);

    // Save report
    const reportId = uuidv4();
    saveReport(reportId, id, results);
    updateJobStatus(id, 'done');

    send('complete', { reportId });
  } catch (err) {
    console.error('[analyze] Pipeline error:', err.message);
    updateJobStatus(id, 'error');
    send('error', { message: err.message || 'Pipeline failed' });
  } finally {
    activeJobs.delete(id);
    res.end();
  }
});

export default router;
