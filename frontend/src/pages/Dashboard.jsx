import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, BookOpen, FileText, Search, User, CheckSquare,
  TrendingUp, Award, Clock, ArrowRight, Upload, Download,
  Check, AlertCircle, X, Sparkles, Target, BarChart3
} from 'lucide-react';
import { storage } from '../services/storage';
import { api } from '../services/api';

// Relative time helper (module-scope for purity)
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', role: '', skills: [], experience: '' });
  const [trackerStats, setTrackerStats] = useState(() => {
    const data = storage.getTrackerJobs();
    return {
      applied: data.applied?.length || 0,
      interviewing: data.interviewing?.length || 0,
      offer: data.offer?.length || 0,
      rejected: data.rejected?.length || 0
    };
  });
  const [recentJobs, setRecentJobs] = useState(() => {
    const data = storage.getTrackerJobs();
    return Object.values(data).flat()
      .filter(j => j.trackedAt || j.appliedDate)
      .sort((a, b) => new Date(b.trackedAt || b.appliedDate) - new Date(a.trackedAt || a.appliedDate))
      .slice(0, 5);
  });
  const [resumeCount, setResumeCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastRef = useRef(null);
  const showToast = (message, type = 'success') => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ show: true, message, type });
    toastRef.current = setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const loadDashboardData = async () => {
    try {
      const [prof, resumes, questions] = await Promise.all([
        api.fetchProfile().catch(() => ({})),
        api.getResumes().catch(() => []),
        api.fetchQuestions().catch(() => [])
      ]);
      setProfile(prof || {});
      setResumeCount(resumes?.length || 0);
      setQuestionCount(questions?.length || 0);

      // Refresh Tracker stats from localStorage
      const data = storage.getTrackerJobs();
      setTrackerStats({
        applied: data.applied?.length || 0,
        interviewing: data.interviewing?.length || 0,
        offer: data.offer?.length || 0,
        rejected: data.rejected?.length || 0
      });
      setRecentJobs(
        Object.values(data).flat()
          .filter(j => j.trackedAt || j.appliedDate)
          .sort((a, b) => new Date(b.trackedAt || b.appliedDate) - new Date(a.trackedAt || a.appliedDate))
          .slice(0, 5)
      );
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function initDashboard() {
      try {
        const [prof, resumes, questions] = await Promise.all([
          api.fetchProfile().catch(() => ({})),
          api.getResumes().catch(() => []),
          api.fetchQuestions().catch(() => [])
        ]);
        if (!ignore) {
          setProfile(prof || {});
          if (prof && Object.keys(prof).length > 0) storage.saveProfile(prof);
          setResumeCount(resumes?.length || 0);
          setQuestionCount(questions?.length || 0);
        }
      } catch (e) {
        console.error('Dashboard load error:', e);
      }
    }
    initDashboard();
    return () => {
      ignore = true;
      if (toastRef.current) clearTimeout(toastRef.current);
    };
  }, []);

  const total = trackerStats.applied + trackerStats.interviewing + trackerStats.offer + trackerStats.rejected;
  const successRate = total > 0 ? Math.round((trackerStats.offer / total) * 100) : 0;

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      storage.importData(file, () => {
        showToast('Data imported successfully!', 'success');
        e.target.value = null;
        loadDashboardData();
      });
    }
  };

  const handleExport = () => {
    storage.exportData();
    showToast('Data exported — check your downloads.', 'success');
  };

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = (profile.name || '').split(' ')[0] || 'there';

  const statusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('interview')) return '#f59e0b';
    if (s.includes('offer')) return '#10b981';
    if (s.includes('reject')) return '#ef4444';
    return '#3b82f6';
  };

  // Quick action cards
  const quickActions = [
    { icon: <Search size={20} />, title: 'Search Jobs', desc: 'Find new opportunities', path: '/jobs', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
    { icon: <FileText size={20} />, title: 'Career Builder', desc: `${resumeCount} resume${resumeCount !== 1 ? 's' : ''} saved`, path: '/resume', color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)' },
    { icon: <BookOpen size={20} />, title: 'Prep Hub', desc: `${questionCount} question${questionCount !== 1 ? 's' : ''} loaded`, path: '/prep', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
    { icon: <CheckSquare size={20} />, title: 'Tracker', desc: 'Manage your pipeline', path: '/tracker', color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      <style>{`
        @keyframes toastIn { from{transform:translateY(-12px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeUp { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
        .dash-card-hover { transition: all 0.2s ease !important; cursor: pointer; }
        .dash-card-hover:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 25px -5px rgba(0,0,0,0.08) !important; }
        .stat-card { transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); }
      `}</style>

      {/* Toast */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.25rem', borderRadius: '12px',
          boxShadow: 'var(--shadow-xl)',
          backgroundColor: toast.type === 'success' ? '#ffffff' : '#ffffff',
          border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: toast.type === 'success' ? '#065f46' : '#991b1b',
          animation: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', fontSize: '13px', fontWeight: '600'
        }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            backgroundColor: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {toast.type === 'success' ? <Check size={14} style={{ color: '#16a34a' }} /> : <AlertCircle size={14} style={{ color: '#dc2626' }} />}
          </div>
          <span>{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: 'success' })}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', marginLeft: '0.5rem' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hero Header with Mesh Gradient */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '2rem 2.25rem', borderRadius: '20px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e40af 80%, #3b82f6 100%)',
        color: 'white', animation: 'fadeUp 0.4s ease-out',
        boxShadow: '0 20px 40px -15px rgba(30, 27, 75, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {/* Ambient glow orbs */}
        <div style={{
          position: 'absolute', top: '-40%', right: '15%', width: '280px', height: '280px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-40%', left: '30%', width: '240px', height: '240px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', marginBottom: '0.75rem' }}>
            <Sparkles size={13} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '11.5px', fontWeight: '600', letterSpacing: '0.02em', color: '#f1f5f9' }}>
              Career Hub · Active Pipeline
            </span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: '800', margin: '0 0 0.4rem 0', letterSpacing: '-0.025em', color: '#ffffff' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p style={{ fontSize: '0.925rem', opacity: 0.88, margin: 0, lineHeight: 1.5, color: '#e0e7ff' }}>
            {profile.role ? (
              <span>Targeting <strong style={{ color: '#ffffff' }}>{profile.role}</strong> · {profile.experience || '0'} years experience</span>
            ) : (
              'Set up your target role and skills to unlock AI-assisted prep & smart matches.'
            )}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.65rem' }}>
          <button className="btn" onClick={() => document.getElementById('import-file').click()}
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)', color: 'white',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.22)',
              fontSize: '12.5px', fontWeight: '600', gap: '0.4rem', padding: '0.55rem 1rem',
              borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
            <Upload size={14} /> Import Data
          </button>
          <input type="file" id="import-file" style={{ display: 'none' }} accept=".json" onChange={handleImport} />
          <button className="btn" onClick={handleExport}
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)', color: 'white',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.22)',
              fontSize: '12.5px', fontWeight: '600', gap: '0.4rem', padding: '0.55rem 1rem',
              borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
            <Download size={14} /> Backup
          </button>
        </div>
      </div>

      {/* KPI Bento Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.15rem', animation: 'fadeUp 0.5s ease-out' }}>
        {[
          { label: 'Total Applications', value: total, sub: 'In pipeline', icon: <Briefcase size={22} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Active Interviews', value: trackerStats.interviewing, sub: 'Requires prep', icon: <Target size={22} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Offers Received', value: trackerStats.offer, sub: 'Target achieved', icon: <Award size={22} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Success Rate', value: `${successRate}%`, sub: 'Conversion rate', icon: <TrendingUp size={22} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map(stat => (
          <div key={stat.label} className="card stat-card" style={{
            padding: '1.35rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.85rem',
            position: 'relative', overflow: 'hidden',
            borderTop: `3px solid ${stat.color}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stat.label}
              </span>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.color, flexShrink: 0
              }}>
                {stat.icon}
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {stat.value}
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
                {stat.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Overview Bento Card */}
      {total > 0 && (
        <div className="card" style={{ padding: '1.5rem', animation: 'fadeUp 0.6s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} style={{ color: 'var(--primary)' }} /> Pipeline Conversion Overview
            </h2>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
              {total} total application{total !== 1 ? 's' : ''} tracked
            </span>
          </div>

          {/* Stacked Modern Bar */}
          <div style={{
            display: 'flex', height: '14px', borderRadius: '9999px',
            overflow: 'hidden', marginBottom: '1.25rem', backgroundColor: '#f1f5f9',
            padding: '2px', gap: '3px'
          }}>
            {[
              { key: 'applied', count: trackerStats.applied, color: '#3b82f6', label: 'Applied' },
              { key: 'interviewing', count: trackerStats.interviewing, color: '#f59e0b', label: 'Interviewing' },
              { key: 'offer', count: trackerStats.offer, color: '#10b981', label: 'Offer' },
              { key: 'rejected', count: trackerStats.rejected, color: '#ef4444', label: 'Rejected' },
            ].filter(s => s.count > 0).map(s => (
              <div
                key={s.key}
                title={`${s.label}: ${s.count} (${Math.round((s.count / total) * 100)}%)`}
                style={{
                  width: `${(s.count / total) * 100}%`,
                  backgroundColor: s.color,
                  borderRadius: '9999px',
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            ))}
          </div>

          {/* Legend Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Applied', count: trackerStats.applied, color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
              { label: 'Interviewing', count: trackerStats.interviewing, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
              { label: 'Offer', count: trackerStats.offer, color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
              { label: 'Rejected', count: trackerStats.rejected, color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
            ].map(item => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.label} style={{
                  padding: '0.75rem 1rem', borderRadius: '10px',
                  backgroundColor: item.bg, border: `1px solid ${item.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>{item.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', display: 'block' }}>{item.count}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Quick Actions + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.25fr', gap: '1.25rem', animation: 'fadeUp 0.65s ease-out' }}>

        {/* Quick Actions */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Quick Hub Shortcuts
            </h2>
            <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '500' }}>Direct access</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', flex: 1 }}>
            {quickActions.map(action => (
              <div
                key={action.path}
                className="dash-card-hover"
                onClick={() => navigate(action.path)}
                style={{
                  padding: '1.15rem', borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--card-bg)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    backgroundColor: action.bg, color: action.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {action.icon}
                  </div>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b'
                  }}>
                    <ArrowRight size={13} />
                  </div>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>{action.title}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{action.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: '#64748b' }} /> Recent Applications
            </h2>
            {recentJobs.length > 0 && (
              <button className="btn btn-outline" onClick={() => navigate('/tracker')}
                style={{ fontSize: '11.5px', padding: '0.3rem 0.75rem', gap: '0.3rem', borderRadius: '8px' }}>
                Open Board <ArrowRight size={12} />
              </button>
            )}
          </div>

          {recentJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
              {recentJobs.map((job, idx) => (
                <div key={job.id || idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0.9rem', borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all 0.15s ease'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '800', color: '#334155', flexShrink: 0
                    }}>
                      {(job.company || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</p>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>{job.company}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.68rem', padding: '0.2rem 0.55rem', borderRadius: '9999px',
                      fontWeight: '700', textTransform: 'capitalize',
                      backgroundColor: `${statusColor(job.status)}15`,
                      color: statusColor(job.status),
                      border: `1px solid ${statusColor(job.status)}30`
                    }}>
                      {job.status}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {timeAgo(job.trackedAt || job.appliedDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '2.5rem 1rem', border: '1.5px dashed var(--border-color)',
              borderRadius: '14px', backgroundColor: 'var(--bg-color)'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.75rem', color: '#94a3b8'
              }}>
                <BarChart3 size={24} />
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569', textAlign: 'center', margin: 0 }}>
                No tracked applications yet
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', margin: '0.25rem 0 1rem' }}>
                Search for jobs and add them to your tracker to see activity here.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/jobs')} style={{ fontSize: '12px', padding: '0.4rem 0.9rem' }}>
                <Search size={13} /> Find Jobs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Completeness Nudge */}
      {(!profile.role || !profile.name || (profile.skills || []).length === 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.25rem',
          padding: '1.25rem 1.5rem', borderRadius: '16px',
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a',
          boxShadow: 'var(--shadow-sm)',
          animation: 'fadeUp 0.75s ease-out'
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: '#f59e0b', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <User size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.925rem', fontWeight: '700', color: '#92400e' }}>Complete your profile for AI matching</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#b45309' }}>
              Add your target title, key skills, and experience to unlock tailored job matching and resume score improvements.
            </p>
          </div>
          <button className="btn" onClick={() => navigate('/profile')}
            style={{
              backgroundColor: '#d97706', color: 'white', border: 'none',
              fontSize: '12.5px', fontWeight: '600', padding: '0.5rem 1rem',
              borderRadius: '10px', gap: '0.35rem', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
            }}>
            Complete Profile <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
