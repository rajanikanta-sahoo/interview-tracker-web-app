import express from 'express';
import { readDb, writeDb } from '../db.js';

const router = express.Router();

const DEFAULT_APPLICATIONS = {
  applied: [],
  interviewing: [],
  offer: [],
  rejected: []
};

// GET /api/applications - Get all tracked applications
router.get('/', (req, res) => {
  try {
    const db = readDb();
    const applications = db.applications || DEFAULT_APPLICATIONS;
    res.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// PUT /api/applications - Sync all tracked applications
router.put('/', (req, res) => {
  try {
    const applications = req.body;
    if (!applications || typeof applications !== 'object') {
      return res.status(400).json({ error: 'Invalid applications payload' });
    }

    const db = readDb();
    db.applications = {
      applied: Array.isArray(applications.applied) ? applications.applied : [],
      interviewing: Array.isArray(applications.interviewing) ? applications.interviewing : [],
      offer: Array.isArray(applications.offer) ? applications.offer : [],
      rejected: Array.isArray(applications.rejected) ? applications.rejected : []
    };
    writeDb(db);
    res.json(db.applications);
  } catch (error) {
    console.error("Error saving applications:", error);
    res.status(500).json({ error: 'Failed to save applications' });
  }
});

// DELETE /api/applications/:id - Remove an application by id from all columns
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    if (!db.applications) db.applications = { ...DEFAULT_APPLICATIONS };

    let found = false;
    for (const key of ['applied', 'interviewing', 'offer', 'rejected']) {
      const arr = db.applications[key] || [];
      const filtered = arr.filter(j => j.id !== id);
      if (filtered.length !== arr.length) {
        db.applications[key] = filtered;
        found = true;
      }
    }

    if (found) {
      writeDb(db);
      res.json({ message: 'Application removed', applications: db.applications });
    } else {
      res.status(404).json({ error: 'Application not found' });
    }
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
