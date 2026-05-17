import express from 'express';
import multer from 'multer';
import path from 'path';
import { readDb, writeDb } from '../db.js';

const router = express.Router();

// Configure Multer for PDF/DOC uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'question-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error("Only PDF and DOC files are allowed!"));
  }
});

// GET /api/questions - Get questions
router.get('/', (req, res) => {
  const { keyword, group, difficulty } = req.query;
  const db = readDb();
  let filtered = db.questionsBank;

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filtered = filtered.filter(q => 
      (q.text && q.text.toLowerCase().includes(lowerKeyword)) || 
      (q.originalName && q.originalName.toLowerCase().includes(lowerKeyword)) ||
      (q.role && q.role.toLowerCase().includes(lowerKeyword))
    );
  }

  if (group) {
    filtered = filtered.filter(q => q.group && q.group.toLowerCase().includes(group.toLowerCase()));
  }

  if (difficulty) {
    filtered = filtered.filter(q => q.difficulty === difficulty);
  }

  res.json(filtered);
});

// POST /api/questions - Add a raw text question
router.post('/', (req, res) => {
  const { role, text, group, keyAreas, difficulty } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const newQuestion = { 
    id: `q${Date.now()}`, 
    role: role || 'General', 
    text, 
    group: group || '',
    keyAreas: keyAreas || '',
    difficulty: difficulty || '',
    type: 'text' 
  };
  const db = readDb();
  db.questionsBank.push(newQuestion);
  writeDb(db);
  res.status(201).json(newQuestion);
});

// POST /api/questions/upload - Upload a question file
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }

  const { role, group, keyAreas, difficulty } = req.body;
  const newFileQuestion = {
    id: `qf${Date.now()}`,
    role: role || 'General',
    group: group || '',
    keyAreas: keyAreas || '',
    difficulty: difficulty || '',
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    type: 'file'
  };

  const db = readDb();
  db.questionsBank.push(newFileQuestion);
  writeDb(db);
  res.status(201).json(newFileQuestion);
});

// DELETE /api/questions/all - Clear all questions
router.delete('/all', (req, res) => {
  const db = readDb();
  db.questionsBank = [];
  writeDb(db);
  res.json({ message: 'All questions deleted' });
});

// DELETE /api/questions/:id - Delete a specific question
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialLength = db.questionsBank.length;
  db.questionsBank = db.questionsBank.filter(q => q.id !== id);
  
  if (db.questionsBank.length === initialLength) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  writeDb(db);
  res.json({ message: 'Question deleted' });
});

export default router;
