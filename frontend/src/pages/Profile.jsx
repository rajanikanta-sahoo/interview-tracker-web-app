import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';

// ── helpers ──────────────────────────────────────────────────────────────────
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Expert'];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function computeCompleteness(profile) {
  const checks = [
    profile.name,
    profile.role,
    profile.experience,
    profile.bio,
    profile.skills?.length > 0,
    profile.linkedin,
    profile.github,
    profile.preferences?.location,
    profile.preferences?.salary,
    profile.preferences?.type,
    profile.resumePath,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

// ── SVG Completeness Ring ─────────────────────────────────────────────────────
function CompletenessRing({ pct }) {
  const r = 40, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#3b82f6';
  return (
    <svg width="110" height="110" viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-color)" strokeWidth="8" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50" y="46" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold">{pct}%</text>
      <text x="50" y="60" textAnchor="middle" fill="var(--text-muted)" fontSize="9">complete</text>
    </svg>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ status }) {
  if (status === 'idle') return null;
  const isSuccess = status === 'success';
  return (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      padding: '0.8rem 1.25rem', borderRadius: '10px',
      backgroundColor: isSuccess ? '#10b981' : '#ef4444',
      color: '#fff', fontWeight: '600', fontSize: '0.9rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      animation: 'slideInRight 0.3s ease'
    }}>
      {isSuccess ? '✓ Profile saved successfully!' : '✕ Save failed — please try again.'}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: '120px',
      padding: '1.25rem', borderRadius: '12px',
      border: '1px solid var(--border-color)',
      background: 'var(--card-bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
      transition: 'transform 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <span style={{ fontSize: '1.6rem' }}>{icon}</span>
      <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color }}>{value}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function Profile() {
  const defaultProfile = {
    name: '', role: '', experience: '', bio: '',
    linkedin: '', github: '', portfolio: '',
    skills: [],
    preferences: { location: '', salary: '', type: '', remote: false }
  };

  const [profile, setProfile] = useState(defaultProfile);
  const [activeTab, setActiveTab] = useState('personal');
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('Intermediate');
  const [resumeFile, setResumeFile] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | success | error
  const [stats, setStats] = useState({ applications: 0, questions: 0, resumes: 0 });
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    api.fetchProfile().then(data => {
      // Normalise legacy skills (string[]) → {name,level}[]
      const skills = (data.skills || []).map(s =>
        typeof s === 'string' ? { name: s, level: 'Intermediate' } : s
      );
      setProfile({ ...defaultProfile, ...data, skills });
    });

    // Career stats
    const jobs = storage.getTrackerJobs();
    const appCount = Object.values(jobs).flat().length;
    const qCount = JSON.parse(localStorage.getItem('questionsBank') || '[]').length;
    // questions count from backend via api
    api.fetchQuestions({}).then(qs => {
      setStats({ applications: appCount, questions: qs.length, resumes: 0 });
    }).catch(() => setStats({ applications: appCount, questions: 0, resumes: 0 }));

    // resumes count from backend
    api.getResumes().then(rs => {
      setStats(prev => ({ ...prev, resumes: rs.length }));
    }).catch(() => {});
  }, []);

  const pct = computeCompleteness(profile);

  // ── Field change ──
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('pref_')) {
      const key = name.slice(5);
      setProfile(p => ({ ...p, preferences: { ...p.preferences, [key]: type === 'checkbox' ? checked : value } }));
    } else {
      setProfile(p => ({ ...p, [name]: value }));
    }
  };

  // ── Skills ──
  const addSkill = (e) => {
    e.preventDefault();
    const names = skillInput.split(',').map(s => s.trim()).filter(Boolean);
    if (!names.length) return;
    const newSkills = names
      .filter(n => !profile.skills.find(s => s.name.toLowerCase() === n.toLowerCase()))
      .map(name => ({ name, level: skillLevel }));
    setProfile(p => ({ ...p, skills: [...p.skills, ...newSkills] }));
    setSkillInput('');
  };

  const removeSkill = (name) => {
    setProfile(p => ({ ...p, skills: p.skills.filter(s => s.name !== name) }));
  };

  const changeSkillLevel = (name, level) => {
    setProfile(p => ({
      ...p,
      skills: p.skills.map(s => s.name === name ? { ...s, level } : s)
    }));
  };

  // ── Save ──
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await api.updateProfile(profile);
      if (resumeFile) {
        const res = await api.uploadResume(resumeFile);
        setProfile(p => ({ ...p, resumePath: res.resumePath }));
        setResumeFile(null);
      }
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    }
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setSaveStatus('idle'), 3000);
  };

  // ── Drag-and-drop ──
  const [dragging, setDragging] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setResumeFile(file);
  };

  const levelColor = { Beginner: '#3b82f6', Intermediate: '#f59e0b', Expert: '#10b981' };

  const TABS = [
    { id: 'personal', label: '👤 Personal Info' },
    { id: 'preferences', label: '🎯 Job Preferences' },
    { id: 'resume', label: '📄 Resume & Docs' },
  ];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .profile-tab { background: none; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; color: var(--text-muted); }
        .profile-tab:hover { background: var(--border-color); color: var(--text-color); }
        .profile-tab.active { background: var(--primary); color: #fff; }
        .skill-tag { display: flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.65rem; border-radius: 20px; border: 1.5px solid var(--border-color); font-size: 0.8rem; background: var(--card-bg); }
        .level-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .social-field { display: flex; align-items: center; gap: 0.6rem; }
        .social-icon { width: 36px; height: 36px; border-radius: 8px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; }
      `}</style>

      <Toast status={saveStatus} />

      {/* ── Profile Header ── */}
      <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Avatar */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 'bold', color: '#fff',
            boxShadow: '0 4px 16px rgba(59,130,246,0.35)', flexShrink: 0
          }}>
            {getInitials(profile.name)}
          </div>

          {/* Name + role */}
          <div style={{ textAlign: 'left', flex: 1 }}>
            <h2 style={{ margin: 0 }}>{profile.name || 'Your Name'}</h2>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)' }}>
              {profile.role || 'Your Role'}{profile.experience ? ` · ${profile.experience} yrs exp` : ''}
            </p>
            {/* Social quick-links */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#0077b5', textDecoration: 'none' }}>🔗 LinkedIn</a>}
              {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>🐙 GitHub</a>}
              {profile.portfolio && <a href={profile.portfolio} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}>🌐 Portfolio</a>}
            </div>
          </div>

          {/* Completeness ring */}
          <CompletenessRing pct={pct} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <StatCard icon="📋" label="Applications Tracked" value={stats.applications} color="#3b82f6" />
          <StatCard icon="📝" label="Questions in Prep Hub" value={stats.questions} color="#8b5cf6" />
          <StatCard icon="📄" label="Resumes Built" value={stats.resumes} color="#10b981" />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} className={`profile-tab${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">

        {/* ════ TAB: Personal Info ════ */}
        {activeTab === 'personal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Personal Information</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="text-sm">Full Name</label>
                <input className="input" name="name" value={profile.name} onChange={handleChange} placeholder="Rajanikanta Sahoo" />
              </div>
              <div>
                <label className="text-sm">Current Role</label>
                <input className="input" name="role" value={profile.role} onChange={handleChange} placeholder="Java Developer" />
              </div>
              <div>
                <label className="text-sm">Years of Experience</label>
                <input className="input" type="number" name="experience" value={profile.experience} onChange={handleChange} placeholder="9" min="0" />
              </div>
            </div>

            <div>
              <label className="text-sm">Professional Bio</label>
              <textarea
                className="input" name="bio" rows={3}
                value={profile.bio || ''} onChange={handleChange}
                placeholder="A short summary about your expertise, goals, and what you bring to the table..."
                style={{ padding: '0.5rem', resize: 'vertical', lineHeight: '1.5' }}
              />
            </div>

            {/* Social Links */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem' }}>Social & Portfolio Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="social-field">
                  <div className="social-icon" style={{ background: 'rgba(0,119,181,0.12)', color: '#0077b5' }}>in</div>
                  <input className="input" name="linkedin" value={profile.linkedin || ''} onChange={handleChange} placeholder="https://linkedin.com/in/yourprofile" />
                </div>
                <div className="social-field">
                  <div className="social-icon" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-color)' }}>🐙</div>
                  <input className="input" name="github" value={profile.github || ''} onChange={handleChange} placeholder="https://github.com/yourusername" />
                </div>
                <div className="social-field">
                  <div className="social-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary)' }}>🌐</div>
                  <input className="input" name="portfolio" value={profile.portfolio || ''} onChange={handleChange} placeholder="https://yourportfolio.dev" />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem' }}>Key Skills</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {profile.skills.map(s => (
                  <div key={s.name} className="skill-tag">
                    <div className="level-dot" style={{ backgroundColor: levelColor[s.level] || '#3b82f6' }} />
                    <span>{s.name}</span>
                    <select
                      value={s.level}
                      onChange={e => changeSkillLevel(s.name, e.target.value)}
                      style={{ fontSize: '0.7rem', border: 'none', background: 'transparent', color: levelColor[s.level], fontWeight: '600', cursor: 'pointer', padding: 0 }}
                    >
                      {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <span style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1 }} onClick={() => removeSkill(s.name)}>×</span>
                  </div>
                ))}
                {profile.skills.length === 0 && <p className="text-muted text-sm" style={{ margin: 0 }}>No skills added yet.</p>}
              </div>
              <form onSubmit={addSkill} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input className="input" style={{ flex: 1, minWidth: '160px' }} placeholder="React, Node.js, Java  (comma-separated)" value={skillInput} onChange={e => setSkillInput(e.target.value)} />
                <select className="input" style={{ width: 'auto' }} value={skillLevel} onChange={e => setSkillLevel(e.target.value)}>
                  {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button type="submit" className="btn btn-outline">Add</button>
              </form>
              <p className="text-sm text-muted" style={{ marginTop: '0.4rem' }}>Tip: Enter multiple skills separated by commas.</p>
            </div>
          </div>
        )}

        {/* ════ TAB: Job Preferences ════ */}
        {activeTab === 'preferences' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Job Preferences</h3>
            <p className="text-muted text-sm" style={{ margin: 0 }}>These preferences are used to auto-fill filters in the Job Search page.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="text-sm">Preferred Location</label>
                <input className="input" name="pref_location" value={profile.preferences?.location || ''} onChange={handleChange} placeholder="Bhubaneswar, Bangalore..." />
              </div>
              <div>
                <label className="text-sm">Minimum Salary (₹ / yr)</label>
                <input className="input" name="pref_salary" value={profile.preferences?.salary || ''} onChange={handleChange} placeholder="e.g. 1200000" />
              </div>
              <div>
                <label className="text-sm">Job Type</label>
                <select className="input" name="pref_type" value={profile.preferences?.type || ''} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox" name="pref_remote"
                checked={profile.preferences?.remote || false}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Open to relocation</span>
            </label>

            <div style={{ padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(59,130,246,0.04)' }}>
              <p className="text-sm" style={{ margin: 0, color: 'var(--text-muted)' }}>
                💡 <strong>Current preferences:</strong>&nbsp;
                {[
                  profile.preferences?.type,
                  profile.preferences?.location && `in ${profile.preferences.location}`,
                  profile.preferences?.salary && `min ₹${Number(profile.preferences.salary).toLocaleString('en-IN')}`,
                  profile.preferences?.remote && 'open to relocation'
                ].filter(Boolean).join(' · ') || 'No preferences set yet.'}
              </p>
            </div>
          </div>
        )}

        {/* ════ TAB: Resume & Docs ════ */}
        {activeTab === 'resume' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Resume & Documents</h3>

            {/* Existing resume chip */}
            {profile.resumePath && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #10b981', backgroundColor: 'rgba(16,185,129,0.06)' }}>
                <span style={{ fontSize: '1.2rem' }}>📎</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', color: '#10b981' }}>Resume on file</p>
                  <p className="text-muted text-sm" style={{ margin: 0 }}>{profile.resumePath.split('/').pop()}</p>
                </div>
                <a href={`http://localhost:5001${profile.resumePath}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}>View</a>
              </div>
            )}

            {/* Drag-and-drop upload */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '2.5rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-color)'}`,
                backgroundColor: dragging ? 'rgba(59,130,246,0.06)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📤</p>
              {resumeFile
                ? <p style={{ margin: 0, fontWeight: '600', color: 'var(--primary)' }}>📎 {resumeFile.name}</p>
                : <>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: '600' }}>Drag & drop your resume here</p>
                  <p className="text-muted text-sm" style={{ margin: 0 }}>or click to browse — PDF, DOC, DOCX supported</p>
                </>
              }
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0])} />
            </div>

            {/* PDF preview */}
            {profile.resumePath && profile.resumePath.toLowerCase().endsWith('.pdf') && (
              <div>
                <h4 style={{ margin: '0 0 0.75rem' }}>Document Preview</h4>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe src={`http://localhost:5001${profile.resumePath}`} width="100%" height="420px" style={{ border: 'none' }} title="Resume Preview" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Save Button ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saveStatus === 'saving'} style={{ minWidth: '140px' }}>
            {saveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
