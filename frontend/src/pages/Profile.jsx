import { useState, useEffect, useRef } from 'react';
import {
  User, Target, FileText, Linkedin, Github, Globe,
  Check, AlertCircle, Briefcase, Sparkles, BookOpen
} from 'lucide-react';
import { api, SERVER_BASE_URL } from '../services/api';
import { storage } from '../services/storage';

const DEFAULT_PROFILE = {
  name: '', role: '', experience: '', bio: '',
  linkedin: '', github: '', portfolio: '',
  skills: [],
  preferences: { location: '', salary: '', type: '', remote: false }
};

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
  const r = 38, cx = 46, cy = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#4f46e5';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="7" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="46" y="44" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="800">{pct}%</text>
        <text x="46" y="58" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontWeight="600">PROFILE</text>
      </svg>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ status }) {
  if (status === 'idle') return null;
  const isSuccess = status === 'success';
  return (
    <div style={{
      position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '0.65rem',
      padding: '0.85rem 1.25rem', borderRadius: '12px',
      backgroundColor: '#ffffff',
      color: isSuccess ? '#065f46' : '#991b1b',
      border: `1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`,
      fontWeight: '600', fontSize: '13px',
      boxShadow: 'var(--shadow-xl)',
      animation: 'slideInRight 0.3s ease'
    }}>
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        backgroundColor: isSuccess ? '#dcfce7' : '#fee2e2',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {isSuccess ? <Check size={14} style={{ color: '#16a34a' }} /> : <AlertCircle size={14} style={{ color: '#dc2626' }} />}
      </div>
      <span>{isSuccess ? 'Profile saved successfully!' : 'Save failed — please try again.'}</span>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: '140px',
      padding: '1.25rem 1.35rem', borderRadius: '16px',
      border: '1px solid var(--border-color)',
      background: 'var(--card-bg)',
      display: 'flex', flexDirection: 'column', gap: '0.35rem',
      boxShadow: 'var(--shadow-xs)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      <span style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function Profile() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
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
      const merged = { ...DEFAULT_PROFILE, ...data, skills };
      setProfile(merged);
      storage.saveProfile(merged);
    });

    // Career stats
    const jobs = storage.getTrackerJobs();
    const appCount = Object.values(jobs).flat().length;

    Promise.all([
      api.fetchQuestions({}).catch(() => []),
      api.getResumes().catch(() => [])
    ]).then(([qs, rs]) => {
      setStats({
        applications: appCount,
        questions: Array.isArray(qs) ? qs.length : 0,
        resumes: Array.isArray(rs) ? rs.length : 0
      });
    });
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
      storage.saveProfile(profile);
      if (resumeFile) {
        try {
          const parsed = await api.uploadResumeAndParse(resumeFile);
          if (parsed) {
            const newSkills = Array.isArray(parsed.skills) && parsed.skills.length > 0
              ? parsed.skills.map(s => typeof s === 'string' ? { name: s, level: 'Intermediate' } : s)
              : profile.skills;
            
            const updated = {
              ...profile,
              name: profile.name || parsed.name || '',
              role: profile.role || parsed.role || '',
              bio: profile.bio || parsed.summary || '',
              linkedin: profile.linkedin || parsed.linkedin || '',
              skills: profile.skills?.length > 0 ? profile.skills : newSkills,
              resumePath: parsed.path || (parsed.filename ? `/uploads/${parsed.filename}` : profile.resumePath)
            };
            setProfile(updated);
            storage.saveProfile(updated);
            await api.updateProfile(updated);
          }
        } catch {
          const res = await api.uploadResume(resumeFile);
          const updated = { ...profile, resumePath: res.resumePath };
          setProfile(updated);
          storage.saveProfile(updated);
        }
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
    { id: 'personal', label: 'Personal Details', icon: <User size={15} /> },
    { id: 'preferences', label: 'Job Preferences', icon: <Target size={15} /> },
    { id: 'resume', label: 'Resume & Documents', icon: <FileText size={15} /> },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .profile-tab-pill {
          display: flex; align-items: center; gap: 0.45rem;
          padding: 0.55rem 1.25rem; border-radius: 10px;
          cursor: pointer; font-weight: 600; font-size: 13px;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          background: transparent; color: #64748b;
        }
        .profile-tab-pill:hover { color: var(--text-main); background: var(--surface-alt); }
        .profile-tab-pill.active {
          background: var(--surface); color: var(--primary);
          box-shadow: var(--shadow-sm); border-color: rgba(79, 70, 229, 0.2); font-weight: 700;
        }
        .skill-tag-modern {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.35rem 0.75rem; border-radius: 9999px;
          border: 1px solid var(--border-color); font-size: 12px;
          background: var(--surface); color: var(--text-main); box-shadow: var(--shadow-xs);
        }
        .level-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      `}</style>

      <Toast status={saveStatus} />

      {/* ── Modern Profile Cover Banner ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e40af 100%)',
        color: '#ffffff', padding: '2rem 2.25rem',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {/* Glow ambient background elements */}
        <div style={{
          position: 'absolute', top: '-50%', right: '10%', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
          {/* Avatar with Halo Ring */}
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: '800', color: '#ffffff',
            boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.25), 0 8px 24px rgba(0,0,0,0.3)',
            flexShrink: 0
          }}>
            {getInitials(profile.name)}
          </div>

          {/* Name + Role Details */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', fontSize: '11px', fontWeight: '700', marginBottom: '0.4rem', color: '#e0e7ff' }}>
              <Sparkles size={11} style={{ color: '#fbbf24' }} /> Candidate Profile
            </div>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
              {profile.name || 'Set Your Name'}
            </h2>
            <p style={{ margin: 0, color: '#e0e7ff', fontSize: '0.95rem', fontWeight: '500' }}>
              {profile.role || 'Add your target job title'}{profile.experience ? ` · ${profile.experience} years experience` : ''}
            </p>

            {/* Social quick links */}
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', padding: '0.25rem 0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.12)', color: '#ffffff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <Linkedin size={12} /> LinkedIn
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', padding: '0.25rem 0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.12)', color: '#ffffff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <Github size={12} /> GitHub
                </a>
              )}
              {profile.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', padding: '0.25rem 0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.12)', color: '#ffffff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <Globe size={12} /> Portfolio
                </a>
              )}
            </div>
          </div>

          {/* Completeness Ring */}
          <CompletenessRing pct={pct} />
        </div>
      </div>

      {/* Career Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard icon={<Briefcase size={20} />} label="Applications Tracked" value={stats.applications} color="#3b82f6" />
        <StatCard icon={<BookOpen size={20} />} label="Questions in Prep Hub" value={stats.questions} color="#8b5cf6" />
        <StatCard icon={<FileText size={20} />} label="Resumes Formatted" value={stats.resumes} color="#10b981" />
      </div>

      {/* ── Segmented Pill Tabs ── */}
      <div style={{
        display: 'flex', gap: '4px', backgroundColor: 'var(--surface-alt)',
        padding: '5px', borderRadius: '14px', border: '1px solid var(--border-color)'
      }}>
        {TABS.map(t => (
          <button key={t.id} className={`profile-tab-pill ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '2rem', borderRadius: '18px', boxShadow: 'var(--shadow-sm)' }}>

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
                <a href={`${SERVER_BASE_URL}${profile.resumePath}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}>View</a>
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
                  <iframe src={`${SERVER_BASE_URL}${profile.resumePath}`} width="100%" height="420px" style={{ border: 'none' }} title="Resume Preview" />
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
