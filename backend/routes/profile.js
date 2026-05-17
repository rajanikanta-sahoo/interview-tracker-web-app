import express from 'express';
import multer from 'multer';
import path from 'path';
import { readDb, writeDb } from '../db.js';

const router = express.Router();


// Configure Multer for Resume upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'resume-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET /api/profile
router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.profile);
});

// POST /api/profile/update
router.post('/update', (req, res) => {
  const data = req.body;
  const db = readDb();
  db.profile = { ...db.profile, ...data };
  writeDb(db);
  res.json({ message: 'Profile updated', profile: db.profile });
});

// POST /api/profile/upload-resume
router.post('/upload-resume', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const db = readDb();
  db.profile.resumePath = `/uploads/${req.file.filename}`;
  writeDb(db);
  res.json({ message: 'Resume uploaded successfully', resumePath: db.profile.resumePath });
});

export default router;
