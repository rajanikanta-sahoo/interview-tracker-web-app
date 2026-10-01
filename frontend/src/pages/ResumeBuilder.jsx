import { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  Info, 
  Plus, 
  X, 
  Briefcase, 
  GraduationCap, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Download, 
  AlertCircle, 
  Check, 
  Trash2,
  FileText,
  Phone,
  Mail,
  Linkedin,
  RefreshCw,
  Target,
  Copy,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

const normalizeSkillString = (s) => {
  if (!s) return '';
  if (typeof s === 'string') return s.trim();
  if (typeof s === 'object' && s.name) return String(s.name).trim();
  return String(s).trim();
};

const normalizeSkillsArray = (skills) => {
  if (!Array.isArray(skills)) return [];
  return skills.map(normalizeSkillString).filter(Boolean);
};

// --- SUB-COMPONENT: ATS GAUGE (Declared at module scope for React 19 / Compiler purity) ---
function ATSGauge({ score }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  let color = '#ef4444'; // Red
  if (score >= 75) color = '#10b981'; // Emerald Green
  else if (score >= 50) color = '#f59e0b'; // Amber

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.75rem', 
      backgroundColor: '#ffffff', 
      padding: '0.5rem 1rem', 
      borderRadius: '12px', 
      border: '1px solid #e2e8f0', 
      boxShadow: 'var(--shadow-sm)',
      margin: '0.5rem 0 1rem 0'
    }}>
      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="30" cy="30" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="5" />
        <circle 
          cx="30" 
          cy="30" 
          r={radius} 
          fill="transparent" 
          stroke={color} 
          strokeWidth="5" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round"
          style={{ 
            transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
          }}
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.05em' }}>AI Optimisation Score</span>
        <span style={{ fontSize: '20px', fontWeight: '800', color: color, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {score}%
          {score >= 75 && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#10b981' }}>(Strong Match)</span>}
          {score < 75 && score >= 50 && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#f59e0b' }}>(Good Match)</span>}
          {score < 50 && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#ef4444' }}>(Gaps Detected)</span>}
        </span>
      </div>
    </div>
  );
}

// --- CLIENT-SIDE JD ANALYZER ENGINE (FALLBACK & INSTANT EVALUATION) ---

const CLIENT_EXTENDED_SKILLS = [
  { name: 'JavaScript', category: 'Language', pattern: '\\b(?:JavaScript|JS|ES6\\+?)\\b' },
  { name: 'TypeScript', category: 'Language', pattern: '\\b(?:TypeScript|TS)\\b' },
  { name: 'Python', category: 'Language', pattern: '\\bPython(?:3)?\\b' },
  { name: 'Java', category: 'Language', pattern: '\\bJava\\b(?!\\s*Script)' },
  { name: 'C++', category: 'Language', pattern: '\\bC\\+\\+\\b' },
  { name: 'C#', category: 'Language', pattern: '\\b(?:C#|\\.NET)\\b' },
  { name: 'Go', category: 'Language', pattern: '\\b(?:Go|Golang)\\b' },
  { name: 'Rust', category: 'Language', pattern: '\\bRust\\b' },
  { name: 'SQL', category: 'Database', pattern: '\\bSQL\\b' },
  { name: 'HTML5', category: 'Frontend', pattern: '\\b(?:HTML5?)\\b' },
  { name: 'CSS3', category: 'Frontend', pattern: '\\b(?:CSS3?)\\b' },
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
  { name: 'Node.js', category: 'Backend', pattern: '\\bNode(?:\\.js)?\\b' },
  { name: 'Express.js', category: 'Backend', pattern: '\\bExpress(?:\\.js)?\\b' },
  { name: 'FastAPI', category: 'Backend', pattern: '\\bFastAPI\\b' },
  { name: 'Django', category: 'Backend', pattern: '\\bDjango\\b' },
  { name: 'Spring Boot', category: 'Backend', pattern: '\\b(?:Spring Boot|Spring Framework)\\b' },
  { name: 'GraphQL', category: 'Backend', pattern: '\\bGraphQL\\b' },
  { name: 'REST APIs', category: 'Backend', pattern: '\\b(?:REST|RESTful(?:\\s+APIs?)?|Web APIs?)\\b' },
  { name: 'Microservices', category: 'Architecture', pattern: '\\b(?:Microservices|Microservice Architecture)\\b' },
  { name: 'PostgreSQL', category: 'Database', pattern: '\\b(?:PostgreSQL|Postgres)\\b' },
  { name: 'MySQL', category: 'Database', pattern: '\\bMySQL\\b' },
  { name: 'MongoDB', category: 'Database', pattern: '\\b(?:MongoDB|Mongo)\\b' },
  { name: 'Redis', category: 'Database', pattern: '\\bRedis\\b' },
  { name: 'Elasticsearch', category: 'Database', pattern: '\\bElasticsearch\\b' },
  { name: 'AWS', category: 'Cloud', pattern: '\\b(?:AWS|Amazon Web Services)\\b' },
  { name: 'Google Cloud (GCP)', category: 'Cloud', pattern: '\\b(?:GCP|Google Cloud(?:\\s+Platform)?)\\b' },
  { name: 'Microsoft Azure', category: 'Cloud', pattern: '\\b(?:Azure|Microsoft Azure)\\b' },
  { name: 'Docker', category: 'DevOps', pattern: '\\bDocker\\b' },
  { name: 'Kubernetes', category: 'DevOps', pattern: '\\b(?:Kubernetes|K8s)\\b' },
  { name: 'Terraform', category: 'DevOps', pattern: '\\bTerraform\\b' },
  { name: 'CI/CD', category: 'DevOps', pattern: '\\b(?:CI/CD|CI-CD|Continuous Integration)\\b' },
  { name: 'GitHub Actions', category: 'DevOps', pattern: '\\bGitHub Actions\\b' },
  { name: 'Jest', category: 'Testing', pattern: '\\bJest\\b' },
  { name: 'Cypress', category: 'Testing', pattern: '\\bCypress\\b' },
  { name: 'Playwright', category: 'Testing', pattern: '\\bPlaywright\\b' },
  { name: 'Unit Testing', category: 'Testing', pattern: '\\b(?:Unit Testing|Unit Tests?)\\b' },
  { name: 'Machine Learning', category: 'AI/Data', pattern: '\\b(?:Machine Learning|ML)\\b' },
  { name: 'LLMs & Generative AI', category: 'AI/Data', pattern: '\\b(?:LLMs?|Generative AI|GenAI)\\b' }
];

const CLIENT_SOFT_SKILLS = [
  { name: 'Agile & Scrum Methodologies', pattern: '\\b(?:Agile|Scrum|Sprint Planning|Kanban)\\b' },
  { name: 'System Design & Architecture', pattern: '\\b(?:System Design|Architecture|Distributed Systems)\\b' },
  { name: 'Cross-functional Collaboration', pattern: '\\b(?:Cross-functional|Collaborat(?:e|ing|ion))\\b' },
  { name: 'Technical Mentorship & Leadership', pattern: '\\b(?:Leadership|Mentor(?:ing|ship)?|Team Lead)\\b' },
  { name: 'Code Reviews & Quality Standards', pattern: '\\b(?:Code Review|Clean Code|Best Practices)\\b' },
  { name: 'Performance Optimization & Scalability', pattern: '\\b(?:Performance Optimiz(?:ation|e)|Low Latency|Scalability)\\b' },
  { name: 'Problem Solving & Analytical Thinking', pattern: '\\b(?:Problem Solving|Analytical Thinking)\\b' }
];

function runClientJDAnalysis(payload, activeResume) {
  const { jobDescription = '', targetRole = '', companyName = '', rawResumeText = '' } = payload;
  const jdText = jobDescription.trim();

  let resumeText = rawResumeText || '';
  let currentRole = activeResume?.role || targetRole || 'Software Professional';
  let resumeSkills = normalizeSkillsArray(activeResume?.skills || []);

  if (activeResume) {
    const expText = (activeResume.experience || []).map(e => `${e.title || ''} ${e.company || ''} ${e.description || ''}`).join(' ');
    const eduText = (activeResume.education || []).map(ed => `${ed.degree || ''} ${ed.institution || ''}`).join(' ');
    const bulletsText = (activeResume.selectedPoints || []).join(' ');
    resumeText = `${activeResume.name || ''} ${activeResume.role || ''} ${activeResume.summary || ''} ${resumeSkills.join(' ')} ${expText} ${eduText} ${bulletsText} ${rawResumeText}`;
  }

  const detectedRole = targetRole || (currentRole || 'Software Engineer');

  const matchedSkills = [];
  const missingSkills = [];

  CLIENT_EXTENDED_SKILLS.forEach(skill => {
    const regex = new RegExp(skill.pattern || `\\b${skill.name}\\b`, 'i');
    if (regex.test(jdText)) {
      const inResume = regex.test(resumeText) || resumeSkills.some(rs => rs.toLowerCase() === skill.name.toLowerCase());
      const isCritical = new RegExp(`(?:must|require|strong|proficien)[^.?!\\n]*${skill.name}`, 'i').test(jdText);
      const skillObj = { name: skill.name, category: skill.category, priority: isCritical ? 'Critical' : 'Important' };
      if (inResume) matchedSkills.push(skillObj);
      else missingSkills.push(skillObj);
    }
  });

  const matchedSoft = [];
  const missingSoft = [];
  CLIENT_SOFT_SKILLS.forEach(soft => {
    const regex = new RegExp(soft.pattern, 'i');
    if (regex.test(jdText)) {
      if (regex.test(resumeText)) matchedSoft.push(soft.name);
      else missingSoft.push(soft.name);
    }
  });

  const totalTech = matchedSkills.length + missingSkills.length;
  const techRatio = totalTech > 0 ? (matchedSkills.length / totalTech) : 0.75;
  const totalSoft = matchedSoft.length + missingSoft.length;
  const softRatio = totalSoft > 0 ? (matchedSoft.length / totalSoft) : 0.75;

  const metricMatches = (resumeText.match(/\\b\\d+[\\s-]*(?:%|x|ms|s|k|M|users|clients|hours|dollars|\\$)\\b/gi) || []).length;
  const quantScore = metricMatches >= 3 ? 15 : (metricMatches >= 1 ? 8 : 2);
  const roleScore = 15;

  let matchScore = Math.min(96, Math.max(20, Math.round((techRatio * 50) + (softRatio * 20) + roleScore + quantScore)));
  let matchLevel = 'Good Match (Minor Optimizations Needed)';
  let matchBadgeColor = '#3b82f6';
  if (matchScore >= 80) {
    matchLevel = 'Strong Match (Ready to Apply)';
    matchBadgeColor = '#10b981';
  } else if (matchScore < 60 && matchScore >= 45) {
    matchLevel = 'Moderate Match (Gaps Detected)';
    matchBadgeColor = '#f59e0b';
  } else if (matchScore < 45) {
    matchLevel = 'Low Match (Significant Gaps Detected)';
    matchBadgeColor = '#ef4444';
  }

  const topMissingSkills = missingSkills.slice(0, 8);
  const topMissingSoft = missingSoft.slice(0, 4);

  const skill1 = topMissingSkills[0]?.name || 'modern web architectures';
  const skill2 = topMissingSkills[1]?.name || 'cloud deployment pipelines';
  const skill3 = topMissingSkills[2]?.name || 'automated testing';

  const suggestedBulletPoints = [
    `Architected and deployed scalable solutions utilizing ${skill1} and ${skill2}, reducing API latency by 35% across high-volume production endpoints.`,
    `Engineered robust system features adhering to ${topMissingSoft[0] || 'Agile/Scrum principles'}, actively participating in sprint planning and peer code reviews.`,
    `Integrated ${skill3} into the development lifecycle, boosting automated code test coverage from 60% to 92% and preventing critical release regressions.`,
    `Collaborated closely with cross-functional product and design teams to translate business requirements into high-performing, accessible user interfaces.`
  ];

  const matchedNames = matchedSkills.slice(0, 4).map(s => s.name);
  const primaryStack = matchedNames.length > 0 ? matchedNames.join(', ') : 'modern tech stacks';
  const tailoredSummary = `Results-oriented ${detectedRole} with extensive experience architecting and delivering high-performance applications with ${primaryStack}. Adept at collaborating in cross-functional teams, solving complex technical challenges, and optimizing system reliability to drive measurable business outcomes${companyName ? ` at ${companyName}` : ''}.`;

  const optimizationsRequired = [
    {
      id: 'summary-opt',
      area: 'Professional Summary',
      severity: 'high',
      title: 'Align Summary with Target JD Keywords',
      currentInsight: activeResume?.summary ? 'Your current summary can be sharpened to highlight the exact stack in this JD.' : 'No professional summary found on your resume.',
      recommendation: `Update your executive summary to explicitly mention "${detectedRole}" and spotlight competencies like ${primaryStack}.`,
      actionableOutput: tailoredSummary,
      actionType: 'apply_summary'
    },
    {
      id: 'skills-opt',
      area: 'ATS Keyword Optimization',
      severity: 'high',
      title: `Inject ${missingSkills.length} Missing Technical Keywords`,
      currentInsight: `ATS scanners for this job will filter for keywords like: ${missingSkills.slice(0, 5).map(s => s.name).join(', ')}.`,
      recommendation: 'Add the missing critical skills directly to your Skills section and reference them in experience bullets.',
      actionableOutput: missingSkills.map(s => s.name).join(', '),
      actionType: 'add_skills'
    },
    {
      id: 'impact-opt',
      area: 'Impact & Quantification',
      severity: metricMatches < 3 ? 'high' : 'medium',
      title: metricMatches < 3 ? 'Quantify Responsibilities with Concrete Metrics' : 'Strengthen Accomplishment Impact Statements',
      currentInsight: `Found ${metricMatches} quantifiable metrics in your resume. Recruiters favor statements with percentages, latencies, or business impact metrics.`,
      recommendation: 'Use the XYZ formula: Accomplished [X], as measured by [Y], by doing [Z].',
      examples: [
        {
          before: 'Worked on backend APIs and database queries.',
          after: `Optimized backend endpoints and database queries using ${topMissingSkills[0]?.name || 'PostgreSQL'}, decreasing latency by 45% for 100K+ daily active users.`
        }
      ]
    }
  ];

  return {
    matchScore,
    matchLevel,
    matchBadgeColor,
    targetRole: detectedRole,
    companyName,
    metricsCount: metricMatches,
    overview: `Resume analysis indicates a ${matchScore}% ATS match for the ${detectedRole} role. We identified ${matchedSkills.length} matching technical skills, ${missingSkills.length} missing skill gaps, and ${optimizationsRequired.length} key optimization areas.`,
    whatNeedsToBeAdded: {
      missingHardSkills: topMissingSkills,
      missingSoftSkills: topMissingSoft,
      missingKeywords: ['scalable architectures', 'production releases', 'code maintainability'],
      suggestedBulletPoints
    },
    whatOptimizationIsRequired: {
      tailoredSummary,
      optimizations: optimizationsRequired
    },
    skillBreakdown: {
      matched: matchedSkills,
      missing: missingSkills,
      matchedSoft: matchedSoft,
      missingSoft: missingSoft
    }
  };
}

function ResumeBuilder() {
  const [activeTab, setActiveTab] = useState('resumes'); // 'resumes' or 'coverLetters'
  const [profile, setProfile] = useState({ name: '', skills: [] });
  
  // Resumes State
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const previewRef = useRef();

  // Cover Letters State
  const [coverLetters, setCoverLetters] = useState([]);
  const [currentCoverLetter, setCurrentCoverLetter] = useState(null);
  const clPreviewRef = useRef();

  // New UI & Premium UX States
  const [headerCollapsed, setHeaderCollapsed] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [clearConfirm, setClearConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // id of document being deleted
  
  // Custom Skills Tag State
  const [skillInput, setSkillInput] = useState('');

  // JD Matcher & Optimizer States
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jdInput, setJdInput] = useState({ role: '', company: '', text: '' });
  const [jdResumeSource, setJdResumeSource] = useState('saved'); // 'saved', 'upload', 'paste'
  const [pastedResumeText, setPastedResumeText] = useState('');
  const [jdUploadedResume, setJdUploadedResume] = useState(null);
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);
  const [jdAnalysisResult, setJdAnalysisResult] = useState(null);
  const [jdAnalysisFilter, setJdAnalysisFilter] = useState('all'); // 'all', 'needsAdded', 'optimizations', 'matched'
  const [copiedItem, setCopiedItem] = useState(null);
  const [addedSkillsMap, setAddedSkillsMap] = useState({});
  const jdFileInputRef = useRef(null);

  // Toast Timer Ref
  const toastTimeoutRef = useRef(null);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [prof, loadedResumes, loadedCLs] = await Promise.all([
          api.fetchProfile().catch(() => ({})),
          api.getResumes().catch(() => []),
          api.getCoverLetters().catch(() => [])
        ]);
        if (!ignore) {
          setProfile(prof || {});
          setResumes(loadedResumes || []);
          setCoverLetters(loadedCLs || []);

          // Check if navigated from Job Search 1-click Match Fit
          const savedJdPayload = sessionStorage.getItem('jd_match_payload');
          if (savedJdPayload) {
            try {
              const parsed = JSON.parse(savedJdPayload);
              setJdInput({
                role: parsed.targetRole || '',
                company: parsed.companyName || '',
                text: parsed.jobDescription || ''
              });
              setActiveTab('jdMatch');
              sessionStorage.removeItem('jd_match_payload');
              showToast(`Loaded "${parsed.targetRole}" at ${parsed.companyName} for Fit Analysis!`, 'info');
            } catch (e) {
              console.warn("Could not parse jd_match_payload", e);
            }
          }
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    }
    init();
    return () => {
      ignore = true;
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // --- RESUME UPLOAD LOGIC ---

  const handleResumeUpload = async (file) => {
    if (!file) return;
    
    // Check file type
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'txt', 'docx'].includes(ext)) {
      showToast("Only PDF, TXT and DOCX files are allowed!", "error");
      return;
    }

    setIsUploading(true);
    try {
      const parsedResume = await api.uploadResumeAndParse(file);
      if (parsedResume && parsedResume.id) {
        // Ensure structure exists
        const formattedResume = {
          ...parsedResume,
          phone: parsedResume.phone || '',
          linkedin: parsedResume.linkedin || '',
          experience: parsedResume.experience || [],
          education: parsedResume.education || [],
          skills: normalizeSkillsArray(parsedResume.skills || []),
          selectedPoints: parsedResume.selectedPoints || []
        };

        // Refresh the resumes list
        const updatedResumes = await api.getResumes();
        setResumes(updatedResumes);
        // Select the newly uploaded and parsed resume
        setCurrentResume(formattedResume);
        setSuggestions(null);
        showToast("Resume successfully uploaded and parsed!", "success");
      } else {
        showToast("Upload completed, but failed to parse resume details.", "error");
      }
    } catch (err) {
      console.error("Resume upload error:", err);
      showToast("An error occurred while uploading and parsing your resume.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleResumeUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleResumeUpload(e.target.files[0]);
    }
  };

  // --- RESUME ACTIONS ---

  const createNewResume = () => {
    const newRes = {
      title: `Resume ${resumes.length + 1}`,
      role: '',
      name: profile.name || '',
      email: '',
      phone: '',
      linkedin: '',
      summary: '',
      experience: [],
      education: [],
      skills: normalizeSkillsArray(profile.skills || []),
      selectedPoints: []
    };
    setCurrentResume(newRes);
    setSuggestions(null);
    setClearConfirm(false);
    showToast("Created a new resume draft!", "success");
  };

  const saveCurrentResume = async () => {
    if (!currentResume) return;
    try {
      await api.saveResume(currentResume);
      const updated = await api.getResumes();
      setResumes(updated);
      // Update selected resume with the persisted one to ensure id matches
      const saved = updated.find(r => r.title === currentResume.title) || currentResume;
      setCurrentResume(saved);
      showToast("Resume saved successfully!", "success");
    } catch (err) {
      console.error("Error saving resume:", err);
      showToast("Failed to save resume.", "error");
    }
  };

  const startClearResumeFields = () => {
    setClearConfirm(true);
  };

  const confirmClearResumeFields = () => {
    if (!currentResume) return;
    setCurrentResume({
      ...currentResume,
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
    });
    setSuggestions(null);
    setClearConfirm(false);
    showToast("Resume fields cleared.", "info");
  };

  const startDeleteResume = (id, e) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const executeDeleteResume = async (id) => {
    try {
      await api.deleteResume(id);
      setResumes(resumes.filter(r => r.id !== id));
      if (currentResume && currentResume.id === id) {
        setCurrentResume(null);
        setSuggestions(null);
      }
      setDeleteConfirmId(null);
      showToast("Resume deleted.", "success");
    } catch (err) {
      console.error("Error deleting resume:", err);
      showToast("Failed to delete resume.", "error");
    }
  };

  const generateSuggestions = async () => {
    if (!currentResume || !currentResume.role) {
      showToast("Please enter a target role first.", "error");
      return;
    }
    setIsGenerating(true);
    try {
      const activeSkills = normalizeSkillsArray(currentResume.skills || []);
      const fallbackSkills = normalizeSkillsArray(profile.skills || []);
      const skillsToSend = activeSkills.length > 0 ? activeSkills : fallbackSkills;
      const data = await api.generateSuggestions(currentResume.role, skillsToSend);
      setSuggestions(data);
      showToast("AI Optimization recommendations loaded!", "success");
    } catch (err) {
      console.error("Error generating optimization suggestions:", err);
      showToast("Failed to generate AI recommendations.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePoint = (point) => {
    const points = currentResume.selectedPoints || [];
    if (points.includes(point)) {
      setCurrentResume({ ...currentResume, selectedPoints: points.filter(p => p !== point) });
    } else {
      setCurrentResume({ ...currentResume, selectedPoints: [...points, point] });
    }
  };

  const downloadResumePDF = () => {
    showToast("Print dialog opened — save as PDF", "success");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // --- SKILL TAG INPUT ---

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const trimmed = skillInput.trim();
      if (!trimmed) return;
      
      const currentSkills = normalizeSkillsArray(currentResume.skills || []);
      if (currentSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
        showToast("Skill already exists in this resume.", "info");
        return;
      }

      setCurrentResume({
        ...currentResume,
        skills: [...currentSkills, trimmed]
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const currentSkills = normalizeSkillsArray(currentResume.skills || []);
    const target = normalizeSkillString(skillToRemove);
    setCurrentResume({
      ...currentResume,
      skills: currentSkills.filter(s => s !== target)
    });
  };

  // --- DYNAMIC SECTIONS: EXPERIENCE ---

  const handleAddExperience = () => {
    const exp = currentResume.experience || [];
    const newItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      company: '',
      title: '',
      duration: '',
      description: ''
    };
    setCurrentResume({
      ...currentResume,
      experience: [...exp, newItem]
    });
  };

  const handleUpdateExperience = (id, field, value) => {
    const exp = currentResume.experience || [];
    const updated = exp.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setCurrentResume({
      ...currentResume,
      experience: updated
    });
  };

  const handleRemoveExperience = (id) => {
    const exp = currentResume.experience || [];
    setCurrentResume({
      ...currentResume,
      experience: exp.filter(item => item.id !== id)
    });
  };

  // --- DYNAMIC SECTIONS: EDUCATION ---

  const handleAddEducation = () => {
    const edu = currentResume.education || [];
    const newItem = {
      id: `edu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      institution: '',
      degree: '',
      year: ''
    };
    setCurrentResume({
      ...currentResume,
      education: [...edu, newItem]
    });
  };

  const handleUpdateEducation = (id, field, value) => {
    const edu = currentResume.education || [];
    const updated = edu.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setCurrentResume({
      ...currentResume,
      education: updated
    });
  };

  const handleRemoveEducation = (id) => {
    const edu = currentResume.education || [];
    setCurrentResume({
      ...currentResume,
      education: edu.filter(item => item.id !== id)
    });
  };


  // --- COVER LETTER ACTIONS ---

  const createNewCoverLetter = () => {
    const newCL = {
      title: `Cover Letter ${coverLetters.length + 1}`,
      role: '',
      company: '',
      content: ''
    };
    setCurrentCoverLetter(newCL);
    setClearConfirm(false);
    showToast("Created a new cover letter draft!", "success");
  };

  const saveCurrentCoverLetter = async () => {
    if (!currentCoverLetter) return;
    try {
      await api.saveCoverLetter(currentCoverLetter);
      const updated = await api.getCoverLetters();
      setCoverLetters(updated);
      const saved = updated.find(c => c.title === currentCoverLetter.title) || currentCoverLetter;
      setCurrentCoverLetter(saved);
      showToast("Cover Letter saved successfully!", "success");
    } catch (err) {
      console.error("Error saving cover letter:", err);
      showToast("Failed to save cover letter.", "error");
    }
  };

  const startDeleteCoverLetter = (id, e) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const executeDeleteCoverLetter = async (id) => {
    try {
      await api.deleteCoverLetter(id);
      setCoverLetters(coverLetters.filter(c => c.id !== id));
      if (currentCoverLetter && currentCoverLetter.id === id) {
        setCurrentCoverLetter(null);
      }
      setDeleteConfirmId(null);
      showToast("Cover letter deleted.", "success");
    } catch (err) {
      console.error("Error deleting cover letter:", err);
      showToast("Failed to delete cover letter.", "error");
    }
  };

  const generateCoverLetterText = async () => {
    if (!currentCoverLetter || !currentCoverLetter.role) {
      showToast("Please enter a target role first.", "error");
      return;
    }
    setIsGenerating(true);
    try {
      const data = await api.generateCoverLetter(currentCoverLetter.role, profile.name || currentResume?.name || 'Applicant', currentCoverLetter.company);
      setCurrentCoverLetter({ ...currentCoverLetter, content: data.text });
      showToast("AI Cover Letter generated successfully!", "success");
    } catch (err) {
      console.error("Error generating cover letter:", err);
      showToast("Failed to generate cover letter.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCoverLetterPDF = () => {
    showToast("Print dialog opened — save as PDF", "success");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Cover Letter word counters
  const clContent = currentCoverLetter?.content || '';
  const clWordCount = clContent.trim().split(/\s+/).filter(Boolean).length;
  const clReadTime = Math.max(1, Math.ceil(clWordCount / 200));

  // --- JD MATCHER & OPTIMIZER HANDLERS ---

  const SAMPLE_JDS = {
    frontend: {
      role: 'Senior Frontend Engineer',
      company: 'TechFlow Systems',
      text: `About the Role:
We are looking for a Senior Frontend Engineer to design and build high-performance web applications and design systems.

Requirements & Core Qualifications:
• 4+ years of professional development experience building scalable frontend applications with React and TypeScript.
• Expertise in modern web technologies including Next.js, Tailwind CSS, Redux Toolkit, and Vite.
• Proven track record with automated testing using Jest, Cypress, or Playwright.
• In-depth knowledge of Web Accessibility (a11y) standards, Core Web Vitals, and responsive UI optimization.
• Familiarity with Docker, CI/CD pipelines, and GitHub Actions for continuous deployment.
• Experience consuming RESTful APIs, GraphQL endpoints, and WebSockets.
• Excellent cross-functional collaboration and communication skills within an Agile/Scrum team.`
    },
    fullstack: {
      role: 'Full Stack Engineer',
      company: 'CloudSphere Labs',
      text: `About the Role:
We are looking for a Full Stack Engineer to architect and build scalable cloud microservices, developer dashboards, and reliable data pipelines.

Key Responsibilities & Qualifications:
• 3+ years experience building full stack systems with React, Node.js, Express, and TypeScript.
• Strong knowledge of relational and NoSQL databases such as PostgreSQL, MongoDB, and Redis caching.
• Experience designing and deploying microservices architecture on AWS or Google Cloud (GCP).
• Solid understanding of containerization with Docker, Kubernetes, and automated CI/CD workflows.
• Hands-on experience with unit testing, integration testing, and performance profiling to achieve low-latency SLAs.
• Passion for code quality, conducting peer code reviews, and collaborating in sprint planning cycles.`
    }
  };

  const handleLoadSampleJD = (type) => {
    const sample = SAMPLE_JDS[type] || SAMPLE_JDS.frontend;
    setJdInput({
      role: sample.role,
      company: sample.company,
      text: sample.text
    });
    showToast(`Loaded sample "${sample.role}" Job Description!`, 'info');
  };

  const handleJDFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'txt', 'docx'].includes(ext)) {
      showToast("Only PDF, TXT and DOCX files are allowed!", "error");
      return;
    }

    try {
      showToast("Parsing uploaded resume for JD matching...", "info");
      const parsed = await api.uploadResumeAndParse(file);
      if (parsed) {
        setJdUploadedResume(parsed);
        showToast(`Resume "${file.name}" uploaded & parsed!`, "success");
      }
    } catch (err) {
      console.error("Error uploading resume for JD matcher:", err);
      showToast("Failed to upload and parse resume file.", "error");
    }
  };

  // Determine active resume for JD match
  const getActiveJDResume = () => {
    if (jdResumeSource === 'upload' && jdUploadedResume) {
      return jdUploadedResume;
    }
    if (selectedResumeId) {
      const found = resumes.find(r => r.id === selectedResumeId);
      if (found) return found;
    }
    if (currentResume) return currentResume;
    if (resumes.length > 0) return resumes[0];
    return null;
  };

  const handleAnalyzeJD = async () => {
    if (!jdInput.text || jdInput.text.trim().length < 20) {
      showToast("Please provide a Job Description with at least 20 characters.", "error");
      return;
    }

    const activeResume = getActiveJDResume();

    if (jdResumeSource !== 'paste' && !activeResume) {
      showToast("Please select or upload a resume to match against the JD.", "error");
      return;
    }

    if (jdResumeSource === 'paste' && (!pastedResumeText || pastedResumeText.trim().length < 20)) {
      showToast("Please paste your resume text (at least 20 characters).", "error");
      return;
    }

    setIsAnalyzingJD(true);
    setJdAnalysisResult(null);

    const payload = {
      jobDescription: jdInput.text.trim(),
      targetRole: jdInput.role.trim(),
      companyName: jdInput.company.trim(),
      resumeId: activeResume?.id,
      resumeData: jdResumeSource === 'paste' ? null : activeResume,
      rawResumeText: jdResumeSource === 'paste' ? pastedResumeText : ''
    };

    try {
      const result = await api.analyzeJDMatch(payload);
      setJdAnalysisResult(result);
      setAddedSkillsMap({});
      showToast("Job Description analysis complete! Review your tailored insights.", "success");
    } catch (err) {
      console.warn("Backend analysis failed, running comprehensive local analysis:", err);
      // Client-side fallback analyzer
      const fallbackResult = runClientJDAnalysis(payload, activeResume);
      setJdAnalysisResult(fallbackResult);
      setAddedSkillsMap({});
      showToast("Analyzed using local AI engine!", "success");
    } finally {
      setIsAnalyzingJD(false);
    }
  };

  const handleAddMissingSkillToResume = async (skillObj) => {
    const activeResume = getActiveJDResume();
    if (!activeResume) {
      showToast("No active resume selected to update.", "error");
      return;
    }

    const skillName = typeof skillObj === 'string' ? skillObj : skillObj.name;
    const existingSkills = normalizeSkillsArray(activeResume.skills || []);
    
    if (existingSkills.some(s => s.toLowerCase() === skillName.toLowerCase())) {
      showToast(`"${skillName}" is already on this resume.`, "info");
      setAddedSkillsMap(prev => ({ ...prev, [skillName]: true }));
      return;
    }

    const updatedSkills = [...existingSkills, skillName];
    const updatedResume = { ...activeResume, skills: updatedSkills };

    try {
      await api.saveResume(updatedResume);
      const updatedList = await api.getResumes();
      setResumes(updatedList);
      if (currentResume && currentResume.id === activeResume.id) {
        setCurrentResume(updatedResume);
      }
      setAddedSkillsMap(prev => ({ ...prev, [skillName]: true }));
      showToast(`Added "${skillName}" to ${activeResume.title}!`, "success");
    } catch (err) {
      console.error("Error adding skill to resume:", err);
      showToast(`Failed to add skill: ${err.message}`, "error");
    }
  };

  const handleAddAllMissingSkills = async () => {
    const activeResume = getActiveJDResume();
    if (!activeResume || !jdAnalysisResult?.whatNeedsToBeAdded?.missingHardSkills) return;

    const missing = jdAnalysisResult.whatNeedsToBeAdded.missingHardSkills;
    const existingSkills = normalizeSkillsArray(activeResume.skills || []);
    const newSkillsToAdd = [];
    const newMap = { ...addedSkillsMap };

    missing.forEach(m => {
      const name = m.name;
      if (!existingSkills.some(s => s.toLowerCase() === name.toLowerCase()) && !newSkillsToAdd.includes(name)) {
        newSkillsToAdd.push(name);
      }
      newMap[name] = true;
    });

    if (newSkillsToAdd.length === 0) {
      showToast("All missing skills are already present on your resume.", "info");
      return;
    }

    const updatedSkills = [...existingSkills, ...newSkillsToAdd];
    const updatedResume = { ...activeResume, skills: updatedSkills };

    try {
      await api.saveResume(updatedResume);
      const updatedList = await api.getResumes();
      setResumes(updatedList);
      if (currentResume && currentResume.id === activeResume.id) {
        setCurrentResume(updatedResume);
      }
      setAddedSkillsMap(newMap);
      showToast(`Added ${newSkillsToAdd.length} missing skills to ${activeResume.title}!`, "success");
    } catch (err) {
      console.error("Error bulk adding skills:", err);
      showToast("Failed to bulk add skills.", "error");
    }
  };

  const handleApplyTailoredSummary = async (summaryText) => {
    const activeResume = getActiveJDResume();
    if (!activeResume) {
      showToast("No active resume selected to update.", "error");
      return;
    }

    const updatedResume = { ...activeResume, summary: summaryText };

    try {
      await api.saveResume(updatedResume);
      const updatedList = await api.getResumes();
      setResumes(updatedList);
      if (currentResume && currentResume.id === activeResume.id) {
        setCurrentResume(updatedResume);
      }
      showToast(`Tailored summary applied to ${activeResume.title}!`, "success");
    } catch (err) {
      console.error("Error applying summary:", err);
      showToast("Failed to apply summary.", "error");
    }
  };

  const handleApplyTargetRole = async (roleText) => {
    const activeResume = getActiveJDResume();
    if (!activeResume) {
      showToast("No active resume selected to update.", "error");
      return;
    }

    const updatedResume = { ...activeResume, role: roleText };

    try {
      await api.saveResume(updatedResume);
      const updatedList = await api.getResumes();
      setResumes(updatedList);
      if (currentResume && currentResume.id === activeResume.id) {
        setCurrentResume(updatedResume);
      }
      showToast(`Target role set to "${roleText}" on ${activeResume.title}!`, "success");
    } catch (err) {
      console.error("Error applying role:", err);
      showToast("Failed to update role.", "error");
    }
  };

  const handleAddSuggestedBulletToResume = async (bulletText) => {
    const activeResume = getActiveJDResume();
    if (!activeResume) {
      showToast("No active resume selected to update.", "error");
      return;
    }

    const currentPoints = activeResume.selectedPoints || [];
    if (currentPoints.includes(bulletText)) {
      showToast("Bullet point is already in your highlights.", "info");
      return;
    }

    const updatedPoints = [...currentPoints, bulletText];
    const updatedResume = { ...activeResume, selectedPoints: updatedPoints };

    try {
      await api.saveResume(updatedResume);
      const updatedList = await api.getResumes();
      setResumes(updatedList);
      if (currentResume && currentResume.id === activeResume.id) {
        setCurrentResume(updatedResume);
      }
      showToast(`Added bullet point to highlights on ${activeResume.title}!`, "success");
    } catch (err) {
      console.error("Error adding bullet point:", err);
      showToast("Failed to add bullet point.", "error");
    }
  };

  const handleCopyText = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    showToast("Copied to clipboard!", "info");
    setTimeout(() => {
      setCopiedItem(null);
    }, 2500);
  };

  const handleOpenInEditor = (resumeToOpen) => {
    const activeResume = resumeToOpen || getActiveJDResume();
    if (activeResume) {
      setCurrentResume(activeResume);
    }
    setActiveTab('resumes');
    showToast("Opened in Resume Editor.", "info");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh', position: 'relative' }}>
      
      {/* Dynamic Toast Element */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          backgroundColor: toast.type === 'success' ? '#ecfdf5' : toast.type === 'error' ? '#fef2f2' : '#eff6ff',
          border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : toast.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
          color: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#1e3a8a',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <style>{`
            @keyframes slideIn {
              from { transform: translateY(-10px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: '13px', fontWeight: '500' }}>{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: '', type: 'success' })} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              marginLeft: '0.5rem', 
              opacity: 0.7 
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Collapsible Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem', fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>Career Builder</h1>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Design, optimize, and organize your professional job application documents.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              className={`btn btn-outline`} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '12px' }}
              onClick={() => setHeaderCollapsed(!headerCollapsed)}
            >
              <Info size={14} />
              <span>What can I do here?</span>
              {headerCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <div style={{
              display: 'flex', gap: '3px', backgroundColor: '#f1f5f9',
              padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0',
              marginLeft: '0.5rem', boxShadow: 'var(--shadow-xs)'
            }}>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.45rem 1rem', 
                  borderRadius: '9px', 
                  fontSize: '12.5px', 
                  backgroundColor: activeTab === 'resumes' ? '#ffffff' : 'transparent',
                  color: activeTab === 'resumes' ? 'var(--primary)' : '#64748b',
                  fontWeight: activeTab === 'resumes' ? '700' : '600',
                  boxShadow: activeTab === 'resumes' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  border: activeTab === 'resumes' ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid transparent',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }} 
                onClick={() => setActiveTab('resumes')}
              >
                <FileText size={14} style={{ color: activeTab === 'resumes' ? 'var(--primary)' : '#94a3b8' }} />
                Resumes
              </button>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.45rem 1rem', 
                  borderRadius: '9px', 
                  fontSize: '12.5px', 
                  backgroundColor: activeTab === 'coverLetters' ? '#ffffff' : 'transparent',
                  color: activeTab === 'coverLetters' ? 'var(--primary)' : '#64748b',
                  fontWeight: activeTab === 'coverLetters' ? '700' : '600',
                  boxShadow: activeTab === 'coverLetters' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  border: activeTab === 'coverLetters' ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid transparent',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }} 
                onClick={() => setActiveTab('coverLetters')}
              >
                <Mail size={14} style={{ color: activeTab === 'coverLetters' ? 'var(--primary)' : '#94a3b8' }} />
                Cover Letters
              </button>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.45rem 1.1rem', 
                  borderRadius: '9px', 
                  fontSize: '12.5px', 
                  backgroundColor: activeTab === 'jdMatch' ? '#ffffff' : 'transparent',
                  color: activeTab === 'jdMatch' ? '#7c3aed' : '#64748b',
                  fontWeight: activeTab === 'jdMatch' ? '800' : '600',
                  boxShadow: activeTab === 'jdMatch' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  border: activeTab === 'jdMatch' ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }} 
                onClick={() => setActiveTab('jdMatch')}
              >
                <Target size={14} style={{ color: activeTab === 'jdMatch' ? '#7c3aed' : '#94a3b8' }} />
                <span>JD Match & Optimize</span>
                <span style={{
                  fontSize: '9.5px', padding: '0.1rem 0.4rem', borderRadius: '9999px',
                  backgroundColor: activeTab === 'jdMatch' ? '#f3e8ff' : '#e0e7ff',
                  color: activeTab === 'jdMatch' ? '#7c3aed' : 'var(--primary)',
                  fontWeight: '800'
                }}>NEW</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Panel */}
        {!headerCollapsed && (
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            animation: 'slideIn 0.25s ease-out',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={14} style={{ color: 'var(--primary)' }} /> Comprehensive Application Builder Features:
            </p>
            <ul style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '0.5rem 1.5rem', 
              paddingLeft: '1.2rem', 
              fontSize: '12px', 
              color: 'var(--text-muted)' 
            }}>
              <li><strong>JD Match & Optimizer:</strong> Give any Job Description and current resume to discover what need to be added (missing skills, keywords) and what optimizations are required.</li>
              <li><strong>AI Resume Optimization:</strong> Enter target role and get keyword gap analysis & tailored impact bullet points.</li>
              <li><strong>Interactive Resume Editor:</strong> Add education, employment history, contact links, and document-specific skills.</li>
              <li><strong>ATS Matching Score:</strong> Receive real-time visual compatibility analysis on your credentials.</li>
              <li><strong>Cover Letter Generator:</strong> Instantly draft role-tailored outreach letters utilizing core job metrics.</li>
              <li><strong>Print-Ready PDF:</strong> Download A4 standard PDFs using formatted paper preview systems.</li>
            </ul>
          </div>
        )}
      </div>

      {activeTab === 'resumes' && (
        <div style={{ display: 'flex', gap: '1.25rem', flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div className="card" style={{ width: '260px', display: 'flex', flexDirection: 'column', padding: '1rem', flexShrink: 0, gap: '0.75rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem' }} onClick={createNewResume}>
              <Plus size={16} /> New Resume
            </button>
            
            {/* Drag and Drop Resume Uploader */}
            <div 
              style={{ 
                border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '1.25rem 0.75rem',
                textAlign: 'center',
                backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.04)' : 'var(--bg-color)',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                minHeight: '110px'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={20} className="resume-upload-spinner" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>Parsing resume...</span>
                </div>
              ) : (
                <>
                  <UploadCloud size={24} style={{ color: isDragging ? 'var(--primary)' : '#64748b' }} />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-main)' }}>
                    Upload Credentials
                  </span>
                  <span style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.3' }}>
                    Drag & drop PDF, TXT or click to browse
                  </span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf,.txt,.docx" 
                style={{ display: 'none' }} 
              />
            </div>

            {/* List of Resumes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', margin: '0.5rem 0 0.25rem 0', letterSpacing: '0.05em' }}>Saved Resumes</p>
              
              {resumes.map(r => {
                const isConfirming = deleteConfirmId === r.id;
                const isCurrent = currentResume?.id === r.id;

                if (isConfirming) {
                  return (
                    <div 
                      key={r.id} 
                      style={{ 
                        padding: '0.6rem 0.75rem', 
                        borderRadius: '6px', 
                        backgroundColor: '#fef2f2', 
                        border: '1px solid #fee2e2', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        animation: 'slideIn 0.2s ease-out' 
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: '600' }}>Remove document?</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} 
                          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          No
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); executeDeleteResume(r.id); }} 
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={r.id} 
                    onClick={() => {
                      setCurrentResume({
                        ...r,
                        phone: r.phone || '',
                        linkedin: r.linkedin || '',
                        experience: r.experience || [],
                        education: r.education || [],
                        skills: normalizeSkillsArray(r.skills || []),
                        selectedPoints: r.selectedPoints || []
                      });
                      setSuggestions(null);
                      setClearConfirm(false);
                    }} 
                    style={{ 
                      padding: '0.65rem 0.75rem', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      backgroundColor: isCurrent ? '#f0f7ff' : 'var(--surface)', 
                      border: `1px solid ${isCurrent ? '#bfdbfe' : 'var(--border-color)'}`, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    className="sidebar-item"
                  >
                    <span style={{ 
                      fontWeight: isCurrent ? '600' : 'normal', 
                      fontSize: '12.5px', 
                      color: isCurrent ? '#1d4ed8' : 'var(--text-main)',
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      maxWidth: '160px' 
                    }}>
                      {r.title}
                    </span>
                    <button 
                      onClick={(e) => startDeleteResume(r.id, e)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#94a3b8', 
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      className="trash-btn"
                    >
                      <Trash2 size={13} style={{ transition: 'color 0.2s' }} />
                    </button>
                  </div>
                );
              })}

              {resumes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                  <p className="text-muted" style={{ fontSize: '11px' }}>No resumes loaded.</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Workspace Area */}
          {currentResume ? (
            <div style={{ flex: 1, display: 'flex', gap: '1.25rem', overflow: 'hidden', minWidth: 0 }}>
              
              {/* Workspace Editor */}
              <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Header Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '600' }}>Edit Credentials</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={startClearResumeFields}>
                      Clear fields
                    </button>
                    <button className="btn btn-primary" onClick={saveCurrentResume} style={{ gap: '0.35rem' }}>
                      Save changes
                    </button>
                  </div>
                </div>

                {/* Inline Clear Confirmation Banner */}
                {clearConfirm && (
                  <div style={{ 
                    backgroundColor: '#fffbeb', 
                    border: '1px solid #fef3c7', 
                    padding: '0.85rem 1rem', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    animation: 'slideIn 0.2s ease-out'
                  }}>
                    <span style={{ fontSize: '12.5px', color: '#b45309', fontWeight: '500' }}>
                      Are you sure you want to clear all fields in this resume? This cannot be undone.
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.65rem', fontSize: '11px', backgroundColor: 'transparent' }} onClick={() => setClearConfirm(false)}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.25rem 0.65rem', fontSize: '11px' }} onClick={confirmClearResumeFields}>
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Document Details Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>Document Title</label>
                      <input 
                        type="text" 
                        className="input" 
                        value={currentResume.title} 
                        onChange={e => setCurrentResume({...currentResume, title: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>Target Career Role</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          className="input" 
                          placeholder="e.g. Frontend Engineer" 
                          value={currentResume.role} 
                          onChange={e => setCurrentResume({...currentResume, role: e.target.value})} 
                        />
                        <button 
                          className="btn btn-outline" 
                          style={{ gap: '0.3rem', flexShrink: 0 }}
                          onClick={generateSuggestions} 
                          disabled={isGenerating}
                        >
                          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                          {isGenerating ? 'Analyzing...' : 'AI Optimize'}
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ gap: '0.3rem', flexShrink: 0, borderColor: '#c4b5fd', color: '#7c3aed', backgroundColor: '#f5f3ff' }}
                          onClick={() => {
                            if (currentResume?.id) {
                              setSelectedResumeId(currentResume.id);
                            }
                            setActiveTab('jdMatch');
                          }}
                          title="Match this resume against a target Job Description"
                        >
                          <Target size={14} style={{ color: '#7c3aed' }} />
                          Match with JD
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Suggestions Box with circular ATS Gauge */}
                {suggestions && (
                  <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>AI Optimization Suggestions</h4>
                      <ATSGauge score={suggestions.atsScore || 60} />
                    </div>
                    
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Skill Gap Analysis:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {suggestions.techSkills.map(skill => {
                          const resumeSkills = normalizeSkillsArray(currentResume.skills || []);
                          const hasSkill = resumeSkills.some(rs => rs.toLowerCase() === skill.toLowerCase());
                          return (
                            <span 
                              key={skill} 
                              onClick={() => {
                                if (!hasSkill) {
                                  setCurrentResume({
                                    ...currentResume,
                                    skills: [...resumeSkills, skill]
                                  });
                                  showToast(`Added ${skill} to your skills!`, 'success');
                                }
                              }}
                              className="badge" 
                              style={{ 
                                backgroundColor: hasSkill ? '#dcfce7' : '#fee2e2', 
                                color: hasSkill ? '#166534' : '#991b1b',
                                border: `1px solid ${hasSkill ? '#bbf7d0' : '#fecaca'}`,
                                cursor: hasSkill ? 'default' : 'pointer',
                                transition: 'all 0.15s ease',
                                userSelect: 'none'
                              }}
                              title={hasSkill ? 'Already matches' : 'Click to add to resume'}
                            >
                              {hasSkill ? '✓' : '+'} {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Suggested Bullet Points (Select to add):</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {suggestions.keyPoints.map((point, idx) => {
                          const isSelected = (currentResume.selectedPoints || []).includes(point);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => togglePoint(point)}
                              style={{ 
                                display: 'flex', 
                                gap: '0.5rem', 
                                alignItems: 'flex-start',
                                padding: '0.4rem 0.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                                border: `1px solid ${isSelected ? '#bfdbfe' : 'transparent'}`,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                readOnly
                                style={{ marginTop: '0.15rem', cursor: 'pointer' }} 
                              />
                              <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: '1.4' }}>{point}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Information Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>Contact Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Name</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="e.g. Rajani Kanta"
                        value={currentResume.name || ''} 
                        onChange={e => setCurrentResume({...currentResume, name: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Email</label>
                      <input 
                        type="email" 
                        className="input" 
                        placeholder="e.g. rajani@example.com"
                        value={currentResume.email || ''} 
                        onChange={e => setCurrentResume({...currentResume, email: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Phone Number</label>
                      <input 
                        type="tel" 
                        className="input" 
                        placeholder="e.g. +91 9876543210"
                        value={currentResume.phone || ''} 
                        onChange={e => setCurrentResume({...currentResume, phone: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>LinkedIn Profile URL</label>
                      <input 
                        type="url" 
                        className="input" 
                        placeholder="e.g. linkedin.com/in/username"
                        value={currentResume.linkedin || ''} 
                        onChange={e => setCurrentResume({...currentResume, linkedin: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Professional Summary</label>
                    <textarea 
                      className="input" 
                      rows="3" 
                      placeholder="Write a concise description summarizing your key technical skillsets, accomplishments, and career motives..."
                      value={currentResume.summary || ''} 
                      onChange={e => setCurrentResume({...currentResume, summary: e.target.value})}
                    ></textarea>
                  </div>
                </div>

                {/* Skills Tag Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>Skills for this Resume</h4>
                  <div style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Type a skill and press Enter or click Add" 
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        style={{ backgroundColor: 'var(--surface)' }}
                      />
                      <button 
                        className="btn btn-outline" 
                        type="button"
                        onClick={handleAddSkill}
                        style={{ padding: '0.5rem 0.85rem' }}
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '30px' }}>
                      {normalizeSkillsArray(currentResume.skills || []).map(skill => (
                        <span 
                          key={skill} 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border-color)',
                            padding: '0.25rem 0.5rem 0.25rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: 'var(--text-main)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkill(skill)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#94a3b8', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '1px',
                              borderRadius: '50%'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      {(currentResume.skills || []).length === 0 && (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: 'auto 0' }}>No skills added to this resume.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Experience Dynamic Form Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', margin: 0 }}>Professional Experience</h4>
                    <button 
                      className="btn btn-outline" 
                      onClick={handleAddExperience}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '11px', gap: '0.25rem' }}
                    >
                      <Plus size={12} /> Add Experience
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(currentResume.experience || []).map((exp) => (
                      <div 
                        key={exp.id} 
                        style={{ 
                          padding: '1rem', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px', 
                          position: 'relative',
                          backgroundColor: '#fcfdfe',
                          animation: 'slideIn 0.2s ease-out'
                        }}
                      >
                        <button 
                          onClick={() => handleRemoveExperience(exp.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                          title="Remove experience"
                        >
                          <X size={15} />
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Company Name</label>
                            <input 
                              type="text" 
                              className="input" 
                              placeholder="e.g. Google"
                              value={exp.company} 
                              onChange={e => handleUpdateExperience(exp.id, 'company', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Job Title</label>
                            <input 
                              type="text" 
                              className="input" 
                              placeholder="e.g. Senior Frontend Developer"
                              value={exp.title} 
                              onChange={e => handleUpdateExperience(exp.id, 'title', e.target.value)} 
                            />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Duration / Dates</label>
                            <input 
                              type="text" 
                              className="input" 
                              placeholder="e.g. Oct 2023 – Present or 2021 – 2023"
                              value={exp.duration} 
                              onChange={e => handleUpdateExperience(exp.id, 'duration', e.target.value)} 
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Key Accomplishments & Responsibilities</label>
                          <textarea 
                            className="input" 
                            rows="2" 
                            placeholder="Describe your accomplishments, projects you owned, and technologies applied..."
                            value={exp.description} 
                            onChange={e => handleUpdateExperience(exp.id, 'description', e.target.value)}
                          ></textarea>
                        </div>
                      </div>
                    ))}

                    {(currentResume.experience || []).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)' }}>
                        <Briefcase size={20} style={{ color: '#94a3b8', marginBottom: '0.35rem' }} />
                        <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>No experiences added. Click "Add Experience" to add roles.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Education Dynamic Form Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', margin: 0 }}>Academic History</h4>
                    <button 
                      className="btn btn-outline" 
                      onClick={handleAddEducation}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '11px', gap: '0.25rem' }}
                    >
                      <Plus size={12} /> Add Education
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(currentResume.education || []).map((edu) => (
                      <div 
                        key={edu.id} 
                        style={{ 
                          padding: '0.85rem 1rem', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px', 
                          position: 'relative',
                          backgroundColor: '#fcfdfe',
                          animation: 'slideIn 0.2s ease-out'
                        }}
                      >
                        <button 
                          onClick={() => handleRemoveEducation(edu.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                          title="Remove education"
                        >
                          <X size={15} />
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Institution</label>
                            <input 
                              type="text" 
                              className="input" 
                              placeholder="e.g. Stanford University"
                              value={edu.institution} 
                              onChange={e => handleUpdateEducation(edu.id, 'institution', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Degree / Subject</label>
                            <input 
                              type="text" 
                              className="input" 
                              placeholder="e.g. B.S. Computer Science"
                              value={edu.degree} 
                              onChange={e => handleUpdateEducation(edu.id, 'degree', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Year</label>
                            <input 
                              type="text" 
                              className="input" 
                              placeholder="e.g. 2022"
                              value={edu.year} 
                              onChange={e => handleUpdateEducation(edu.id, 'year', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {(currentResume.education || []).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)' }}>
                        <GraduationCap size={20} style={{ color: '#94a3b8', marginBottom: '0.35rem' }} />
                        <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>No academic credentials added. Click "Add Education" to add degree profiles.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* A4 Canvas Visual Preview */}
              <div className="card" style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                backgroundColor: '#334155',
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                padding: '1.25rem', minWidth: 0, borderRadius: '16px',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '0.02em' }}>Document Preview (A4 Canvas)</span>
                  </div>
                  <button className="btn btn-primary" onClick={downloadResumePDF} style={{ gap: '0.4rem', borderRadius: '8px', fontSize: '12px', padding: '0.4rem 0.9rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)' }}>
                    <Download size={14} /> Download PDF
                  </button>
                </div>
                
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                  {/* Styled A4 sheet scale-fitted preview */}
                  <div 
                    ref={previewRef} 
                    style={{ 
                      width: '8.5in', 
                      minHeight: '11in', 
                      backgroundColor: 'white', 
                      padding: '0.6in 0.8in', 
                      borderRadius: '4px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)', 
                      fontFamily: '"Times New Roman", Times, serif', 
                      transform: 'scale(0.85)', 
                      transformOrigin: 'top center',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.15in',
                      color: '#1e293b'
                    }}
                  >
                    {/* Header Details */}
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #334155', paddingBottom: '0.1in' }}>
                      <h1 style={{ margin: '0 0 4px 0', fontSize: '22pt', fontWeight: 'bold', color: '#0f172a', fontFamily: '"Times New Roman", Times, serif' }}>
                        {currentResume.name || 'YOUR NAME'}
                      </h1>
                      <div style={{ fontSize: '9.5pt', color: '#475569', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 12px', margin: '4px 0' }}>
                        {currentResume.email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Mail size={11} /> {currentResume.email}</span>}
                        {currentResume.phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Phone size={11} /> {currentResume.phone}</span>}
                        {currentResume.linkedin && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Linkedin size={11} /> {currentResume.linkedin}</span>}
                      </div>
                      {currentResume.role && (
                        <div style={{ fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginTop: '4px' }}>
                          {currentResume.role}
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    {currentResume.summary && (
                      <div>
                        <h2 style={{ fontSize: '11pt', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', margin: '0 0 6px 0', paddingBottom: '2px', color: '#334155' }}>
                          Professional Profile
                        </h2>
                        <p style={{ fontSize: '9.5pt', lineHeight: '1.45', textAlign: 'justify', margin: 0 }}>
                          {currentResume.summary}
                        </p>
                      </div>
                    )}

                    {/* Professional Experience */}
                    {((currentResume.experience || []).length > 0 || (currentResume.selectedPoints || []).length > 0) && (
                      <div>
                        <h2 style={{ fontSize: '11pt', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', margin: '0 0 6px 0', paddingBottom: '2px', color: '#334155' }}>
                          Professional Experience
                        </h2>
                        
                        {/* Dynamic Experience Records */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1in' }}>
                          {(currentResume.experience || []).map((exp) => (
                            <div key={exp.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '9.5pt' }}>
                                <div>
                                  <strong style={{ color: '#0f172a' }}>{exp.title || 'Role Title'}</strong>
                                  {exp.company && <span> | {exp.company}</span>}
                                </div>
                                <span style={{ fontSize: '9pt', fontStyle: 'italic', color: '#475569' }}>{exp.duration || 'Dates'}</span>
                              </div>
                              {exp.description && (
                                <p style={{ fontSize: '9pt', lineHeight: '1.4', margin: '2px 0 0 0', color: '#334155', textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Selected Bullet Suggestions */}
                        {(currentResume.selectedPoints || []).length > 0 && (
                          <div style={{ marginTop: (currentResume.experience || []).length > 0 ? '0.08in' : '0' }}>
                            <p style={{ fontSize: '9.5pt', fontWeight: 'bold', margin: '0 0 4px 0', color: '#0f172a' }}>Key Technical Accomplishments</p>
                            <ul style={{ margin: 0, paddingLeft: '0.2in', fontSize: '9pt', lineHeight: '1.45' }}>
                              {(currentResume.selectedPoints || []).map((p, i) => (
                                <li key={i} style={{ marginBottom: '3px', color: '#334155', textAlign: 'justify' }}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Academic Credentials */}
                    {(currentResume.education || []).length > 0 && (
                      <div>
                        <h2 style={{ fontSize: '11pt', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', margin: '0 0 6px 0', paddingBottom: '2px', color: '#334155' }}>
                          Education History
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(currentResume.education || []).map((edu) => (
                            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '9.5pt' }}>
                              <div>
                                <strong style={{ color: '#0f172a' }}>{edu.degree || 'Degree Profile'}</strong>
                                {edu.institution && <span>, {edu.institution}</span>}
                              </div>
                              <span style={{ fontSize: '9pt', fontStyle: 'italic', color: '#475569' }}>{edu.year || 'Graduation Year'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {(currentResume.skills || []).length > 0 && (
                      <div>
                        <h2 style={{ fontSize: '11pt', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', margin: '0 0 6px 0', paddingBottom: '2px', color: '#334155' }}>
                          Core Qualifications & Skills
                        </h2>
                        <p style={{ fontSize: '9.5pt', lineHeight: '1.4', margin: 0, color: '#334155' }}>
                          {normalizeSkillsArray(currentResume.skills || []).join(' • ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Premium Illustrated Empty State for Resumes */
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '400px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(59, 130, 246, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '1.5rem',
                border: '1px solid rgba(59, 130, 246, 0.1)',
                color: 'var(--primary)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <FileText size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Active Resume Draft</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center', maxWidth: '380px', marginBottom: '2rem', lineHeight: '1.5' }}>
                Select an existing resume profile from the left sidebar panel to begin tailoring, or quickly generate a blank credentials canvas or upload a document to let our parser process it automatically.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', gap: '0.4rem' }} onClick={createNewResume}>
                  <Plus size={16} /> Create New
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.6rem 1.25rem', gap: '0.4rem' }} 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  <UploadCloud size={16} /> Upload Existing
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'coverLetters' && (
        <div style={{ display: 'flex', gap: '1.25rem', flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div className="card" style={{ width: '260px', display: 'flex', flexDirection: 'column', padding: '1rem', flexShrink: 0, gap: '0.75rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem' }} onClick={createNewCoverLetter}>
              <Plus size={16} /> New Cover Letter
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', margin: '0.5rem 0 0.25rem 0', letterSpacing: '0.05em' }}>Saved Outreach</p>
              
              {coverLetters.map(c => {
                const isConfirming = deleteConfirmId === c.id;
                const isCurrent = currentCoverLetter?.id === c.id;

                if (isConfirming) {
                  return (
                    <div 
                      key={c.id} 
                      style={{ 
                        padding: '0.6rem 0.75rem', 
                        borderRadius: '6px', 
                        backgroundColor: '#fef2f2', 
                        border: '1px solid #fee2e2', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        animation: 'slideIn 0.2s ease-out' 
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: '600' }}>Remove outreach?</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} 
                          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          No
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); executeDeleteCoverLetter(c.id); }} 
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={c.id} 
                    onClick={() => {
                      setCurrentCoverLetter(c);
                      setClearConfirm(false);
                    }} 
                    style={{ 
                      padding: '0.65rem 0.75rem', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      backgroundColor: isCurrent ? '#f0f7ff' : 'var(--surface)', 
                      border: `1px solid ${isCurrent ? '#bfdbfe' : 'var(--border-color)'}`, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    className="sidebar-item"
                  >
                    <span style={{ 
                      fontWeight: isCurrent ? '600' : 'normal', 
                      fontSize: '12.5px', 
                      color: isCurrent ? '#1d4ed8' : 'var(--text-main)',
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      maxWidth: '160px' 
                    }}>
                      {c.title}
                    </span>
                    <button 
                      onClick={(e) => startDeleteCoverLetter(c.id, e)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#94a3b8', 
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      className="trash-btn"
                    >
                      <Trash2 size={13} style={{ transition: 'color 0.2s' }} />
                    </button>
                  </div>
                );
              })}

              {coverLetters.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                  <p className="text-muted" style={{ fontSize: '11px' }}>No cover letters loaded.</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Area */}
          {currentCoverLetter ? (
            <div style={{ flex: 1, display: 'flex', gap: '1.25rem', overflow: 'hidden', minWidth: 0 }}>
              {/* Workspace Editor */}
              <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '600' }}>Edit Cover Letter</h3>
                  <button className="btn btn-primary" onClick={saveCurrentCoverLetter}>Save Letter</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>Document Title</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={currentCoverLetter.title} 
                      onChange={e => setCurrentCoverLetter({...currentCoverLetter, title: e.target.value})} 
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>Target Career Role</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="e.g. Frontend Engineer" 
                        value={currentCoverLetter.role} 
                        onChange={e => setCurrentCoverLetter({...currentCoverLetter, role: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>Company Name</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="e.g. Google" 
                        value={currentCoverLetter.company} 
                        onChange={e => setCurrentCoverLetter({...currentCoverLetter, company: e.target.value})} 
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '0.25rem 0' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ gap: '0.35rem' }}
                      onClick={generateCoverLetterText} 
                      disabled={isGenerating}
                    >
                      <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                      {isGenerating ? 'Generating Outreach...' : 'AI Generate Outreach'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.35rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>Content Layout</label>
                    <textarea 
                      className="input" 
                      style={{ flex: 1, minHeight: '300px', resize: 'vertical', fontFamily: '"Times New Roman", Times, serif', fontSize: '13px', lineHeight: '1.5' }} 
                      value={currentCoverLetter.content} 
                      onChange={e => setCurrentCoverLetter({...currentCoverLetter, content: e.target.value})}
                    ></textarea>
                    
                    {/* Live Word Count & Reading Time stats */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', color: '#64748b', fontWeight: '500', padding: '2px 4px' }}>
                      <span>
                        {clWordCount === 1 ? '1 word' : `${clWordCount} words`} · ~{clReadTime} {clReadTime === 1 ? 'min' : 'mins'} read
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#e2e8f0', padding: '1rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                  <button className="btn btn-primary" onClick={downloadCoverLetterPDF} style={{ gap: '0.4rem', boxShadow: 'var(--shadow-sm)' }}>
                    <Download size={14} /> Download PDF
                  </button>
                </div>
                
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                  {/* A4 sheet scale preview */}
                  <div 
                    ref={clPreviewRef} 
                    style={{ 
                      width: '8.5in', 
                      minHeight: '11in', 
                      backgroundColor: 'white', 
                      padding: '1in', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)', 
                      fontFamily: '"Times New Roman", Times, serif', 
                      fontSize: '12pt', 
                      lineHeight: '1.5', 
                      transform: 'scale(0.85)', 
                      transformOrigin: 'top center',
                      color: '#1e293b'
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                      {currentCoverLetter.content || 'Your personalized AI cover letter outreach content will render here.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Premium Illustrated Empty State for Cover Letters */
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '400px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(59, 130, 246, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '1.5rem',
                border: '1px solid rgba(59, 130, 246, 0.1)',
                color: 'var(--primary)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <FileText size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Active Cover Letter</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center', maxWidth: '380px', marginBottom: '2rem', lineHeight: '1.5' }}>
                Select an existing cover letter outreach draft from the left sidebar panel to begin tailoring, or quickly generate a role-specific cover letter using AI optimization.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', gap: '0.4rem' }} onClick={createNewCoverLetter}>
                  <Plus size={16} /> Create New
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: JD MATCH & OPTIMIZE --- */}
      {activeTab === 'jdMatch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, minHeight: 0 }}>
          
          {/* Top Quick Actions Bar */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(124, 58, 237, 0.1)'
              }}>
                <Target size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Job Description Matcher & Optimizer
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ede9fe', color: '#6d28d9', fontWeight: '600' }}>
                    AI Matching Engine
                  </span>
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Give your target Job Description and current resume to discover missing skills, ATS gaps, and tailored optimization steps.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748b' }}>Try Sample JD:</span>
              <button 
                type="button"
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '11.5px', borderRadius: '6px', backgroundColor: '#f8fafc' }}
                onClick={() => handleLoadSampleJD('frontend')}
              >
                Frontend Engineer
              </button>
              <button 
                type="button"
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '11.5px', borderRadius: '6px', backgroundColor: '#f8fafc' }}
                onClick={() => handleLoadSampleJD('fullstack')}
              >
                Full Stack Engineer
              </button>
            </div>
          </div>

          {/* 2-Column Split Workspace */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 440px) 1fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
            
            {/* LEFT COLUMN: RESUME SELECTION & JD INPUT */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', padding: '1.25rem' }}>
              
              {/* STEP 1: RESUME SELECTION */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>1</span>
                    Current Resume
                  </label>
                  
                  <div style={{ display: 'flex', gap: '2px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                    <button 
                      type="button"
                      style={{ 
                        border: 'none', 
                        background: jdResumeSource === 'saved' ? '#ffffff' : 'transparent', 
                        fontSize: '11px', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontWeight: jdResumeSource === 'saved' ? '600' : '500',
                        color: jdResumeSource === 'saved' ? 'var(--primary)' : '#64748b',
                        cursor: 'pointer',
                        boxShadow: jdResumeSource === 'saved' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}
                      onClick={() => setJdResumeSource('saved')}
                    >
                      Saved
                    </button>
                    <button 
                      type="button"
                      style={{ 
                        border: 'none', 
                        background: jdResumeSource === 'upload' ? '#ffffff' : 'transparent', 
                        fontSize: '11px', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontWeight: jdResumeSource === 'upload' ? '600' : '500',
                        color: jdResumeSource === 'upload' ? 'var(--primary)' : '#64748b',
                        cursor: 'pointer',
                        boxShadow: jdResumeSource === 'upload' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}
                      onClick={() => setJdResumeSource('upload')}
                    >
                      Upload
                    </button>
                    <button 
                      type="button"
                      style={{ 
                        border: 'none', 
                        background: jdResumeSource === 'paste' ? '#ffffff' : 'transparent', 
                        fontSize: '11px', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontWeight: jdResumeSource === 'paste' ? '600' : '500',
                        color: jdResumeSource === 'paste' ? 'var(--primary)' : '#64748b',
                        cursor: 'pointer',
                        boxShadow: jdResumeSource === 'paste' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}
                      onClick={() => setJdResumeSource('paste')}
                    >
                      Paste
                    </button>
                  </div>
                </div>

                {/* Source: Saved Resumes */}
                {jdResumeSource === 'saved' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {resumes.length > 0 ? (
                      <select 
                        className="input" 
                        value={selectedResumeId || (resumes[0] && resumes[0].id) || ''} 
                        onChange={e => setSelectedResumeId(e.target.value)}
                        style={{ fontSize: '13px', fontWeight: '500' }}
                      >
                        {resumes.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.title} — {r.role || 'Software Engineer'} ({r.name || 'Applicant'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '12px', color: '#991b1b' }}>
                        No saved resumes found. Create or upload a resume draft first, or switch to Upload/Paste.
                      </div>
                    )}

                    {getActiveJDResume() && (
                      <div style={{ 
                        backgroundColor: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        padding: '0.75rem 0.85rem',
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Candidate:</span>
                          <strong style={{ color: '#0f172a' }}>{getActiveJDResume().name || 'Applicant'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Target Role:</span>
                          <strong style={{ color: '#0f172a' }}>{getActiveJDResume().role || 'Not specified'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Skills on Resume:</span>
                          <span style={{ color: '#166534', fontWeight: '600' }}>
                            {normalizeSkillsArray(getActiveJDResume().skills || []).length} skills
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                          {normalizeSkillsArray(getActiveJDResume().skills || []).slice(0, 7).map(s => (
                            <span key={s} style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#334155' }}>
                              {s}
                            </span>
                          ))}
                          {normalizeSkillsArray(getActiveJDResume().skills || []).length > 7 && (
                            <span style={{ fontSize: '10.5px', color: '#64748b', alignSelf: 'center' }}>
                              +{normalizeSkillsArray(getActiveJDResume().skills || []).length - 7} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Source: Upload File */}
                {jdResumeSource === 'upload' && (
                  <div 
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '8px',
                      padding: '1.25rem 1rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-color)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                    onClick={() => jdFileInputRef.current?.click()}
                  >
                    <UploadCloud size={28} style={{ color: '#64748b', marginBottom: '0.35rem' }} />
                    <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '600', color: 'var(--text-main)' }}>
                      {jdUploadedResume ? `Loaded: ${jdUploadedResume.name || 'Uploaded Resume'}` : 'Click to Upload Resume (PDF, DOCX, TXT)'}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                      {jdUploadedResume ? `${normalizeSkillsArray(jdUploadedResume.skills || []).length} skills extracted` : 'System will extract skills and experience'}
                    </p>
                    <input 
                      type="file" 
                      ref={jdFileInputRef} 
                      onChange={handleJDFileUpload} 
                      accept=".pdf,.txt,.docx" 
                      style={{ display: 'none' }} 
                    />
                  </div>
                )}

                {/* Source: Paste Text */}
                {jdResumeSource === 'paste' && (
                  <div>
                    <textarea 
                      className="input" 
                      rows="5" 
                      placeholder="Paste your raw resume text here (Summary, Skills, Work Experience, Education)..."
                      value={pastedResumeText}
                      onChange={e => setPastedResumeText(e.target.value)}
                      style={{ fontSize: '12px', lineHeight: '1.45' }}
                    />
                  </div>
                )}
              </div>

              {/* STEP 2: JOB DESCRIPTION (JD) INPUT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#7c3aed', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>2</span>
                  Target Job Description (JD)
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '2px', display: 'block' }}>Role Title (Optional)</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. Senior Frontend Engineer" 
                      value={jdInput.role}
                      onChange={e => setJdInput({ ...jdInput, role: e.target.value })}
                      style={{ fontSize: '12px', padding: '0.4rem 0.6rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '2px', display: 'block' }}>Company (Optional)</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. Google, Stripe" 
                      value={jdInput.company}
                      onChange={e => setJdInput({ ...jdInput, company: e.target.value })}
                      style={{ fontSize: '12px', padding: '0.4rem 0.6rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Job Description Text *</label>
                  <textarea 
                    className="input" 
                    rows="10" 
                    placeholder="Paste the job description, core responsibilities, requirements, and required qualifications here..."
                    value={jdInput.text}
                    onChange={e => setJdInput({ ...jdInput, text: e.target.value })}
                    style={{ fontSize: '12px', lineHeight: '1.45', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8' }}>
                    <span>{jdInput.text.trim().length} characters</span>
                    {jdInput.text.trim().length < 20 && jdInput.text.trim().length > 0 && (
                      <span style={{ color: '#ef4444' }}>Minimum 20 characters required</span>
                    )}
                  </div>
                </div>

                <button 
                  type="button"
                  className="btn btn-primary" 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    fontSize: '13.5px', 
                    fontWeight: '600', 
                    gap: '0.5rem', 
                    backgroundColor: '#7c3aed',
                    borderColor: '#7c3aed',
                    boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)',
                    marginTop: '0.25rem'
                  }}
                  onClick={handleAnalyzeJD}
                  disabled={isAnalyzingJD || jdInput.text.trim().length < 20}
                >
                  {isAnalyzingJD ? (
                    <>
                      <RefreshCw size={16} className="resume-upload-spinner" style={{ animation: 'spin 1s linear infinite' }} />
                      Deep Analyzing Requirements...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Analyze & Suggest Optimizations
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: RESULTS & RECOMMENDATIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, overflowY: 'auto' }}>
              
              {/* State A: Not Analyzed Yet */}
              {!jdAnalysisResult && !isAnalyzingJD && (
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--surface)' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(124, 58, 237, 0.08)', 
                    color: '#7c3aed', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '1.25rem' 
                  }}>
                    <Target size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Compare Resume with Job Description
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: '1.5', marginBottom: '2rem' }}>
                    Select your resume and paste any target Job Description on the left. The system will inspect every requirement, calculate your ATS match score, and generate comprehensive recommendations.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', width: '100%', maxWidth: '560px', textAlign: 'left' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b91c1c', fontWeight: '700', fontSize: '12.5px', marginBottom: '4px' }}>
                        <Plus size={15} /> What Needs to Be Added
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                        Identifies missing technical skills, soft skill requirements, ATS keywords, and provides ready-to-use tailored bullet points.
                      </p>
                    </div>

                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7c3aed', fontWeight: '700', fontSize: '12.5px', marginBottom: '4px' }}>
                        <Sparkles size={15} /> What Optimization Is Required
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                        Provides tailored executive summaries, metric quantification rewrites, and keyword density placement guidance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* State B: Loading Analysis */}
              {isAnalyzingJD && (
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                  <RefreshCw size={40} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite', marginBottom: '1.25rem' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Analyzing Job Description Against Resume...
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: '1.5' }}>
                    Extracting technical competencies, comparing qualifications, identifying keyword gaps, and generating tailored optimization steps.
                  </p>
                </div>
              )}

              {/* State C: Analysis Loaded */}
              {jdAnalysisResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Top Score Card */}
                  <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `5px solid ${jdAnalysisResult.matchBadgeColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            textTransform: 'uppercase', 
                            padding: '3px 8px', 
                            borderRadius: '6px', 
                            backgroundColor: `${jdAnalysisResult.matchBadgeColor}15`, 
                            color: jdAnalysisResult.matchBadgeColor,
                            letterSpacing: '0.04em'
                          }}>
                            {jdAnalysisResult.matchLevel}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Target: <strong>{jdAnalysisResult.targetRole}</strong> {jdAnalysisResult.companyName ? `at ${jdAnalysisResult.companyName}` : ''}
                          </span>
                        </div>
                        <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          ATS Compatibility & Optimization Analysis
                        </h3>
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                          {jdAnalysisResult.overview}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ATSGauge score={jdAnalysisResult.matchScore} />
                        <button 
                          className="btn btn-outline"
                          onClick={() => handleOpenInEditor()}
                          style={{ gap: '0.35rem', padding: '0.5rem 0.85rem', fontSize: '12px' }}
                          title="View and edit this resume in the visual editor"
                        >
                          <span>Open in Editor</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
                      <button 
                        type="button"
                        onClick={() => setJdAnalysisFilter('all')}
                        style={{
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: jdAnalysisFilter === 'all' ? '600' : '500',
                          backgroundColor: jdAnalysisFilter === 'all' ? '#0f172a' : '#f1f5f9',
                          color: jdAnalysisFilter === 'all' ? '#ffffff' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        All Insights
                      </button>
                      <button 
                        type="button"
                        onClick={() => setJdAnalysisFilter('needsAdded')}
                        style={{
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: jdAnalysisFilter === 'needsAdded' ? '600' : '500',
                          backgroundColor: jdAnalysisFilter === 'needsAdded' ? '#fee2e2' : '#f1f5f9',
                          color: jdAnalysisFilter === 'needsAdded' ? '#991b1b' : '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={13} />
                        What Needs to Be Added ({(jdAnalysisResult.whatNeedsToBeAdded?.missingHardSkills || []).length + (jdAnalysisResult.whatNeedsToBeAdded?.missingSoftSkills || []).length})
                      </button>
                      <button 
                        type="button"
                        onClick={() => setJdAnalysisFilter('optimizations')}
                        style={{
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: jdAnalysisFilter === 'optimizations' ? '600' : '500',
                          backgroundColor: jdAnalysisFilter === 'optimizations' ? '#ede9fe' : '#f1f5f9',
                          color: jdAnalysisFilter === 'optimizations' ? '#6d28d9' : '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Sparkles size={13} />
                        Optimizations Required ({(jdAnalysisResult.whatOptimizationIsRequired?.optimizations || []).length})
                      </button>
                      <button 
                        type="button"
                        onClick={() => setJdAnalysisFilter('matched')}
                        style={{
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: jdAnalysisFilter === 'matched' ? '600' : '500',
                          backgroundColor: jdAnalysisFilter === 'matched' ? '#dcfce7' : '#f1f5f9',
                          color: jdAnalysisFilter === 'matched' ? '#166534' : '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={13} />
                        Matched Skills ({(jdAnalysisResult.skillBreakdown?.matched || []).length})
                      </button>
                    </div>
                  </div>

                  {/* SECTION 1: WHAT NEEDS TO BE ADDED */}
                  {(jdAnalysisFilter === 'all' || jdAnalysisFilter === 'needsAdded') && (
                    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fee2e2', paddingBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <AlertCircle size={16} /> What Need to Be Added
                          </h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                            These qualifications, technologies, and accomplishment statements were requested in the JD but not found on your resume.
                          </p>
                        </div>

                        {(jdAnalysisResult.whatNeedsToBeAdded?.missingHardSkills || []).length > 0 && (
                          <button 
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAddAllMissingSkills}
                            style={{ 
                              padding: '0.35rem 0.75rem', 
                              fontSize: '11.5px', 
                              gap: '0.3rem', 
                              backgroundColor: '#dc2626', 
                              borderColor: '#dc2626' 
                            }}
                          >
                            <Plus size={13} /> Add All Missing Skills to Resume
                          </button>
                        )}
                      </div>

                      {/* 1. Missing Technical Skills */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Missing Technical Skills ({(jdAnalysisResult.whatNeedsToBeAdded?.missingHardSkills || []).length})
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Click "+ Add to Resume" to instantly insert</span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {(jdAnalysisResult.whatNeedsToBeAdded?.missingHardSkills || []).map((skill) => {
                            const isAdded = addedSkillsMap[skill.name];
                            return (
                              <div 
                                key={skill.name}
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.4rem', 
                                  padding: '0.35rem 0.65rem', 
                                  borderRadius: '6px', 
                                  backgroundColor: isAdded ? '#ecfdf5' : '#fef2f2', 
                                  border: `1px solid ${isAdded ? '#a7f3d0' : '#fecaca'}`,
                                  transition: 'all 0.2s'
                                }}
                              >
                                <span style={{ fontSize: '12px', fontWeight: '600', color: isAdded ? '#065f46' : '#991b1b' }}>
                                  {skill.name}
                                </span>
                                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', backgroundColor: isAdded ? '#d1fae5' : '#fee2e2', color: isAdded ? '#065f46' : '#b91c1c', fontWeight: '500' }}>
                                  {skill.category || 'Skill'}
                                </span>
                                {skill.priority === 'Critical' && (
                                  <span style={{ fontSize: '9.5px', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#ef4444', color: '#fff', fontWeight: '700' }}>
                                    Must-Have
                                  </span>
                                )}
                                <button 
                                  type="button"
                                  onClick={() => handleAddMissingSkillToResume(skill)}
                                  style={{
                                    border: 'none',
                                    background: isAdded ? '#10b981' : '#dc2626',
                                    color: '#ffffff',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontSize: '10.5px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                  }}
                                  title="Add to your active resume"
                                >
                                  {isAdded ? <Check size={11} /> : <Plus size={11} />}
                                  {isAdded ? 'Added' : 'Add to Resume'}
                                </button>
                              </div>
                            );
                          })}

                          {(jdAnalysisResult.whatNeedsToBeAdded?.missingHardSkills || []).length === 0 && (
                            <span style={{ fontSize: '12px', color: '#166534', fontStyle: 'italic' }}>
                              Great job! All technical skills from this JD are already represented on your resume.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. Missing Soft Skills & Methodologies */}
                      {(jdAnalysisResult.whatNeedsToBeAdded?.missingSoftSkills || []).length > 0 && (
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                            Missing Methodologies & Soft Skills
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {jdAnalysisResult.whatNeedsToBeAdded.missingSoftSkills.map((soft) => (
                              <span 
                                key={soft}
                                style={{
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '6px',
                                  backgroundColor: '#fffbeb',
                                  border: '1px solid #fef3c7',
                                  fontSize: '12px',
                                  color: '#b45309',
                                  fontWeight: '500'
                                }}
                              >
                                ⚡ {soft}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Missing Keywords from JD Requirements */}
                      {(jdAnalysisResult.whatNeedsToBeAdded?.missingKeywords || []).length > 0 && (
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                            ATS Requirements & Key Terminology to Weave In
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {jdAnalysisResult.whatNeedsToBeAdded.missingKeywords.map((kw, i) => (
                              <span 
                                key={i}
                                style={{
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '4px',
                                  backgroundColor: '#f1f5f9',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '11.5px',
                                  color: '#475569'
                                }}
                              >
                                "{kw}"
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Suggested High-Impact Resume Bullets */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Suggested Tailored Bullets to Add
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Quantified statements tailored to this JD</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {(jdAnalysisResult.whatNeedsToBeAdded?.suggestedBulletPoints || []).map((bullet, idx) => (
                            <div 
                              key={idx}
                              style={{ 
                                padding: '0.75rem 0.85rem', 
                                borderRadius: '8px', 
                                border: '1px solid #e2e8f0', 
                                backgroundColor: '#fcfdfe',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '0.75rem'
                              }}
                            >
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flex: 1 }}>
                                <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>•</span>
                                <p style={{ margin: 0, fontSize: '12.5px', color: '#1e293b', lineHeight: '1.45' }}>
                                  {bullet}
                                </p>
                              </div>

                              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                <button 
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => handleCopyText(bullet, `bullet-${idx}`)}
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '11px', gap: '0.25rem' }}
                                  title="Copy bullet text"
                                >
                                  {copiedItem === `bullet-${idx}` ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                                  {copiedItem === `bullet-${idx}` ? 'Copied' : 'Copy'}
                                </button>
                                <button 
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => handleAddSuggestedBulletToResume(bullet)}
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '11px', gap: '0.25rem', backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                                  title="Add this bullet to your resume's Key Highlights"
                                >
                                  <Plus size={12} /> Add to Highlights
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SECTION 2: WHAT OPTIMIZATION IS REQUIRED */}
                  {(jdAnalysisFilter === 'all' || jdAnalysisFilter === 'optimizations') && (
                    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#fff' }}>
                      <div style={{ borderBottom: '1px solid #ede9fe', paddingBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Sparkles size={16} /> What Optimization Is Required
                        </h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                          Recommended revisions to your summary, metrics, and experience structure to maximize ATS ranking and interview conversions.
                        </p>
                      </div>

                      {/* Tailored Summary Optimization */}
                      {jdAnalysisResult.whatOptimizationIsRequired?.tailoredSummary && (
                        <div style={{ 
                          padding: '1rem', 
                          borderRadius: '8px', 
                          backgroundColor: '#f5f3ff', 
                          border: '1px solid #ddd6fe',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Sparkles size={14} style={{ color: '#7c3aed' }} />
                              <strong style={{ fontSize: '12.5px', color: '#4c1d95' }}>Tailored Executive Summary for this JD</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button 
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleCopyText(jdAnalysisResult.whatOptimizationIsRequired.tailoredSummary, 'summary-text')}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '11px', gap: '0.25rem', backgroundColor: '#ffffff' }}
                              >
                                {copiedItem === 'summary-text' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                                {copiedItem === 'summary-text' ? 'Copied' : 'Copy'}
                              </button>
                              <button 
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleApplyTailoredSummary(jdAnalysisResult.whatOptimizationIsRequired.tailoredSummary)}
                                style={{ padding: '0.25rem 0.65rem', fontSize: '11px', gap: '0.25rem', backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                              >
                                <Check size={12} /> Apply to Resume
                              </button>
                            </div>
                          </div>

                          <p style={{ margin: 0, fontSize: '12.5px', color: '#1e293b', lineHeight: '1.5', fontStyle: 'italic', backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ede9fe' }}>
                            "{jdAnalysisResult.whatOptimizationIsRequired.tailoredSummary}"
                          </p>
                        </div>
                      )}

                      {/* Actionable Optimizations Cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {(jdAnalysisResult.whatOptimizationIsRequired?.optimizations || []).map((opt) => (
                          <div 
                            key={opt.id}
                            style={{
                              padding: '1rem',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#fcfdfe',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: opt.severity === 'high' ? '#fee2e2' : opt.severity === 'medium' ? '#fef3c7' : '#f1f5f9',
                                  color: opt.severity === 'high' ? '#991b1b' : opt.severity === 'medium' ? '#b45309' : '#475569'
                                }}>
                                  {opt.severity} Priority
                                </span>
                                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{opt.title}</strong>
                              </div>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>{opt.area}</span>
                            </div>

                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                              {opt.currentInsight}
                            </p>

                            <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '2px' }}>
                                Action to take:
                              </span>
                              <p style={{ margin: 0, fontSize: '12px', color: '#1e293b', lineHeight: '1.45' }}>
                                {opt.recommendation}
                              </p>
                            </div>

                            {/* Examples block (Before vs After) */}
                            {opt.examples && opt.examples.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                                {opt.examples.map((ex, i) => (
                                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '11.5px' }}>
                                    <div style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                                      <strong style={{ color: '#991b1b', display: 'block', marginBottom: '2px' }}>❌ Generic / Non-quantified</strong>
                                      <span style={{ color: '#7f1d1d' }}>{ex.before}</span>
                                    </div>
                                    <div style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                      <strong style={{ color: '#065f46', display: 'block', marginBottom: '2px' }}>✅ Optimized with Impact Metrics</strong>
                                      <span style={{ color: '#064e3b' }}>{ex.after}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action Button for Role */}
                            {opt.actionType === 'apply_role' && opt.actionableOutput && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                <button 
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => handleApplyTargetRole(opt.actionableOutput)}
                                  style={{ padding: '0.3rem 0.75rem', fontSize: '11.5px', gap: '0.25rem' }}
                                >
                                  <Check size={13} /> Set Resume Title to "{opt.actionableOutput}"
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {/* SECTION 3: CURRENTLY MATCHED SKILLS */}
                  {(jdAnalysisFilter === 'all' || jdAnalysisFilter === 'matched') && (
                    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#fff' }}>
                      <div style={{ borderBottom: '1px solid #dcfce7', paddingBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle2 size={16} /> Already Matching Skills ({(jdAnalysisResult.skillBreakdown?.matched || []).length})
                        </h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                          These competencies from the job description are already present in your resume.
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {(jdAnalysisResult.skillBreakdown?.matched || []).map((skill) => (
                          <span 
                            key={skill.name}
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              backgroundColor: '#dcfce7',
                              border: '1px solid #bbf7d0',
                              fontSize: '12px',
                              color: '#166534',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ✓ {skill.name}
                          </span>
                        ))}

                        {(jdAnalysisResult.skillBreakdown?.matchedSoft || []).map((soft) => (
                          <span 
                            key={soft}
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              fontSize: '12px',
                              color: '#15803d',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ✓ {soft}
                          </span>
                        ))}

                        {(jdAnalysisResult.skillBreakdown?.matched || []).length === 0 && (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                            No technical skill matches detected yet. Add missing skills above to boost your ATS match score.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions Toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
                    <button 
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setJdAnalysisResult(null);
                        setAddedSkillsMap({});
                      }}
                      style={{ fontSize: '12px' }}
                    >
                      Clear Analysis
                    </button>

                    <button 
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleOpenInEditor()}
                      style={{ gap: '0.4rem', padding: '0.6rem 1.25rem', fontSize: '13px' }}
                    >
                      <span>Open & Preview in Resume Editor</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default ResumeBuilder;
