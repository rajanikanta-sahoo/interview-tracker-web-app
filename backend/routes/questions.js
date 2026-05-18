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

// POST /api/questions/:id/practice - Save STAR answer and status
router.post('/:id/practice', (req, res) => {
  const { id } = req.params;
  const { starAnswer, practiceStatus } = req.body;
  
  const db = readDb();
  const index = db.questionsBank.findIndex(q => q.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  if (starAnswer !== undefined) {
    db.questionsBank[index].starAnswer = starAnswer;
  }
  if (practiceStatus !== undefined) {
    db.questionsBank[index].practiceStatus = practiceStatus;
  }
  
  writeDb(db);
  res.json(db.questionsBank[index]);
});

// POST /api/questions/:id/coach - Heuristic AI review of STAR response
router.post('/:id/coach', (req, res) => {
  const { situation, task, action, result } = req.body;

  const sLength = (situation || '').trim().length;
  const tLength = (task || '').trim().length;
  const aLength = (action || '').trim().length;
  const rLength = (result || '').trim().length;

  if (sLength === 0 && tLength === 0 && aLength === 0 && rLength === 0) {
    return res.json({
      score: 0,
      structureScore: 0,
      clarityScore: 0,
      impactScore: 0,
      summary: "You haven't written anything yet! Please write your STAR response to receive AI coaching feedback.",
      strengths: [],
      improvements: ["Fill out all four STAR components to get structured guidance."]
    });
  }

  let structureScore = 0;
  if (sLength > 10) structureScore += 25;
  if (tLength > 10) structureScore += 25;
  if (aLength > 15) structureScore += 25;
  if (rLength > 15) structureScore += 25;

  let clarityScore = Math.min(100, Math.round(
    (Math.min(100, sLength) + Math.min(100, tLength) + Math.min(150, aLength) + Math.min(150, rLength)) / 500 * 100
  ));
  if (clarityScore < 40) clarityScore = 40;

  const hasNumbers = /\d+/.test(result || '');
  const hasActionWords = /(optimized|led|designed|implemented|built|delivered|resolved|accelerated|increased|reduced|saved)/i.test(action || '');
  
  let impactScore = 50;
  if (rLength > 20) impactScore += 10;
  if (hasNumbers) impactScore += 25;
  if (hasActionWords) impactScore += 15;
  impactScore = Math.min(100, impactScore);

  const overallScore = Math.round((structureScore + clarityScore + impactScore) / 3);

  const strengths = [];
  const improvements = [];

  if (sLength > 40) {
    strengths.push("Excellent context setting. You described the situation and background very clearly.");
  } else if (sLength > 0) {
    improvements.push("Elaborate on the 'Situation': provide more context on the team size, project scale, or codebase stack.");
  } else {
    improvements.push("The 'Situation' block is completely empty. Start by describing the team environment and problem scope.");
  }

  if (tLength > 30) {
    strengths.push("Good challenge description. The core objective and task constraints are well-defined.");
  } else if (tLength > 0) {
    improvements.push("Add detail to the 'Task': what were the specific deadlines, blockers, or KPIs you were responsible for solving?");
  } else {
    improvements.push("The 'Task' block is empty. State the core goal or obstacle you were assigned to tackle.");
  }

  if (aLength > 60) {
    strengths.push("Fantastic action deep-dive! You explained exactly *how* you solved it, highlighting your personal ownership.");
  } else if (aLength > 0) {
    improvements.push("Expand on the 'Action' block: elaborate on the specific tech choices (e.g. React custom hooks, Redux toolkit) and teamwork strategies you used.");
  } else {
    improvements.push("The 'Action' block is missing. This is the most crucial part—explain your active role and technical decisions step-by-step.");
  }

  if (hasNumbers && rLength > 30) {
    strengths.push("Highly impactful 'Result'! Using concrete quantitative metrics (e.g., speedups, decrease in load times) immediately proves your value.");
  } else if (rLength > 0) {
    if (!hasNumbers) {
      improvements.push("Quantify your 'Result': use numbers, percentages, or times (e.g., 'reduced render lag by 40%', 'saved 10 engineering hours per week') to make it credible.");
    } else {
      improvements.push("Elaborate on the 'Result': describe the feedback from stakeholders or subsequent milestones after your changes were deployed.");
    }
  } else {
    improvements.push("The 'Result' block is empty. A STAR answer must conclude with a strong, successful outcome!");
  }

  if (hasActionWords) {
    strengths.push("Strong active voice. Words like 'optimized' or 'implemented' paint you as a proactive leader.");
  }

  let summary = "";
  if (overallScore >= 85) {
    summary = "Outstanding STAR response! This answer is highly structured, quantitative, and ready for senior-level tech interviews. Maintain this exact format.";
  } else if (overallScore >= 65) {
    summary = "Solid draft with a good foundation. To make it truly standout, focus on adding quantitative results and explicit details of your technical actions.";
  } else {
    summary = "Beginning draft. You have started the process, but the response needs to be expanded across all STAR blocks, especially action steps and outcomes.";
  }

  res.json({
    score: overallScore,
    structureScore,
    clarityScore,
    impactScore,
    summary,
    strengths,
    improvements
  });
});

export default router;
