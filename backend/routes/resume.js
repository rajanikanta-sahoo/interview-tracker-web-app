import express from 'express';
import { readDb, writeDb } from '../db.js';

const router = express.Router();

// --- RESUMES ---

router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.resumes || []);
});

router.post('/', (req, res) => {
  const db = readDb();
  const data = req.body;
  if (!db.resumes) db.resumes = [];
  
  if (data.id) {
    const idx = db.resumes.findIndex(r => r.id === data.id);
    if (idx > -1) {
      db.resumes[idx] = { ...db.resumes[idx], ...data, updatedAt: new Date().toISOString() };
    } else {
      db.resumes.push({ ...data, id: `res-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  } else {
    db.resumes.push({ ...data, id: `res-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  
  writeDb(db);
  res.json({ message: 'Resume saved successfully' });
});

router.delete('/:id', (req, res) => {
  const db = readDb();
  if (db.resumes) {
    db.resumes = db.resumes.filter(r => r.id !== req.params.id);
    writeDb(db);
  }
  res.json({ message: 'Resume deleted' });
});

// --- COVER LETTERS ---

router.get('/cover-letters', (req, res) => {
  const db = readDb();
  res.json(db.coverLetters || []);
});

router.post('/cover-letters', (req, res) => {
  const db = readDb();
  const data = req.body;
  if (!db.coverLetters) db.coverLetters = [];
  
  if (data.id) {
    const idx = db.coverLetters.findIndex(c => c.id === data.id);
    if (idx > -1) {
      db.coverLetters[idx] = { ...db.coverLetters[idx], ...data, updatedAt: new Date().toISOString() };
    } else {
      db.coverLetters.push({ ...data, id: `cl-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  } else {
    db.coverLetters.push({ ...data, id: `cl-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  
  writeDb(db);
  res.json({ message: 'Cover letter saved successfully' });
});

router.delete('/cover-letters/:id', (req, res) => {
  const db = readDb();
  if (db.coverLetters) {
    db.coverLetters = db.coverLetters.filter(c => c.id !== req.params.id);
    writeDb(db);
  }
  res.json({ message: 'Cover letter deleted' });
});

// --- GENERATION (Simulated AI) ---

const MOCK_DATA = {
  'frontend': {
    techSkills: ['React', 'Vue', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Redux', 'Webpack', 'TailwindCSS', 'Jest'],
    softSkills: ['UI/UX Collaboration', 'Attention to Detail', 'Agile/Scrum', 'Communication'],
    keyPoints: [
      'Developed and maintained highly responsive user interfaces using React.',
      'Improved application rendering performance by 40% through component optimization.',
      'Collaborated closely with designers to implement pixel-perfect, accessible UI components.',
      'Integrated RESTful APIs and GraphQL endpoints seamlessly.'
    ]
  },
  'backend': {
    techSkills: ['Node.js', 'Python', 'Java', 'SQL', 'NoSQL', 'Docker', 'Kubernetes', 'AWS/GCP', 'Microservices'],
    softSkills: ['System Design', 'Problem Solving', 'Security Awareness', 'Scalability Planning'],
    keyPoints: [
      'Designed and built scalable microservices architecture handling high throughput traffic.',
      'Optimized database queries resulting in a 50% reduction in response time.',
      'Implemented robust authentication and authorization mechanisms.',
      'Set up CI/CD pipelines to automate testing and deployment processes.'
    ]
  },
  'data': {
    techSkills: ['Python', 'SQL', 'Pandas', 'TensorFlow', 'PyTorch', 'Data Visualization', 'Machine Learning', 'Big Data'],
    softSkills: ['Analytical Thinking', 'Business Acumen', 'Statistical Modeling', 'Storytelling'],
    keyPoints: [
      'Developed predictive models that increased revenue targeting efficiency by 25%.',
      'Engineered scalable data pipelines for real-time analytics.',
      'Created comprehensive interactive dashboards for executive reporting.',
      'Performed complex A/B testing analysis to guide product decisions.'
    ]
  },
  'default': {
    techSkills: ['Project Management', 'Data Analysis', 'Software Development', 'Cloud Computing', 'Git'],
    softSkills: ['Leadership', 'Problem Solving', 'Communication', 'Teamwork', 'Adaptability'],
    keyPoints: [
      'Led cross-functional teams to deliver projects on time and under budget.',
      'Streamlined operational processes resulting in significant cost savings.',
      'Mentored junior staff and conducted performance reviews.',
      'Collaborated with stakeholders to define project requirements and scope.'
    ]
  }
};

router.post('/generate-suggestions', (req, res) => {
  const { role, profileSkills = [] } = req.body;
  const roleLower = (role || '').toLowerCase();
  
  let category = 'default';
  if (roleLower.includes('front') || roleLower.includes('ui') || roleLower.includes('react')) category = 'frontend';
  else if (roleLower.includes('back') || roleLower.includes('server') || roleLower.includes('node') || roleLower.includes('api')) category = 'backend';
  else if (roleLower.includes('data') || roleLower.includes('machine') || roleLower.includes('ai') || roleLower.includes('analy')) category = 'data';

  const suggestions = MOCK_DATA[category];

  // Simple ATS matching calculation
  let matchedSkills = 0;
  suggestions.techSkills.forEach(skill => {
    if (profileSkills.some(ps => ps.toLowerCase() === skill.toLowerCase())) {
      matchedSkills++;
    }
  });
  
  const atsScore = Math.min(100, Math.round((matchedSkills / suggestions.techSkills.length) * 100) + 30); // baseline 30% for formatting

  res.json({
    ...suggestions,
    atsScore
  });
});

router.post('/generate-cover-letter', (req, res) => {
  const { role, profileName, companyName = "[Company Name]" } = req.body;
  
  const template = `Dear Hiring Manager,

I am writing to express my strong interest in the ${role} position at ${companyName}. With my solid background in this field and my passion for delivering high-quality results, I am confident in my ability to make an immediate impact on your team.

Throughout my career, I have consistently demonstrated a strong ability to solve complex problems and collaborate effectively with cross-functional teams. I am particularly drawn to ${companyName}'s innovative approach and industry reputation.

I would welcome the opportunity to discuss how my skills and experiences align with your needs. Thank you for considering my application.

Sincerely,

${profileName || '[Your Name]'}
`;

  res.json({ text: template });
});

export default router;
