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
  RefreshCw
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
            <div style={{ display: 'flex', gap: '2px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0', marginLeft: '0.5rem' }}>
              <button 
                className={`btn`} 
                style={{ 
                  padding: '0.4rem 1rem', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  backgroundColor: activeTab === 'resumes' ? 'var(--surface)' : 'transparent',
                  color: activeTab === 'resumes' ? 'var(--text-main)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'resumes' ? '600' : '500',
                  boxShadow: activeTab === 'resumes' ? 'var(--shadow-sm)' : 'none'
                }} 
                onClick={() => setActiveTab('resumes')}
              >
                Resumes
              </button>
              <button 
                className={`btn`} 
                style={{ 
                  padding: '0.4rem 1rem', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  backgroundColor: activeTab === 'coverLetters' ? 'var(--surface)' : 'transparent',
                  color: activeTab === 'coverLetters' ? 'var(--text-main)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'coverLetters' ? '600' : '500',
                  boxShadow: activeTab === 'coverLetters' ? 'var(--shadow-sm)' : 'none'
                }} 
                onClick={() => setActiveTab('coverLetters')}
              >
                Cover Letters
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
              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#e2e8f0', padding: '1rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                  <button className="btn btn-primary" onClick={downloadResumePDF} style={{ gap: '0.4rem', boxShadow: 'var(--shadow-sm)' }}>
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
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)', 
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
    </div>
  );
}

export default ResumeBuilder;
