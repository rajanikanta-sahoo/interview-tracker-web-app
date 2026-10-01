import express from 'express';
import { scrapeJobs } from '../scraper/index.js';
import { readDb, writeDb } from '../db.js';

const router = express.Router();

// GET /api/jobs - Search jobs
router.get('/', async (req, res) => {
  try {
    const { role, location, remote, skills, experience } = req.query;
    
    // Attempt to scrape basic jobs
    const scrapedJobs = await scrapeJobs(role, location, remote === 'true', skills, experience);
    
    // Combine with custom jobs
    const db = readDb();
    const allJobs = [...db.customJobs, ...scrapedJobs];
    
    res.json(allJobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// POST /api/jobs - Manually add a custom job
router.post('/', (req, res) => {
  const { title, company, location, type, description, department, salaryMin, salaryMax, url, skills } = req.body;
  
  if (!title || !company) {
    return res.status(400).json({ error: 'Title and company are required' });
  }

  const newJob = {
    id: `custom-${Date.now()}`,
    title,
    company,
    department: department || '',
    location: location || 'Remote',
    type: type || 'Full-Time',
    description: description || '',
    salaryMin: salaryMin || '',
    salaryMax: salaryMax || '',
    url: url || '',
    skills: Array.isArray(skills) ? skills : [],
    postedAt: new Date().toISOString(),
    source: 'User Contributed',
    isCustom: true
  };

  const db = readDb();
  if (!db.customJobs) db.customJobs = [];
  db.customJobs.push(newJob);
  writeDb(db);
  res.status(201).json(newJob);
});

// DELETE /api/jobs/:id - Delete a custom job
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.customJobs) db.customJobs = [];
  
  const initialLength = db.customJobs.length;
  db.customJobs = db.customJobs.filter(j => j.id !== id);
  
  if (db.customJobs.length === initialLength) {
    return res.status(404).json({ error: 'Custom job not found' });
  }
  
  writeDb(db);
  res.json({ message: 'Custom job deleted successfully' });
});

export default router;
