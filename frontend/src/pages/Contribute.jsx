import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
      padding: '0.8rem 1.25rem', borderRadius: '10px',
      backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
      color: '#fff', fontWeight: '600', fontSize: '0.9rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      animation: 'slideInRight 0.3s ease',
    }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  );
}

// ── Stats Header ──────────────────────────────────────────────────────────────
function StatsHeader({ questions, jobs }) {
  const files = questions.filter(q => q.type === 'file').length;
  const items = [
    { icon: '📝', label: 'Questions', value: questions.length, color: '#8b5cf6' },
    { icon: '💼', label: 'Custom Jobs', value: jobs.length, color: '#3b82f6' },
    { icon: '📎', label: 'Files Uploaded', value: files, color: '#f59e0b' },
  ];
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
      {items.map(s => (
        <div key={s.label} style={{
          flex: '1 1 140px', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border-color)', background: 'var(--card-bg)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          transition: 'transform 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
          <div>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold', color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</p>
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
    <div style={{ padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
      <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>👁️</p>
      Fill in the form to see a live preview
    </div>
  );
  return (
    <div style={{
      padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--primary)',
      background: 'rgba(59,130,246,0.04)',
    }}>
      <p style={{ margin: '0 0 0.25rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', fontWeight: '700' }}>Live Preview</p>
      <h4 style={{ margin: '0 0 0.15rem', fontSize: '1rem' }}>{form.title || 'Job Title'}</h4>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>{form.company || 'Company'}</p>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        {form.location && <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>📍 {form.location}</span>}
        {form.type && <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>{form.type}</span>}
        {form.salaryMin && <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>💰 {form.salaryMin}{form.salaryMax ? ` – ${form.salaryMax}` : '+'}</span>}
      </div>
      {form.skills.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {form.skills.map(s => <span key={s} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>{s}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Contribution History Feed ─────────────────────────────────────────────────
function HistoryFeed({ questions, jobs, onDeleteQuestion }) {
  const all = [
    ...questions.map(q => ({ ...q, _kind: 'question' })),
    ...jobs.map(j => ({ ...j, _kind: 'job' })),
  ].sort((a, b) => (b.id > a.id ? 1 : -1));

  if (all.length === 0) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
      <p style={{ fontSize: '1.8rem', margin: 0 }}>📭</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>No contributions yet. Submit a question or job above!</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
      {all.map(item => (
        <div key={item.id} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.7rem 0.9rem', borderRadius: '10px',
          border: '1px solid var(--border-color)', background: 'var(--card-bg)',
          borderLeft: `3.5px solid ${item._kind === 'question' ? '#8b5cf6' : '#3b82f6'}`,
        }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item._kind === 'question' ? (item.type === 'file' ? '📎' : '📝') : '💼'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item._kind === 'question' ? (item.text || item.originalName || 'Uploaded file') : `${item.title} — ${item.company}`}
            </p>
            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
              {item.group && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>{item.group}</span>}
              {item.difficulty && (
                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '8px',
                  background: item.difficulty === 'Hard' ? 'rgba(239,68,68,0.1)' : item.difficulty === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                  color: item.difficulty === 'Hard' ? '#ef4444' : item.difficulty === 'Medium' ? '#f59e0b' : '#10b981',
                }}>{item.difficulty}</span>
              )}
              {item.role && item.role !== 'General' && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-muted)' }}>{item.role}</span>}
              {item.type && item.type !== 'text' && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>file</span>}
            </div>
          </div>
          {item._kind === 'question' && (
            <button onClick={() => onDeleteQuestion(item.id)}
              style={{ background: 'none', border: '1.5px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', width: '26px', height: '26px', fontSize: '0.8rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Delete">✕</button>
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

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const [qs, js] = await Promise.all([api.fetchQuestions({}), api.fetchJobs('', '', false)]);
      setQuestions(Array.isArray(qs) ? qs : []);
      setJobs(Array.isArray(js) ? js.filter(j => j.isCustom) : []);
    } catch (e) { console.error(e); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

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

  const TAB_STYLE = (active) => ({
    flex: 1, padding: '0.5rem', background: 'none', cursor: 'pointer', fontWeight: active ? '700' : 'normal',
    border: 'none', borderBottom: active ? '2.5px solid var(--primary)' : '2px solid transparent',
    color: active ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.85rem', transition: 'all 0.15s',
  });

  return (
    <div>
      <style>{`@keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
      <Toast msg={toast.msg} type={toast.type} />

      <h1 style={{ marginBottom: '0.25rem' }}>Contribute & Evaluate</h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Submit job openings and interview questions to build the knowledge base.</p>

      <StatsHeader questions={questions} jobs={jobs} />

      {/* ── Two-column forms ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

        {/* ════ Job Opening Form ════ */}
        <div className="card">
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>💼 Add Custom Job Opening</h2>
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
        <div className="card">
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>📝 Add Interview Questions</h2>
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

            {/* Input mode tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
              {[['text','✏️ Single'], ['bulk','📋 Bulk Paste'], ['file','📎 Upload File']].map(([key, label]) => (
                <button key={key} type="button" style={TAB_STYLE(qTab === key)} onClick={() => setQTab(key)}>{label}</button>
              ))}
            </div>

            {qTab === 'text' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="text-sm">Question Text *</label>
                  <span className="text-sm" style={{ color: qForm.text.length > 400 ? '#ef4444' : 'var(--text-muted)' }}>{qForm.text.length} chars</span>
                </div>
                <textarea required className="input" name="text" rows={6} value={qForm.text} onChange={handleQChange}
                  placeholder="Type or paste a single interview question here..."
                  style={{ resize: 'vertical', padding: '0.5rem', lineHeight: '1.5' }} />
              </div>
            )}

            {qTab === 'bulk' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="text-sm">One question per line</label>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {bulkText.split('\n').filter(l => l.trim()).length} question{bulkText.split('\n').filter(l => l.trim()).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <textarea className="input" rows={8} value={bulkText} onChange={e => setBulkText(e.target.value)}
                  placeholder={"What is the difference between HashMap and ConcurrentHashMap?\nExplain the Java memory model.\nWhat are SOLID principles?"}
                  style={{ resize: 'vertical', padding: '0.5rem', lineHeight: '1.6', fontFamily: 'monospace', fontSize: '0.82rem' }} />
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
                  padding: '2rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                  border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: dragging ? 'rgba(59,130,246,0.06)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <p style={{ fontSize: '1.8rem', margin: '0 0 0.4rem' }}>📤</p>
                {qFile
                  ? <p style={{ margin: 0, fontWeight: '600', color: 'var(--primary)' }}>📎 {qFile.name}</p>
                  : <>
                    <p style={{ margin: '0 0 0.2rem', fontWeight: '600' }}>Drag & drop a questions file</p>
                    <p className="text-muted text-sm" style={{ margin: 0 }}>or click to browse — PDF or DOC supported</p>
                  </>
                }
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setQFile(e.target.files[0])} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setQForm(EMPTY_Q); setBulkText(''); setQFile(null); }}>Reset</button>
              <button type="submit" className="btn btn-primary">
                {qTab === 'text' ? 'Save Question' : qTab === 'bulk' ? 'Save All Questions' : 'Upload File'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Contribution History ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>📜 Contribution History</h2>
          <button className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', height: '30px' }} onClick={loadHistory}>↻ Refresh</button>
        </div>
        <HistoryFeed questions={questions} jobs={jobs} onDeleteQuestion={deleteQuestion} />
      </div>
    </div>
  );
}

export default Contribute;
