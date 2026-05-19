import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
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
      const allTextParts = [];

      // Step 1: Find and decompress FlateDecode streams
      // PDF streams are between "stream\r\n" (or "stream\n") and "\r\nendstream" (or "\nendstream")
      let pos = 0;
      const bufStr = buffer.toString('binary');
      
      // Find all stream...endstream pairs
      const streamRegex = /stream[\r\n]+/g;
      let streamMatch;
      while ((streamMatch = streamRegex.exec(bufStr)) !== null) {
        const streamStart = streamMatch.index + streamMatch[0].length;
        const endIdx = bufStr.indexOf('endstream', streamStart);
        if (endIdx === -1) continue;
        
        const streamData = buffer.slice(streamStart, endIdx);
        
        // Try to inflate (FlateDecode) the stream
        let decompressed = null;
        try {
          decompressed = zlib.inflateSync(streamData).toString('utf8');
        } catch (e) {
          // Not compressed or corrupt — try as raw text
          decompressed = streamData.toString('binary');
        }
        
        if (decompressed) {
          const extracted = extractTextFromStream(decompressed);
          if (extracted.trim() && isReadableText(extracted)) {
            allTextParts.push(extracted);
          }
        }
      }
      
      if (allTextParts.length > 0) {
        const fullText = allTextParts.join('\n');
        console.log('[PDF Parser] Extracted text length:', fullText.length, 'chars from', allTextParts.length, 'streams');
        return fullText;
      }

      // Step 2: Fallback — try to extract text from uncompressed content directly
      const rawText = bufStr;
      const fallbackExtracted = extractTextFromStream(rawText);
      if (fallbackExtracted.trim() && isReadableText(fallbackExtracted)) {
        console.log('[PDF Parser] Fallback extraction got', fallbackExtracted.length, 'chars');
        return fallbackExtracted;
      }
      
      console.log('[PDF Parser] Could not extract readable text from PDF');
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
