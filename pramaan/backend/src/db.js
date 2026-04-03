import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const dbPath = process.env.SQLITE_DB_PATH || './pramaan.db';
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'pending',
    media_path TEXT,
    media_type TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    provenance TEXT,
    spatial TEXT,
    retrieval TEXT,
    risk TEXT,
    draft TEXT,
    approved INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

export function createJob(id, mediaPath, mediaType) {
  db.prepare('INSERT INTO jobs (id, status, media_path, media_type) VALUES (?, ?, ?, ?)').run(id, 'pending', mediaPath, mediaType);
}

export function updateJobStatus(id, status) {
  db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, id);
}

export function getJob(id) {
  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
}

export function saveReport(id, jobId, data) {
  db.prepare(`
    INSERT INTO reports (id, job_id, provenance, spatial, retrieval, risk, draft)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, jobId,
    JSON.stringify(data.provenance),
    JSON.stringify(data.spatial),
    JSON.stringify(data.retrieval),
    JSON.stringify(data.risk),
    data.draft
  );
}

export function getReport(id) {
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  if (!row) return null;
  return {
    ...row,
    provenance: JSON.parse(row.provenance || '{}'),
    spatial: JSON.parse(row.spatial || '{}'),
    retrieval: JSON.parse(row.retrieval || '{}'),
    risk: JSON.parse(row.risk || '{}'),
  };
}

export function approveReport(id) {
  db.prepare('UPDATE reports SET approved = 1 WHERE id = ?').run(id);
}

export default db;
