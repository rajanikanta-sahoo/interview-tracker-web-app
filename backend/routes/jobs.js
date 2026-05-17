import express from 'express';
import { scrapeJobs } from '../scraper/index.js';

const router = express.Router();

// Mock store for user-contributed jobs
let customJobs = [];

// GET /api/jobs - Search jobs
router.get('/', async (req, res) => {
  try {
    const { role, location, remote, skills, experience } = req.query;
    
    // Attempt to scrape basic jobs
    const scrapedJobs = await scrapeJobs(role, location, remote === 'true', skills, experience);
    
    // Combine with custom jobs
    const allJobs = [...customJobs, ...scrapedJobs];
    
    res.json(allJobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// POST /api/jobs - Manually add a custom job
router.post('/', (req, res) => {
  const { title, company, location, type, description } = req.body;
  
  if (!title || !company) {
    return res.status(400).json({ error: 'Title and company are required' });
  }

  const newJob = {
    id: `custom-${Date.now()}`,
    title,
    company,
    location: location || 'Remote',
    type: type || 'Full-Time',
    description: description || '',
    postedAt: new Date().toISOString(),
    source: 'User Contributed'
  };

  customJobs.push(newJob);
  res.status(201).json(newJob);
});

export default router;
