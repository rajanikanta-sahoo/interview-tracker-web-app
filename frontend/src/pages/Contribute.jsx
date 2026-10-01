import { useState, useEffect, useRef } from 'react';
import {
  Briefcase, BookOpen, UploadCloud, Check, AlertCircle, Trash2,
  Plus, Sparkles, Eye, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../services/api';

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const isSuccess = type === 'success';
  return (
    <div style={{
      position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
      padding: '0.85rem 1.25rem', borderRadius: '12px',
      backgroundColor: '#ffffff',
      color: isSuccess ? '#065f46' : '#991b1b',
      border: `1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`,
      fontWeight: '600', fontSize: '13px',
      boxShadow: 'var(--shadow-xl)',
      animation: 'slideInRight 0.3s ease',
      display: 'flex', alignItems: 'center', gap: '0.65rem'
    }}>
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        backgroundColor: isSuccess ? '#dcfce7' : '#fee2e2',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {isSuccess ? <Check size={14} style={{ color: '#16a34a' }} /> : <AlertCircle size={14} style={{ color: '#dc2626' }} />}
      </div>
      <span>{msg}</span>
    </div>
  );
}

// ── Stats Header ──────────────────────────────────────────────────────────────
function StatsHeader({ questions, jobs }) {
  const files = questions.filter(q => q.type === 'file').length;
  const items = [
    { icon: <BookOpen size={20} />, label: 'Questions in Hub', value: questions.length, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { icon: <Briefcase size={20} />, label: 'Community Jobs', value: jobs.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { icon: <UploadCloud size={20} />, label: 'Document Uploads', value: files, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
      {items.map(s => (
        <div key={s.label} className="card" style={{
          padding: '1.25rem 1.4rem', borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: '1rem',
          boxShadow: 'var(--shadow-xs)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
        >
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: s.bg, color: s.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {s.icon}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Live Job Preview Card ─────────────────────────────────────────────────────
function JobPreviewCard({ form }) {
  const hasContent = form.title || form.company;
  if (!hasContent) return (
    <div style={{
      padding: '1.75rem 1rem', border: '1.5px dashed #cbd5e1', borderRadius: '14px',
      textAlign: 'center', color: '#94a3b8', fontSize: '12.5px',
      backgroundColor: '#f8fafc'
    }}>
      <Eye size={24} style={{ color: '#94a3b8', marginBottom: '0.35rem' }} />
      <p style={{ margin: 0, fontWeight: '600', color: '#64748b' }}>Live Card Preview</p>
      <p style={{ margin: '0.2rem 0 0', fontSize: '11.5px' }}>Fill in the form to see how candidates see this job</p>
    </div>
  );
  return (
    <div style={{
      padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(79, 70, 229, 0.25)',
      background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', fontWeight: '800' }}>
          Live Preview
        </span>
        {form.type && (
          <span style={{ fontSize: '10.5px', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: '600' }}>
            {form.type}
          </span>
        )}
      </div>
      <h4 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>{form.title || 'Job Title'}</h4>
      <p style={{ margin: '0 0 0.65rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{form.company || 'Company Name'}</p>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
        {form.location && <span style={{ fontSize: '11px', padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '500' }}>📍 {form.location}</span>}
        {form.salaryMin && <span style={{ fontSize: '11px', padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontWeight: '700' }}>💰 {form.salaryMin}{form.salaryMax ? ` – ${form.salaryMax}` : '+'}</span>}
      </div>
      {form.skills.length > 0 && (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {form.skills.map(s => <span key={s} style={{ fontSize: '11px', padding: '0.15rem 0.5rem', borderRadius: '6px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '500' }}>{s}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Contribution History Feed ─────────────────────────────────────────────────
function HistoryFeed({ questions, jobs, onDeleteQuestion, onDeleteJob }) {
  const all = [
    ...questions.map(q => ({ ...q, _kind: 'question' })),
    ...jobs.map(j => ({ ...j, _kind: 'job' })),
  ].sort((a, b) => (b.id > a.id ? 1 : -1));

  if (all.length === 0) return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
      <Layers size={32} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>No contributions recorded yet</p>
      <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Submit a new interview question or custom role above to see it here.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
      {all.map(item => (
        <div key={item.id} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 0.95rem', borderRadius: '12px',
          border: '1px solid var(--border-color)', background: '#ffffff',
          boxShadow: 'var(--shadow-xs)',
          borderLeft: `4px solid ${item._kind === 'question' ? '#8b5cf6' : '#3b82f6'}`,
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: item._kind === 'question' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)',
            color: item._kind === 'question' ? '#8b5cf6' : '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {item._kind === 'question' ? (item.type === 'file' ? <UploadCloud size={16} /> : <BookOpen size={16} />) : <Briefcase size={16} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item._kind === 'question' ? (item.text || item.originalName || 'Uploaded Document') : `${item.title} — ${item.company}`}
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              {item.group && <span style={{ fontSize: '10.5px', padding: '0.1rem 0.45rem', borderRadius: '6px', background: '#f3e8ff', color: '#7c3aed', fontWeight: '600' }}>{item.group}</span>}
              {item.difficulty && (
                <span style={{ fontSize: '10.5px', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: '700',
                  background: item.difficulty === 'Hard' ? '#fee2e2' : item.difficulty === 'Medium' ? '#fef3c7' : '#dcfce7',
                  color: item.difficulty === 'Hard' ? '#991b1b' : item.difficulty === 'Medium' ? '#92400e' : '#166534',
                }}>{item.difficulty}</span>
              )}
              {item.role && item.role !== 'General' && <span style={{ fontSize: '10.5px', padding: '0.1rem 0.45rem', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontWeight: '600' }}>{item.role}</span>}
            </div>
          </div>
          {item._kind === 'question' ? (
            <button onClick={() => onDeleteQuestion(item.id)}
              style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', width: '28px', height: '28px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Delete Question">
              <Trash2 size={13} />
            </button>
          ) : (
            <button onClick={() => onDeleteJob(item.id)}
              style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', width: '28px', height: '28px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Delete Custom Job">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const EMPTY_JOB = { title: '', company: '', department: '', location: '', description: '', type: '', salaryMin: '', salaryMax: '', url: '', skills: [] };
const EMPTY_Q = { group: '', keyAreas: '', difficulty: '', text: '', role: '' };

function Contribute() {
  const [jobForm, setJobForm]       = useState(EMPTY_JOB);
  const [skillInput, setSkillInput] = useState('');
  const [qForm, setQForm]           = useState(EMPTY_Q);
  const [qFile, setQFile]           = useState(null);
  const [qTab, setQTab]             = useState('text'); // 'text' | 'bulk' | 'file'
  const [bulkText, setBulkText]     = useState('');
  const [dragging, setDragging]     = useState(false);
  const fileRef                     = useRef(null);

  const [questions, setQuestions]   = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [toast, setToast]           = useState({ msg: '', type: 'success' });
  const toastTimer                  = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const loadHistory = async () => {
    try {
      const [qs, js] = await Promise.all([api.fetchQuestions({}), api.fetchJobs('', '', false)]);
      setQuestions(Array.isArray(qs) ? qs : []);
      setJobs(Array.isArray(js) ? js.filter(j => j.isCustom) : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [qs, js] = await Promise.all([api.fetchQuestions({}), api.fetchJobs('', '', false)]);
        if (!ignore) {
          setQuestions(Array.isArray(qs) ? qs : []);
          setJobs(Array.isArray(js) ? js.filter(j => j.isCustom) : []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
    return () => { ignore = true; };
  }, []);

  // ── Job form ──
  const handleJobChange = (e) => {
    const { name, value } = e.target;
    setJobForm(p => ({ ...p, [name]: value }));
  };

  const addSkill = (e) => {
    e.preventDefault();
    const tags = skillInput.split(',').map(s => s.trim()).filter(Boolean);
    const newSkills = tags.filter(t => !jobForm.skills.includes(t));
    if (newSkills.length) setJobForm(p => ({ ...p, skills: [...p.skills, ...newSkills] }));
    setSkillInput('');
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addCustomJob({ ...jobForm, isCustom: true });
      showToast('Job opening added successfully!');
      setJobForm(EMPTY_JOB);
      setSkillInput('');
      loadHistory();
    } catch { showToast('Failed to add job. Please try again.', 'error'); }
  };

  // ── Question form ──
  const handleQChange = (e) => {
    const { name, value } = e.target;
    setQForm(p => ({ ...p, [name]: value }));
  };

  const handleQSubmit = async (e) => {
    e.preventDefault();
    const meta = { group: qForm.group, keyAreas: qForm.keyAreas, difficulty: qForm.difficulty, role: qForm.role || 'General' };
    try {
      if (qTab === 'text') {
        if (!qForm.text.trim()) return showToast('Please enter a question.', 'error');
        await api.addQuestionText({ ...meta, text: qForm.text });
        setQForm(EMPTY_Q);
        showToast('Question added successfully!');
      } else if (qTab === 'bulk') {
        const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) return showToast('No questions found. Enter one per line.', 'error');
        await Promise.all(lines.map(text => api.addQuestionText({ ...meta, text })));
        setBulkText('');
        showToast(`${lines.length} question${lines.length > 1 ? 's' : ''} added!`);
      } else {
        if (!qFile) return showToast('Please select a file.', 'error');
        await api.uploadQuestionFile(meta, qFile);
        setQFile(null);
        showToast('File uploaded successfully!');
      }
      loadHistory();
    } catch { showToast('Submission failed. Please try again.', 'error'); }
  };

  const deleteQuestion = async (id) => {
    try {
      await api.deleteQuestion(id);
      showToast('Question deleted.', 'success');
      loadHistory();
    } catch { showToast('Could not delete question.', 'error'); }
  };

  const deleteJob = async (id) => {
    try {
      await api.deleteCustomJob(id);
      showToast('Custom job deleted.', 'success');
      loadHistory();
    } catch { showToast('Could not delete job.', 'error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Page Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', marginBottom: '0.4rem' }}>
          <Sparkles size={12} /> Community Knowledge Base
        </div>
        <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
          Contribute & Publish
        </h1>
        <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          Publish custom job opportunities and expand interview question sets for the community.
        </p>
      </div>

      <StatsHeader questions={questions} jobs={jobs} />

      {/* ── Two-column forms studio ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }}>

        {/* ════ Job Opening Form ════ */}
        <div className="card" style={{ padding: '1.75rem', borderRadius: '18px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={17} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>Add Custom Job Opening</h2>
          </div>
          <form onSubmit={handleJobSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="text-sm">Job Title *</label>
                <input required className="input" name="title" value={jobForm.title} onChange={handleJobChange} placeholder="Senior Java Developer" />
              </div>
              <div>
                <label className="text-sm">Company *</label>
                <input required className="input" name="company" value={jobForm.company} onChange={handleJobChange} placeholder="Google" />
              </div>
              <div>
                <label className="text-sm">Department</label>
                <input className="input" name="department" value={jobForm.department} onChange={handleJobChange} placeholder="Engineering" />
              </div>
              <div>
                <label className="text-sm">Location</label>
                <input className="input" name="location" value={jobForm.location} onChange={handleJobChange} placeholder="Bangalore / Remote" />
              </div>
              <div>
                <label className="text-sm">Job Type</label>
                <select className="input" name="type" value={jobForm.type} onChange={handleJobChange}>
                  <option value="">Select...</option>
                  {['Full-Time','Part-Time','Contract','Remote','Hybrid'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm">Salary Range</label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <input className="input" name="salaryMin" value={jobForm.salaryMin} onChange={handleJobChange} placeholder="Min" style={{ flex: 1 }} />
                  <input className="input" name="salaryMax" value={jobForm.salaryMax} onChange={handleJobChange} placeholder="Max" style={{ flex: 1 }} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm">Job Posting URL</label>
              <input className="input" name="url" value={jobForm.url} onChange={handleJobChange} placeholder="https://careers.example.com/..." />
            </div>

            <div>
              <label className="text-sm">Job Description</label>
              <textarea className="input" name="description" rows={3} value={jobForm.description} onChange={handleJobChange}
                placeholder="Brief description of the role..."
                style={{ resize: 'vertical', padding: '0.5rem', lineHeight: '1.4' }} />
            </div>

            {/* Required skills */}
            <div>
              <label className="text-sm">Required Skills</label>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                {jobForm.skills.map(s => (
                  <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', fontSize: '0.76rem', color: '#3b82f6' }}>
                    {s}
                    <span style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setJobForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }))}>×</span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input className="input" value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="React, Spring Boot (comma-separated)" onKeyDown={e => e.key === 'Enter' && addSkill(e)} style={{ flex: 1 }} />
                <button type="button" className="btn btn-outline" onClick={addSkill} style={{ height: '38px', padding: '0 0.75rem' }}>Add</button>
              </div>
            </div>

            {/* Live preview */}
            <JobPreviewCard form={jobForm} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setJobForm(EMPTY_JOB); setSkillInput(''); }}>Reset</button>
              <button type="submit" className="btn btn-primary">Create Job</button>
            </div>
          </form>
        </div>

        {/* ════ Question Form ════ */}
        <div className="card" style={{ padding: '1.75rem', borderRadius: '18px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={17} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>Add Interview Questions</h2>
          </div>
          <form onSubmit={handleQSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="text-sm">Question Group *</label>
                <input required className="input" name="group" value={qForm.group} onChange={handleQChange} placeholder="Core Java, Spring Boot..." />
              </div>
              <div>
                <label className="text-sm">Target Role</label>
                <input className="input" name="role" value={qForm.role} onChange={handleQChange} placeholder="Java Developer, SDE-2..." />
              </div>
              <div>
                <label className="text-sm">Key Areas</label>
                <input className="input" name="keyAreas" value={qForm.keyAreas} onChange={handleQChange} placeholder="Multithreading, MVC..." />
              </div>
              <div>
                <label className="text-sm">Difficulty</label>
                <select className="input" name="difficulty" value={qForm.difficulty} onChange={handleQChange}>
                  <option value="">Select...</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Input mode pill tabs */}
            <div style={{
              display: 'flex', gap: '4px', backgroundColor: '#f1f5f9',
              padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '0.25rem'
            }}>
              {[
                { key: 'text', label: 'Single Question' },
                { key: 'bulk', label: 'Bulk Paste' },
                { key: 'file', label: 'Upload File' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setQTab(tab.key)}
                  style={{
                    flex: 1, padding: '0.35rem 0.5rem', borderRadius: '7px', fontSize: '12px', fontWeight: '700',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                    backgroundColor: qTab === tab.key ? '#ffffff' : 'transparent',
                    color: qTab === tab.key ? 'var(--primary)' : '#64748b',
                    boxShadow: qTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {qTab === 'text' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-sm" style={{ fontWeight: '600' }}>Question Text *</label>
                  <span className="text-sm" style={{ color: qForm.text.length > 400 ? '#ef4444' : 'var(--text-muted)' }}>{qForm.text.length} chars</span>
                </div>
                <textarea required className="input" name="text" rows={6} value={qForm.text} onChange={handleQChange}
                  placeholder="Type or paste an interview question here..."
                  style={{ resize: 'vertical', padding: '0.65rem', lineHeight: '1.5' }} />
              </div>
            )}

            {qTab === 'bulk' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-sm" style={{ fontWeight: '600' }}>One question per line</label>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {bulkText.split('\n').filter(l => l.trim()).length} question{bulkText.split('\n').filter(l => l.trim()).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <textarea className="input" rows={8} value={bulkText} onChange={e => setBulkText(e.target.value)}
                  placeholder={"What is the difference between HashMap and ConcurrentHashMap?\nExplain the Java memory model.\nWhat are SOLID principles?"}
                  style={{ resize: 'vertical', padding: '0.65rem', lineHeight: '1.6', fontFamily: 'monospace', fontSize: '0.82rem' }} />
                <p className="text-sm text-muted" style={{ margin: '0.3rem 0 0' }}>Each non-empty line will be saved as a separate question in the same group.</p>
              </div>
            )}

            {qTab === 'file' && (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setQFile(f); }}
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '2.25rem 1.5rem', borderRadius: '14px', textAlign: 'center', cursor: 'pointer',
                  border: `2px dashed ${dragging ? 'var(--primary)' : '#cbd5e1'}`,
                  background: dragging ? 'rgba(79,70,229,0.06)' : '#f8fafc',
                  transition: 'all 0.2s',
                }}
              >
                <UploadCloud size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                {qFile
                  ? <p style={{ margin: 0, fontWeight: '700', color: 'var(--primary)' }}>📎 {qFile.name}</p>
                  : <>
                    <p style={{ margin: '0 0 0.2rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '13.5px' }}>Drag & drop a questions document</p>
                    <p className="text-muted text-sm" style={{ margin: 0 }}>or click to browse — PDF or DOC supported</p>
                  </>
                }
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setQFile(e.target.files[0])} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn btn-outline" style={{ borderRadius: '10px' }} onClick={() => { setQForm(EMPTY_Q); setBulkText(''); setQFile(null); }}>Reset</button>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px', gap: '0.35rem' }}>
                <Plus size={15} /> {qTab === 'text' ? 'Save Question' : qTab === 'bulk' ? 'Save All Questions' : 'Upload File'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Contribution History ── */}
      <div className="card" style={{ padding: '1.75rem', borderRadius: '18px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={17} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>Your Published Contributions</h2>
          </div>
          <button className="btn btn-outline" style={{ fontSize: '12px', padding: '0.35rem 0.85rem', height: '34px', borderRadius: '8px', gap: '0.35rem' }} onClick={loadHistory}>
            <RefreshCw size={13} /> Refresh List
          </button>
        </div>
        <HistoryFeed questions={questions} jobs={jobs} onDeleteQuestion={deleteQuestion} onDeleteJob={deleteJob} />
      </div>
    </div>
  );
}

export default Contribute;
