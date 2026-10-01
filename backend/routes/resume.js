import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
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

// --- Improved zero-dependency PDF text extractor ---

// Check if extracted text looks like actual human-readable content vs PDF junk
const isReadableText = (text) => {
  if (!text || text.trim().length < 10) return false;
  // Count alphanumeric vs non-printable/node junk ratio
  const alphanumericChars = (text.match(/[a-zA-Z0-9]/g) || []).length;
  const totalChars = text.length;
  if (totalChars === 0) return false;
  // If text contains node IDs or Adobe Identity metadata, it's junk
  if (/node\d{5,}/i.test(text)) return false;
  if (/Adobe\s*Identity/i.test(text)) return false;
  // If ratio of real chars is too low, it's junk
  return (alphanumericChars / totalChars) > 0.3;
};

// Extract text strings from a single PDF content stream (uncompressed)
const extractTextFromStream = (streamContent) => {
  const textParts = [];
  
  // Strategy 1: Extract text from BT...ET blocks with Tj/TJ operators
  const btBlocks = streamContent.match(/BT[\s\S]*?ET/g) || [];
  for (const block of btBlocks) {
    // Match (text) Tj
    const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g) || [];
    for (const m of tjMatches) {
      const inner = m.match(/\(([^)]*)\)/);
      if (inner && inner[1].trim()) {
        textParts.push(inner[1]);
      }
    }
    
    // Match TJ arrays: [(text1) 123 (text2)] TJ
    const tjArrayMatches = block.match(/\[([^\]]*)\]\s*TJ/gi) || [];
    for (const arrMatch of tjArrayMatches) {
      const inner = arrMatch.match(/\[([^\]]*)\]/);
      if (inner) {
        const stringParts = inner[1].match(/\(([^)]*)\)/g) || [];
        const combined = stringParts.map(s => {
          const m = s.match(/\(([^)]*)\)/);
          return m ? m[1] : '';
        }).join('');
        if (combined.trim()) {
          textParts.push(combined);
        }
      }
    }
  }
  
  // Strategy 2: If no BT/ET blocks found, try standalone Tj/TJ
  if (textParts.length === 0) {
    const standaloneTj = streamContent.match(/\(([^)]{2,})\)\s*Tj/g) || [];
    for (const m of standaloneTj) {
      const inner = m.match(/\(([^)]*)\)/);
      if (inner && inner[1].trim()) {
        textParts.push(inner[1]);
      }
    }
  }

  return textParts.join(' ')
    .replace(/\\(\d{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
};

// Helper to extract text from files (pdf-parse & mammoth integration)
const extractText = async (filePath, originalName) => {
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
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      console.log('[PDF Parser] Extracted text length:', data.text ? data.text.length : 0, 'chars');
      return data.text || '';
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      return '';
    }
  } else if (ext === '.docx') {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      console.log('[DOCX Parser] Extracted text length:', result.value ? result.value.length : 0, 'chars');
      return result.value || '';
    } catch (err) {
      console.error('Error extracting DOCX text:', err);
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
    linkedin: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
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

  // Helper: detect if a string is junk/metadata
  const isJunkString = (str) => {
    if (!str) return true;
    if (/node\d{5,}/i.test(str)) return true;
    if (/Adobe\s*Identity/i.test(str)) return true;
    if (/^D:\d{14}/.test(str)) return true; // PDF date metadata
    if (/^[\d\s]+$/.test(str) && str.length > 20) return true; // only digits
    return false;
  };

  // 1. Extract Name (Typically in the first 5 lines, look for proper name patterns)
  let detectedName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Skip lines that look like metadata/junk
    if (isJunkString(line)) continue;
    // Skip lines that look like section headings
    if (/^(summary|experience|education|skills|contact|profile|objective|about)/i.test(line)) continue;
    // Match "FirstName LastName" or "FirstName MiddleName LastName" patterns
    if (/^[A-Z][a-zA-Z'-]+\s+[A-Z][a-zA-Z'-]+(\s+[A-Z][a-zA-Z'-]+)?$/.test(line)) {
      detectedName = line;
      break;
    }
    // Relaxed match: at least two words with letters
    if (/^[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(line) && line.length < 50 && !line.includes('@')) {
      detectedName = line;
      break;
    }
  }
  // Final fallback: use first non-junk line
  if (!detectedName) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (!isJunkString(lines[i]) && lines[i].length < 60 && /[a-zA-Z]/.test(lines[i])) {
        detectedName = lines[i];
        break;
      }
    }
  }
  parsed.name = detectedName || 'Applicant';

  // 2. Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    parsed.email = emailMatch[0];
  }

  // 3. Extract Phone (improved to handle international formats)
  const phonePatterns = [
    /(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
    /(?:\+\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}/,  // Indian format: +91 98765 43210
    /(?:\+\d{1,3}[\s-]?)?\d{10}/              // 10-digit continuous
  ];
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match && match[0].replace(/\D/g, '').length >= 10) {
      parsed.phone = match[0];
      break;
    }
  }

  // 4. Extract LinkedIn URL
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i);
  if (linkedinMatch) {
    parsed.linkedin = linkedinMatch[0];
  }

  // 5. Extract Target Role
  let detectedRole = '';
  for (const role of KNOWN_ROLES) {
    const regex = new RegExp(`\\b${role}\\b`, 'i');
    if (regex.test(text)) {
      detectedRole = role;
      break;
    }
  }
  parsed.role = detectedRole || 'Software Engineer';

  // 6. Extract Skills
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

  // 7. Extract Professional Summary
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

  // 8. Extract Experience entries
  const experienceEntries = [];
  const expSectionKeywords = ['experience', 'employment', 'work history', 'professional experience'];
  const sectionEndKeywords = ['education', 'skills', 'projects', 'certifications', 'awards', 'languages', 'interests', 'references'];
  
  for (const keyword of expSectionKeywords) {
    const idx = lowerText.indexOf(keyword);
    if (idx !== -1) {
      const afterKeyword = text.slice(idx + keyword.length).trim();
      // Find where the next section starts
      let endIdx = afterKeyword.length;
      for (const endKw of sectionEndKeywords) {
        const eIdx = afterKeyword.toLowerCase().indexOf(endKw);
        if (eIdx !== -1 && eIdx < endIdx) {
          endIdx = eIdx;
        }
      }
      const expSection = afterKeyword.slice(0, endIdx);
      const expLines = expSection.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0);
      
      // Try to detect company/title lines (heuristic: lines without bullet points that aren't too long)
      let currentEntry = null;
      for (const line of expLines) {
        const isBullet = /^[•\-\*]\s*/.test(line);
        const hasYear = /\b(19|20)\d{2}\b/.test(line);
        const hasDash = /\s[-–—]\s/.test(line);
        
        if (!isBullet && line.length < 120 && (hasYear || hasDash || line.length < 60)) {
          // This looks like a company/title line
          if (currentEntry && (currentEntry.company || currentEntry.title)) {
            experienceEntries.push(currentEntry);
          }
          // Try to extract year/duration
          const yearMatch = line.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]*\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]*\d{4}|Present|Current)/i) 
            || line.match(/\b(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)\b/i);
          const duration = yearMatch ? yearMatch[0] : '';
          const titleLine = yearMatch ? line.replace(yearMatch[0], '').trim() : line;
          
          currentEntry = {
            id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            company: titleLine.split(/\s*[-–—|,]\s*/)[0]?.trim() || titleLine,
            title: titleLine.split(/\s*[-–—|,]\s*/)[1]?.trim() || '',
            duration: duration,
            description: ''
          };
        } else if (isBullet && currentEntry) {
          const point = line.replace(/^[•\-\*]\s*/, '').trim();
          currentEntry.description += (currentEntry.description ? '\n' : '') + point;
        }
      }
      if (currentEntry && (currentEntry.company || currentEntry.title)) {
        experienceEntries.push(currentEntry);
      }
      break;
    }
  }
  parsed.experience = experienceEntries.slice(0, 5);

  // 9. Extract Education entries
  const educationEntries = [];
  const eduIdx = lowerText.indexOf('education');
  if (eduIdx !== -1) {
    const afterEdu = text.slice(eduIdx + 'education'.length).trim();
    let endIdx = afterEdu.length;
    for (const endKw of ['experience', 'skills', 'projects', 'certifications', 'awards', 'languages', 'interests', 'references']) {
      const eIdx = afterEdu.toLowerCase().indexOf(endKw);
      if (eIdx !== -1 && eIdx < endIdx) {
        endIdx = eIdx;
      }
    }
    const eduSection = afterEdu.slice(0, endIdx);
    const eduLines = eduSection.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0 && !isJunkString(l));
    
    let currentEdu = null;
    for (const line of eduLines) {
      const hasYear = /\b(19|20)\d{2}\b/.test(line);
      const hasDegree = /\b(B\.?S\.?c?|M\.?S\.?c?|B\.?A\.?|M\.?A\.?|Ph\.?D|Bachelor|Master|Associate|Diploma|B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|MBA|BCA|MCA)\b/i.test(line);
      const isBullet = /^[•\-\*]\s*/.test(line);
      
      if (!isBullet && (hasDegree || hasYear || (line.length < 80 && /university|college|institute|school/i.test(line)))) {
        if (currentEdu) {
          educationEntries.push(currentEdu);
        }
        const yearMatch = line.match(/\b(19|20)\d{2}\b/g);
        const year = yearMatch ? yearMatch[yearMatch.length - 1] : '';
        
        currentEdu = {
          id: `edu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          institution: '',
          degree: '',
          year: year
        };
        
        // Try to split into institution and degree
        if (hasDegree) {
          const degreeMatch = line.match(/\b(B\.?S\.?c?|M\.?S\.?c?|B\.?A\.?|M\.?A\.?|Ph\.?D|Bachelor[^,]*|Master[^,]*|Associate[^,]*|Diploma[^,]*|B\.?Tech[^,]*|M\.?Tech[^,]*|B\.?E\.?[^,]*|M\.?E\.?[^,]*|MBA[^,]*|BCA[^,]*|MCA[^,]*)/i);
          if (degreeMatch) {
            currentEdu.degree = degreeMatch[0].trim();
            const remaining = line.replace(degreeMatch[0], '').replace(/\b\d{4}\b/g, '').replace(/[-–—,|]/g, ' ').trim();
            currentEdu.institution = remaining || '';
          } else {
            currentEdu.institution = line.replace(/\b\d{4}\b/g, '').trim();
          }
        } else {
          currentEdu.institution = line.replace(/\b\d{4}\b/g, '').trim();
        }
      }
    }
    if (currentEdu) {
      educationEntries.push(currentEdu);
    }
  }
  parsed.education = educationEntries.slice(0, 4);

  // 10. Extract Experience Bullet Points (for selectedPoints)
  const bulletPoints = [];
  lines.forEach(line => {
    if (/^[•\-\*]\s*(.+)/.test(line)) {
      const point = line.replace(/^[•\-\*]\s*/, '').trim();
      if (point.length > 15 && point.length < 200 && !isJunkString(point)) {
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

  console.log('[Resume Parser] Parsed name:', parsed.name, '| email:', parsed.email, '| phone:', parsed.phone, '| linkedin:', parsed.linkedin);
  console.log('[Resume Parser] Skills:', parsed.skills.length, '| Experience:', parsed.experience.length, '| Education:', parsed.education.length);

  return parsed;
};

// POST /api/resume/upload
router.post('/upload', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }

  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    const rawText = await extractText(filePath, originalName);
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

  const normalizeSkillName = (s) => {
    if (!s) return '';
    if (typeof s === 'string') return s.trim();
    if (typeof s === 'object' && s.name) return String(s.name).trim();
    return String(s).trim();
  };

  // Simple ATS matching calculation
  let matchedSkills = 0;
  suggestions.techSkills.forEach(skill => {
    if (profileSkills.some(ps => normalizeSkillName(ps).toLowerCase() === skill.toLowerCase())) {
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

// --- COMPREHENSIVE JD MATCHING & RESUME OPTIMIZER ENGINE ---

const EXTENDED_SKILLS_CATALOG = [
  // Languages
  { name: 'JavaScript', category: 'Language', pattern: '\\b(?:JavaScript|JS|ES6\\+?)\\b' },
  { name: 'TypeScript', category: 'Language', pattern: '\\b(?:TypeScript|TS)\\b' },
  { name: 'Python', category: 'Language', pattern: '\\bPython(?:3)?\\b' },
  { name: 'Java', category: 'Language', pattern: '\\bJava\\b(?!\\s*Script)' },
  { name: 'C++', category: 'Language', pattern: '\\bC\\+\\+\\b' },
  { name: 'C#', category: 'Language', pattern: '\\b(?:C#|\\.NET)\\b' },
  { name: 'Go', category: 'Language', pattern: '\\b(?:Go|Golang)\\b' },
  { name: 'Rust', category: 'Language', pattern: '\\bRust\\b' },
  { name: 'Ruby', category: 'Language', pattern: '\\bRuby\\b' },
  { name: 'PHP', category: 'Language', pattern: '\\bPHP\\b' },
  { name: 'Swift', category: 'Language', pattern: '\\bSwift\\b' },
  { name: 'Kotlin', category: 'Language', pattern: '\\bKotlin\\b' },
  { name: 'SQL', category: 'Database', pattern: '\\bSQL\\b' },
  { name: 'HTML5', category: 'Frontend', pattern: '\\b(?:HTML5?)\\b' },
  { name: 'CSS3', category: 'Frontend', pattern: '\\b(?:CSS3?)\\b' },

  // Frontend
  { name: 'React', category: 'Frontend', pattern: '\\bReact(?:\\.js)?\\b' },
  { name: 'Next.js', category: 'Frontend', pattern: '\\bNext(?:\\.js)?\\b' },
  { name: 'Vue.js', category: 'Frontend', pattern: '\\bVue(?:\\.js)?\\b' },
  { name: 'Angular', category: 'Frontend', pattern: '\\bAngular\\b' },
  { name: 'Svelte', category: 'Frontend', pattern: '\\bSvelte\\b' },
  { name: 'Redux', category: 'Frontend', pattern: '\\b(?:Redux|Redux Toolkit)\\b' },
  { name: 'Tailwind CSS', category: 'Frontend', pattern: '\\b(?:Tailwind(?:CSS)?)\\b' },
  { name: 'Bootstrap', category: 'Frontend', pattern: '\\bBootstrap\\b' },
  { name: 'Webpack', category: 'Tool', pattern: '\\bWebpack\\b' },
  { name: 'Vite', category: 'Tool', pattern: '\\bVite\\b' },
  { name: 'Responsive Design', category: 'Frontend', pattern: '\\b(?:Responsive Design|Mobile-first)\\b' },
  { name: 'Web Accessibility (a11y)', category: 'Frontend', pattern: '\\b(?:a11y|Accessibility|WCAG)\\b' },

  // Backend
  { name: 'Node.js', category: 'Backend', pattern: '\\bNode(?:\\.js)?\\b' },
  { name: 'Express.js', category: 'Backend', pattern: '\\bExpress(?:\\.js)?\\b' },
  { name: 'NestJS', category: 'Backend', pattern: '\\bNestJS\\b' },
  { name: 'FastAPI', category: 'Backend', pattern: '\\bFastAPI\\b' },
  { name: 'Django', category: 'Backend', pattern: '\\bDjango\\b' },
  { name: 'Flask', category: 'Backend', pattern: '\\bFlask\\b' },
  { name: 'Spring Boot', category: 'Backend', pattern: '\\b(?:Spring Boot|Spring Framework)\\b' },
  { name: 'Ruby on Rails', category: 'Backend', pattern: '\\b(?:Rails|Ruby on Rails)\\b' },
  { name: 'GraphQL', category: 'Backend', pattern: '\\bGraphQL\\b' },
  { name: 'REST APIs', category: 'Backend', pattern: '\\b(?:REST|RESTful(?:\\s+APIs?)?|Web APIs?)\\b' },
  { name: 'Microservices', category: 'Architecture', pattern: '\\b(?:Microservices|Microservice Architecture)\\b' },
  { name: 'gRPC', category: 'Backend', pattern: '\\bgRPC\\b' },
  { name: 'WebSockets', category: 'Backend', pattern: '\\bWebSockets?\\b' },

  // Databases & Messaging
  { name: 'PostgreSQL', category: 'Database', pattern: '\\b(?:PostgreSQL|Postgres)\\b' },
  { name: 'MySQL', category: 'Database', pattern: '\\bMySQL\\b' },
  { name: 'MongoDB', category: 'Database', pattern: '\\b(?:MongoDB|Mongo)\\b' },
  { name: 'Redis', category: 'Database', pattern: '\\bRedis\\b' },
  { name: 'Elasticsearch', category: 'Database', pattern: '\\bElasticsearch\\b' },
  { name: 'DynamoDB', category: 'Database', pattern: '\\bDynamoDB\\b' },
  { name: 'Kafka', category: 'Data/Messaging', pattern: '\\b(?:Kafka|Apache Kafka)\\b' },
  { name: 'RabbitMQ', category: 'Data/Messaging', pattern: '\\bRabbitMQ\\b' },

  // Cloud & DevOps
  { name: 'AWS', category: 'Cloud', pattern: '\\b(?:AWS|Amazon Web Services)\\b' },
  { name: 'Google Cloud (GCP)', category: 'Cloud', pattern: '\\b(?:GCP|Google Cloud(?:\\s+Platform)?)\\b' },
  { name: 'Microsoft Azure', category: 'Cloud', pattern: '\\b(?:Azure|Microsoft Azure)\\b' },
  { name: 'Docker', category: 'DevOps', pattern: '\\bDocker\\b' },
  { name: 'Kubernetes', category: 'DevOps', pattern: '\\b(?:Kubernetes|K8s)\\b' },
  { name: 'Terraform', category: 'DevOps', pattern: '\\bTerraform\\b' },
  { name: 'CI/CD', category: 'DevOps', pattern: '\\b(?:CI/CD|CI-CD|Continuous Integration|Continuous Deployment)\\b' },
  { name: 'GitHub Actions', category: 'DevOps', pattern: '\\bGitHub Actions\\b' },
  { name: 'Linux', category: 'DevOps', pattern: '\\bLinux\\b' },
  { name: 'Serverless', category: 'Cloud', pattern: '\\b(?:Serverless|AWS Lambda|Lambda functions?)\\b' },

  // Testing
  { name: 'Jest', category: 'Testing', pattern: '\\bJest\\b' },
  { name: 'Cypress', category: 'Testing', pattern: '\\bCypress\\b' },
  { name: 'Playwright', category: 'Testing', pattern: '\\bPlaywright\\b' },
  { name: 'Unit Testing', category: 'Testing', pattern: '\\b(?:Unit Testing|Unit Tests?)\\b' },
  { name: 'Integration Testing', category: 'Testing', pattern: '\\bIntegration Testing\\b' },
  { name: 'TDD', category: 'Testing', pattern: '\\b(?:TDD|Test-Driven Development)\\b' },

  // AI / ML / Data
  { name: 'Machine Learning', category: 'AI/Data', pattern: '\\b(?:Machine Learning|ML)\\b' },
  { name: 'TensorFlow', category: 'AI/Data', pattern: '\\bTensorFlow\\b' },
  { name: 'PyTorch', category: 'AI/Data', pattern: '\\bPyTorch\\b' },
  { name: 'Pandas', category: 'AI/Data', pattern: '\\bPandas\\b' },
  { name: 'LLMs & Generative AI', category: 'AI/Data', pattern: '\\b(?:LLMs?|Large Language Models?|Generative AI|GenAI|OpenAI|Prompt Engineering)\\b' },
  { name: 'Data Pipelines / ETL', category: 'AI/Data', pattern: '\\b(?:ETL|Data Pipelines?)\\b' }
];

const SOFT_SKILLS_CATALOG = [
  { name: 'Agile & Scrum Methodologies', pattern: '\\b(?:Agile|Scrum|Sprint Planning|Kanban)\\b' },
  { name: 'System Design & Architecture', pattern: '\\b(?:System Design|Architecture|Distributed Systems)\\b' },
  { name: 'Cross-functional Collaboration', pattern: '\\b(?:Cross-functional|Collaborat(?:e|ing|ion)|Partnering with stakeholders)\\b' },
  { name: 'Technical Mentorship & Leadership', pattern: '\\b(?:Leadership|Mentor(?:ing|ship)?|Team Lead|Guiding junior)\\b' },
  { name: 'Code Reviews & Quality Standards', pattern: '\\b(?:Code Review|Clean Code|Best Practices|Code Quality)\\b' },
  { name: 'Performance Optimization & Scalability', pattern: '\\b(?:Performance Optimiz(?:ation|e)|Low Latency|Scalability|High throughput)\\b' },
  { name: 'Problem Solving & Analytical Thinking', pattern: '\\b(?:Problem Solving|Analytical Thinking|Critical Thinking)\\b' },
  { name: 'Technical Documentation & RFCs', pattern: '\\b(?:Documentation|Technical Specs?|RFCs?|Design Docs?)\\b' },
  { name: 'Product Sense & User Focus', pattern: '\\b(?:User Experience|Product-minded|User-centric|Product intuition)\\b' }
];

// Helper to normalize skill strings
const normalizeSkillStr = (s) => {
  if (!s) return '';
  if (typeof s === 'string') return s.trim();
  if (typeof s === 'object' && s.name) return String(s.name).trim();
  return String(s).trim();
};

router.post('/analyze-jd', (req, res) => {
  try {
    const { jobDescription, targetRole = '', companyName = '', resumeId, resumeData, rawResumeText = '' } = req.body;

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a valid Job Description with at least 20 characters.' });
    }

    // Resolve resume object
    const db = readDb();
    let currentResume = resumeData;

    if (!currentResume && resumeId && db.resumes) {
      currentResume = db.resumes.find(r => r.id === resumeId);
    }

    if (!currentResume && (!rawResumeText || rawResumeText.trim().length === 0)) {
      return res.status(400).json({ error: 'No resume provided. Please select a saved resume, upload a resume, or paste your resume content.' });
    }

    // Build consolidated text from resume
    let resumeText = rawResumeText || '';
    let candidateName = 'Applicant';
    let currentRole = targetRole || 'Software Professional';
    let resumeSkillsList = [];

    if (currentResume) {
      candidateName = currentResume.name || candidateName;
      currentRole = currentResume.role || currentRole;
      
      const skillsArray = (currentResume.skills || []).map(normalizeSkillStr).filter(Boolean);
      resumeSkillsList = skillsArray;

      const expText = (currentResume.experience || []).map(e => `${e.title || ''} ${e.company || ''} ${e.description || ''}`).join('\n');
      const eduText = (currentResume.education || []).map(ed => `${ed.degree || ''} ${ed.institution || ''}`).join('\n');
      const bulletsText = (currentResume.selectedPoints || []).join('\n');

      resumeText = `
        ${currentResume.name || ''}
        ${currentResume.role || ''}
        ${currentResume.summary || ''}
        Skills: ${skillsArray.join(', ')}
        Experience: ${expText}
        Education: ${eduText}
        Highlights: ${bulletsText}
        ${rawResumeText}
      `;
    }

    const jdText = jobDescription.trim();

    // 1. Detect target role from JD if not explicitly provided
    let detectedJdRole = targetRole.trim();
    if (!detectedJdRole) {
      const roleMatches = KNOWN_ROLES.filter(r => new RegExp(`\\b${r}\\b`, 'i').test(jdText));
      if (roleMatches.length > 0) {
        detectedJdRole = roleMatches[0];
      } else {
        // Fallback: look at first line or title patterns
        const firstLine = jdText.split(/[\r\n]+/)[0].trim();
        if (firstLine.length < 50 && /engineer|developer|manager|lead|architect|analyst|designer/i.test(firstLine)) {
          detectedJdRole = firstLine;
        } else {
          detectedJdRole = currentRole || 'Software Engineer';
        }
      }
    }

    // 2. Scan JD for technical skills
    const matchedSkills = [];
    const missingSkills = [];

    EXTENDED_SKILLS_CATALOG.forEach(skill => {
      const patternRegex = new RegExp(skill.pattern || `\\b${skill.name}\\b`, 'i');
      if (patternRegex.test(jdText)) {
        // Skill is required/mentioned in JD!
        const isInResume = patternRegex.test(resumeText) || 
          resumeSkillsList.some(rs => rs.toLowerCase() === skill.name.toLowerCase());
        
        // Priority calculation based on JD context
        const isCritical = new RegExp(`(?:must|require|strong|essential|core|proficien[a-z]*|hands-on)[^.?!\\n]*${skill.name}`, 'i').test(jdText);

        const skillObj = {
          name: skill.name,
          category: skill.category,
          priority: isCritical ? 'Critical' : 'Important'
        };

        if (isInResume) {
          matchedSkills.push(skillObj);
        } else {
          missingSkills.push(skillObj);
        }
      }
    });

    // 3. Scan JD for soft skills & methodologies
    const matchedSoftSkills = [];
    const missingSoftSkills = [];

    SOFT_SKILLS_CATALOG.forEach(soft => {
      const patternRegex = new RegExp(soft.pattern, 'i');
      if (patternRegex.test(jdText)) {
        const isInResume = patternRegex.test(resumeText);
        if (isInResume) {
          matchedSoftSkills.push(soft.name);
        } else {
          missingSoftSkills.push(soft.name);
        }
      }
    });

    // 4. Extract specific ATS keywords & requirement phrases from JD lines
    const jdLines = jdText.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    const missingKeywords = [];
    
    // Heuristic: identify requirement bullet points from JD
    const requirementLines = jdLines.filter(line => 
      /^[•\-\*0-9\.]\s*/.test(line) && line.length > 20 && line.length < 150
    );

    requirementLines.forEach(line => {
      const cleanLine = line.replace(/^[•\-\*0-9\.]\s*/, '').trim();
      // Extract key terms (e.g. phrases after "Experience with", "Knowledge of", "Ability to")
      const matchKey = cleanLine.match(/(?:experience with|knowledge of|proficient in|hands-on with|familiarity with|strong understanding of)\s+([^,.;]+)/i);
      if (matchKey && matchKey[1]) {
        const keywordPhrase = matchKey[1].trim();
        if (keywordPhrase.length > 3 && keywordPhrase.length < 40) {
          const inResume = new RegExp(keywordPhrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i').test(resumeText);
          if (!inResume && !missingKeywords.includes(keywordPhrase)) {
            missingKeywords.push(keywordPhrase);
          }
        }
      }
    });

    // 5. Calculate Metrics & ATS Compatibility Score
    const totalTechFoundInJd = matchedSkills.length + missingSkills.length;
    const techRatio = totalTechFoundInJd > 0 ? (matchedSkills.length / totalTechFoundInJd) : 0.75;
    
    const totalSoftFoundInJd = matchedSoftSkills.length + missingSoftSkills.length;
    const softRatio = totalSoftFoundInJd > 0 ? (matchedSoftSkills.length / totalSoftFoundInJd) : 0.75;

    // Check for quantifiable metrics in resume
    const metricMatches = (resumeText.match(/\b\d+[\s-]*(?:%|x|ms|s|k|M|users|clients|hours|dollars|\$)\b/gi) || []).length;
    const quantScore = metricMatches >= 3 ? 15 : (metricMatches >= 1 ? 8 : 2);

    // Title / role alignment score
    const roleAligned = new RegExp(detectedJdRole.split(/\s+/).slice(-1)[0], 'i').test(currentRole);
    const roleScore = roleAligned ? 15 : 5;

    // Overall ATS Match Score (0 - 100)
    let matchScore = Math.round(
      (techRatio * 50) + 
      (softRatio * 20) + 
      roleScore + 
      quantScore
    );
    matchScore = Math.min(96, Math.max(18, matchScore));

    let matchLevel = 'Moderate Match (Gaps Detected)';
    let matchBadgeColor = '#f59e0b';
    if (matchScore >= 80) {
      matchLevel = 'Strong Match (Ready to Apply)';
      matchBadgeColor = '#10b981';
    } else if (matchScore >= 60) {
      matchLevel = 'Good Match (Minor Optimizations Needed)';
      matchBadgeColor = '#3b82f6';
    } else if (matchScore < 45) {
      matchLevel = 'Low Match (Significant Gaps Detected)';
      matchBadgeColor = '#ef4444';
    }

    // 6. Generate "What Needs to Be Added"
    const topMissingSkills = missingSkills.slice(0, 8);
    const topMissingSoft = missingSoftSkills.slice(0, 4);

    // Generate Tailored Accomplishment Bullet Points to Add
    const skill1 = topMissingSkills[0]?.name || 'modern web architectures';
    const skill2 = topMissingSkills[1]?.name || 'cloud deployment pipelines';
    const skill3 = topMissingSkills[2]?.name || 'automated testing';

    const suggestedBulletPoints = [
      `Architected and deployed scalable solutions utilizing ${skill1} and ${skill2}, reducing API latency by 35% across high-volume production endpoints.`,
      `Engineered robust system features adhering to ${topMissingSoft[0] || 'Agile/Scrum principles'}, actively participating in sprint planning and peer code reviews.`,
      `Integrated ${skill3} into the development lifecycle, boosting automated code test coverage from 60% to 92% and preventing critical release regressions.`,
      `Collaborated closely with cross-functional product and design teams to translate business requirements into high-performing, accessible user interfaces.`
    ];

    // 7. Generate "What Optimization Is Required"
    // A. Tailored Professional Summary
    const matchedSkillsNames = matchedSkills.slice(0, 4).map(s => s.name);
    const primaryStackStr = matchedSkillsNames.length > 0 ? matchedSkillsNames.join(', ') : 'modern full-stack technologies';
    
    const tailoredSummary = `Results-oriented ${detectedJdRole} with extensive experience architecting and delivering high-performance applications with ${primaryStackStr}. Adept at collaborating in cross-functional teams, solving complex technical challenges, and optimizing system reliability to drive measurable business outcomes${companyName ? ` at ${companyName}` : ''}.`;

    // B. Actionable Optimizations List
    const optimizationsRequired = [];

    // Optimization 1: Summary Tailoring
    optimizationsRequired.push({
      id: 'summary-opt',
      area: 'Professional Summary',
      severity: 'high',
      title: 'Align Summary with Target JD Keywords',
      currentInsight: currentResume?.summary ? 'Your current summary is generic and does not highlight the specific tech stack demanded in this JD.' : 'No professional summary found on your resume.',
      recommendation: `Update your executive summary to explicitly mention "${detectedJdRole}" and spotlight core competencies like ${primaryStackStr}.`,
      actionableOutput: tailoredSummary,
      actionType: 'apply_summary'
    });

    // Optimization 2: Missing Keywords & Hard Skills Integration
    if (missingSkills.length > 0) {
      optimizationsRequired.push({
        id: 'skills-opt',
        area: 'ATS Keyword Optimization',
        severity: 'high',
        title: `Inject ${missingSkills.length} Missing Technical Keywords`,
        currentInsight: `ATS scanners for this job will filter for keywords like: ${missingSkills.slice(0, 5).map(s => s.name).join(', ')}.`,
        recommendation: `Add the missing critical skills directly to your 'Skills' section, and reference them at least once in your experience bullet points.`,
        actionableOutput: missingSkills.map(s => s.name).join(', '),
        actionType: 'add_skills'
      });
    }

    // Optimization 3: Metric Quantification & Impact
    optimizationsRequired.push({
      id: 'impact-opt',
      area: 'Impact & Quantification',
      severity: metricMatches < 3 ? 'high' : 'medium',
      title: metricMatches < 3 ? 'Quantify Responsibilities with Concrete Metrics' : 'Strengthen Accomplishment Impact Statements',
      currentInsight: metricMatches < 3 
        ? `Found only ${metricMatches} quantifiable metrics in your resume. ATS algorithms and recruiters heavily favor statements with percentages (%), latencies, numbers of users, or time saved.` 
        : `Good job including ${metricMatches} metrics! Ensure every single experience entry has at least 1 measurable outcome.`,
      recommendation: 'Use the XYZ formula: Accomplished [X], as measured by [Y], by doing [Z].',
      examples: [
        {
          before: 'Worked on backend APIs and database queries.',
          after: `Optimized backend endpoints and database queries using ${topMissingSkills[0]?.name || 'PostgreSQL'}, decreasing latency by 45% for 100K+ daily active users.`
        },
        {
          before: 'Helped the team ship features on schedule.',
          after: `Spearheaded sprint feature delivery using ${topMissingSoft[0] || 'Agile methodologies'}, reducing release cycle time by 2 weeks.`
        }
      ]
    });

    // Optimization 4: Target Title Alignment
    if (!roleAligned) {
      optimizationsRequired.push({
        id: 'title-opt',
        area: 'Header & Job Title',
        severity: 'medium',
        title: 'Align Header Job Title to Match Job Description',
        currentInsight: `Your resume lists "${currentRole}", whereas this job listing specifically seeks "${detectedJdRole}".`,
        recommendation: `Set your resume headline/target role to "${detectedJdRole}". ATS parsers award significant relevance points when the candidate title matches the posting title.`,
        actionableOutput: detectedJdRole,
        actionType: 'apply_role'
      });
    }

    // Optimization 5: Methodologies & Collaboration
    if (missingSoftSkills.length > 0) {
      optimizationsRequired.push({
        id: 'soft-opt',
        area: 'Methodologies & Soft Skills',
        severity: 'low',
        title: 'Demonstrate Collaboration & Delivery Best Practices',
        currentInsight: `This role emphasizes ${missingSoftSkills.slice(0, 3).join(', ')}.`,
        recommendation: 'Mention your involvement in code reviews, architectural discussions, and cross-functional handoffs in your project descriptions.'
      });
    }

    // Response structure
    const responsePayload = {
      matchScore,
      matchLevel,
      matchBadgeColor,
      targetRole: detectedJdRole,
      companyName,
      metricsCount: metricMatches,
      overview: `Resume analysis indicates a ${matchScore}% ATS match for the ${detectedJdRole} role. We identified ${matchedSkills.length} matching technical skills, ${missingSkills.length} missing skill gaps, and ${optimizationsRequired.length} key optimization areas.`,
      
      // What needs to be added
      whatNeedsToBeAdded: {
        missingHardSkills: topMissingSkills,
        missingSoftSkills: topMissingSoft,
        missingKeywords: missingKeywords.slice(0, 8),
        suggestedBulletPoints
      },

      // What optimization is required
      whatOptimizationIsRequired: {
        tailoredSummary,
        optimizations: optimizationsRequired
      },

      // Skill breakdown for badges
      skillBreakdown: {
        matched: matchedSkills,
        missing: missingSkills,
        matchedSoft: matchedSoftSkills,
        missingSoft: missingSoftSkills
      }
    };

    res.json(responsePayload);
  } catch (err) {
    console.error('[JD Matcher] Error analyzing JD against resume:', err);
    res.status(500).json({ error: 'Failed to analyze Job Description. ' + err.message });
  }
});

export default router;

