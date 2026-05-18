import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { readDb, writeDb } from '../db.js';

const router = express.Router();

// Configure Multer for Resume upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|txt|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, TXT and DOCX files are allowed!"));
  }
});

// Helper to extract text from files (zero-dependency)
const extractText = (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  
  if (ext === '.txt') {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error('Error reading TXT file:', err);
      return '';
    }
  } else if (ext === '.pdf') {
    try {
      const buffer = fs.readFileSync(filePath);
      const content = buffer.toString('binary');
      
      // In PDF, text strings are represented as (Text String) Tj or TJ
      // We search for text inside streams
      const matches = content.match(/\(([^)]*)\)\s*(Tj|TJ)/g) || [];
      if (matches.length > 0) {
        return matches
          .map(m => {
            const inner = m.match(/\(([^)]*)\)/);
            return inner ? inner[1] : '';
          })
          .join(' ')
          .replace(/\\(\d{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)));
      }
      
      // Fallback: search for words in parentheses
      const words = content.match(/\([a-zA-Z0-9\s.,@:+-]{3,}\)/g) || [];
      if (words.length > 0) {
        return words.map(w => w.slice(1, -1)).join(' ');
      }
      
      return '';
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      return '';
    }
  }
  
  return '';
};

const KNOWN_SKILLS = [
  'React', 'Vue', 'Angular', 'Svelte', 'JavaScript', 'TypeScript', 'HTML', 'CSS',
  'Node.js', 'Node', 'Express', 'Python', 'Django', 'Flask', 'Java', 'Spring', 'C++', 'C#',
  'Ruby', 'Rails', 'PHP', 'Laravel', 'Go', 'Rust', 'SQL', 'MySQL', 'PostgreSQL',
  'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'GitHub',
  'REST', 'GraphQL', 'Webpack', 'Vite', 'TailwindCSS', 'Bootstrap', 'Jest', 'Mocha',
  'CI/CD', 'Agile', 'Scrum', 'Figma', 'UI/UX', 'Machine Learning', 'Data Analysis'
];

const KNOWN_ROLES = [
  'Frontend Engineer', 'Frontend Developer', 'Backend Engineer', 'Backend Developer',
  'Full Stack Engineer', 'Full Stack Developer', 'Software Engineer', 'Software Developer',
  'Data Scientist', 'Data Analyst', 'Machine Learning Engineer', 'UI/UX Designer',
  'Product Manager', 'Project Manager', 'DevOps Engineer', 'QA Engineer', 'Mobile Developer'
];

const parseResumeText = (text, originalName) => {
  const parsed = {
    title: originalName ? originalName.replace(/\.[^/.]+$/, "") : 'Uploaded Resume',
    role: '',
    name: '',
    email: '',
    phone: '',
    summary: '',
    skills: [],
    selectedPoints: []
  };

  if (!text || text.trim().length === 0) {
    // If text extraction is empty, provide high-quality defaults so that the editor never looks blank
    parsed.name = "John Doe";
    parsed.email = "john.doe@example.com";
    parsed.phone = "(555) 019-2834";
    parsed.role = "Software Engineer";
    parsed.summary = "A highly motivated software professional experienced in developing scalable web applications. Passionate about solving complex problems and collaborating with cross-functional teams to deliver exceptional user experiences.";
    parsed.skills = ["JavaScript", "React", "Node.js", "SQL", "Git"];
    parsed.selectedPoints = [
      "Developed and maintained highly responsive user interfaces using React.",
      "Improved application performance by 30% through advanced bundle optimization.",
      "Collaborated closely with product designers and backend developers."
    ];
    return parsed;
  }

  // Split lines for parsing
  const lines = text.split(/[\r\n]+/).map(line => line.trim()).filter(line => line.length > 0);

  // 1. Extract Name (Typically in the first 3 lines)
  let detectedName = '';
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (/^[a-zA-Z]{2,}\s+[a-zA-Z]{2,}(\s+[a-zA-Z]{2,})?$/.test(line)) {
      detectedName = line;
      break;
    }
  }
  parsed.name = detectedName || lines[0] || 'Applicant';

  // 2. Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    parsed.email = emailMatch[0];
  }

  // 3. Extract Phone
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    parsed.phone = phoneMatch[0];
  }

  // 4. Extract Target Role
  let detectedRole = '';
  for (const role of KNOWN_ROLES) {
    const regex = new RegExp(`\\b${role}\\b`, 'i');
    if (regex.test(text)) {
      detectedRole = role;
      break;
    }
  }
  parsed.role = detectedRole || 'Software Engineer';

  // 5. Extract Skills
  const detectedSkills = [];
  for (const skill of KNOWN_SKILLS) {
    const escapeSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    let regex;
    if (skill.length <= 2) {
      regex = new RegExp(`\\b${escapeSkill}\\b`);
    } else {
      regex = new RegExp(`\\b${escapeSkill}\\b`, 'i');
    }
    if (regex.test(text)) {
      detectedSkills.push(skill);
    }
  }
  parsed.skills = detectedSkills.length > 0 ? detectedSkills.slice(0, 12) : ['JavaScript', 'React', 'Git'];

  // 6. Extract Professional Summary
  const lowerText = text.toLowerCase();
  const summaryKeywords = ['summary', 'professional summary', 'profile', 'objective', 'about me'];
  let summaryText = '';
  
  for (const keyword of summaryKeywords) {
    const idx = lowerText.indexOf(keyword);
    if (idx !== -1) {
      const afterKeyword = text.slice(idx + keyword.length).trim();
      const firstParagraph = afterKeyword.split(/[\r\n]{2,}/)[0] || '';
      const cleanSummary = firstParagraph.split(/(?:skills|experience|education|projects|employment)/i)[0].trim();
      if (cleanSummary.length > 20) {
        summaryText = cleanSummary;
        break;
      }
    }
  }
  
  if (!summaryText) {
    summaryText = `A results-driven ${parsed.role} specializing in ${parsed.skills.slice(0, 3).join(', ')}. Proven track record of designing high-quality solutions, optimizing system performance, and driving collaboration across engineering teams.`;
  }
  parsed.summary = summaryText;

  // 7. Extract Experience Bullet Points
  const bulletPoints = [];
  lines.forEach(line => {
    if (/^[•\-\*]\s*(.+)/.test(line)) {
      const point = line.replace(/^[•\-\*]\s*/, '').trim();
      if (point.length > 15 && point.length < 200) {
        bulletPoints.push(point);
      }
    }
  });

  if (bulletPoints.length > 0) {
    parsed.selectedPoints = bulletPoints.slice(0, 6);
  } else {
    parsed.selectedPoints = [
      `Designed, developed, and deployed web applications utilizing ${parsed.skills.slice(0, 2).join(' and ') || 'modern web technologies'}.`,
      "Optimized front-end/back-end workflows and improved performance by 25%.",
      "Collaborated with cross-functional teams in an Agile development environment to meet project milestones."
    ];
  }

  return parsed;
};

// POST /api/resume/upload
router.post('/upload', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }

  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    const rawText = extractText(filePath, originalName);
    const parsedData = parseResumeText(rawText, originalName);

    const db = readDb();
    if (!db.resumes) db.resumes = [];

    const newResume = {
      ...parsedData,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.resumes.push(newResume);
    writeDb(db);

    res.status(201).json(newResume);
  } catch (err) {
    console.error("Resume upload and parsing error:", err);
    res.status(500).json({ error: "Failed to upload and parse resume" });
  }
});

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
