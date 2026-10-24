import express from 'express';
import { readDb, writeDb } from '../db.js';
import {
  EXPERIENCE_LEVELS,
  LEVEL_EXPECTATIONS,
  CHECKLIST_TEMPLATES,
  resolveExperienceLevel
} from '../data/checklists.js';

const router = express.Router();

// Helper to compute progress for a checklist instance
function computeProgress(checklist) {
  let total = 0;
  let completed = 0;

  if (Array.isArray(checklist.categories)) {
    for (const cat of checklist.categories) {
      if (Array.isArray(cat.items)) {
        for (const item of cat.items) {
          total++;
          if (item.checked) completed++;
        }
      }
    }
  }

  if (Array.isArray(checklist.customItems)) {
    for (const item of checklist.customItems) {
      total++;
      if (item.checked) completed++;
    }
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}

// 1. Get experience levels & level expectations
router.get('/levels', (req, res) => {
  res.json({
    levels: EXPERIENCE_LEVELS,
    expectations: LEVEL_EXPECTATIONS
  });
});

// 2. Get checklist template by level or years
router.get('/template', (req, res) => {
  const { level, years } = req.query;
  let targetLevel = level;

  if (!targetLevel && typeof years !== 'undefined') {
    targetLevel = resolveExperienceLevel(years).id;
  }
  if (!targetLevel || !CHECKLIST_TEMPLATES[targetLevel]) {
    targetLevel = 'mid';
  }

  const template = CHECKLIST_TEMPLATES[targetLevel];
  const levelInfo = EXPERIENCE_LEVELS.find(l => l.id === targetLevel) || EXPERIENCE_LEVELS[2];
  const expectations = LEVEL_EXPECTATIONS[targetLevel];

  res.json({
    level: levelInfo,
    expectations,
    categories: template.categories
  });
});

// 3. Get all saved checklists
router.get('/', (req, res) => {
  const db = readDb();
  const checklists = Array.isArray(db.checklists) ? db.checklists : [];
  res.json(checklists);
});

// 4. Get specific checklist by ID
router.get('/:id', (req, res) => {
  const db = readDb();
  const checklists = Array.isArray(db.checklists) ? db.checklists : [];
  const checklist = checklists.find(c => c.id === req.params.id);
  if (!checklist) {
    return res.status(404).json({ error: 'Checklist not found' });
  }
  res.json(checklist);
});

// 5. Create new checklist
router.post('/', (req, res) => {
  const {
    name,
    experienceLevel,
    yearsOfExperience,
    applicationId,
    companyName,
    role,
    interviewDate,
    categories: incomingCategories,
    customItems: incomingCustomItems
  } = req.body;

  let resolvedLevel = experienceLevel;
  if (!resolvedLevel && typeof yearsOfExperience !== 'undefined') {
    resolvedLevel = resolveExperienceLevel(yearsOfExperience).id;
  }
  if (!resolvedLevel || !CHECKLIST_TEMPLATES[resolvedLevel]) {
    resolvedLevel = 'mid';
  }

  const template = CHECKLIST_TEMPLATES[resolvedLevel];

  // Deep clone template categories and add checked: false, notes: "" if not provided
  const categories = (incomingCategories && incomingCategories.length > 0)
    ? incomingCategories
    : template.categories.map(cat => ({
        id: cat.id,
        title: cat.title,
        description: cat.description || '',
        items: cat.items.map(item => ({
          id: item.id,
          text: item.text,
          priority: item.priority || 'important',
          linkTo: item.linkTo || null,
          checked: false,
          notes: ''
        }))
      }));

  const customItems = incomingCustomItems || [];

  const newChecklist = {
    id: `cl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: name || `${companyName ? companyName + ' ' : ''}${role || 'Interview'} Prep Checklist`,
    experienceLevel: resolvedLevel,
    applicationId: applicationId || null,
    companyName: companyName || '',
    role: role || '',
    interviewDate: interviewDate || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    categories,
    customItems,
    progress: { total: 0, completed: 0, percentage: 0 }
  };

  newChecklist.progress = computeProgress(newChecklist);

  const db = readDb();
  if (!Array.isArray(db.checklists)) {
    db.checklists = [];
  }
  db.checklists.unshift(newChecklist);
  writeDb(db);

  res.status(201).json(newChecklist);
});

// 6. Update checklist (toggle items, edit notes, add custom items, change name)
router.put('/:id', (req, res) => {
  const db = readDb();
  if (!Array.isArray(db.checklists)) {
    db.checklists = [];
  }

  const index = db.checklists.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Checklist not found' });
  }

  const existing = db.checklists[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id, // prevent ID overwrite
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  updated.progress = computeProgress(updated);

  db.checklists[index] = updated;
  writeDb(db);

  res.json(updated);
});

// 7. Duplicate a checklist
router.post('/:id/duplicate', (req, res) => {
  const db = readDb();
  const checklists = Array.isArray(db.checklists) ? db.checklists : [];
  const existing = checklists.find(c => c.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Checklist not found' });
  }

  const clonedCategories = JSON.parse(JSON.stringify(existing.categories));
  const clonedCustomItems = JSON.parse(JSON.stringify(existing.customItems || []));

  const duplicate = {
    ...existing,
    id: `cl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: `${existing.name} (Copy)`,
    applicationId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    categories: clonedCategories,
    customItems: clonedCustomItems,
    progress: computeProgress({ categories: clonedCategories, customItems: clonedCustomItems })
  };

  db.checklists.unshift(duplicate);
  writeDb(db);

  res.status(201).json(duplicate);
});

// 8. Delete checklist
router.delete('/:id', (req, res) => {
  const db = readDb();
  if (!Array.isArray(db.checklists)) {
    db.checklists = [];
  }

  const index = db.checklists.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Checklist not found' });
  }

  db.checklists.splice(index, 1);
  writeDb(db);

  res.json({ success: true, message: 'Checklist deleted successfully' });
});

export default router;
