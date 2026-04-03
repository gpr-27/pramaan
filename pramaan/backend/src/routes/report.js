import express from 'express';
import { getReport, approveReport } from '../db.js';

const router = express.Router();

router.get('/:id', (req, res) => {
  const report = getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

router.post('/:id/approve', (req, res) => {
  const report = getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  approveReport(req.params.id);
  res.json({ success: true, message: 'Report approved for publication' });
});

export default router;
