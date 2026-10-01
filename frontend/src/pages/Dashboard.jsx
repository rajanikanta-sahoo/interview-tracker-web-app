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
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          backgroundColor: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: toast.type === 'success' ? '#065f46' : '#991b1b',
          animation: 'toastIn 0.3s ease-out', fontSize: '13px', fontWeight: '500'
        }}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: 'success' })}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.7, display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.5rem 1.75rem', borderRadius: '14px',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        color: 'white', animation: 'fadeUp 0.4s ease-out'
      }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '700', margin: '0 0 0.35rem 0' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.85, margin: 0 }}>
            {profile.role ? `${profile.role} · ${profile.experience || '0'} yrs experience` : 'Set up your profile to get personalized insights'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={() => document.getElementById('import-file').click()}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: '12px', gap: '0.3rem', padding: '0.4rem 0.85rem' }}>
            <Upload size={13} /> Import
          </button>
          <input type="file" id="import-file" style={{ display: 'none' }} accept=".json" onChange={handleImport} />
          <button className="btn" onClick={handleExport}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: '12px', gap: '0.3rem', padding: '0.4rem 0.85rem' }}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', animation: 'fadeUp 0.5s ease-out' }}>
        {[
          { label: 'Total Applications', value: total, icon: <Briefcase size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
          { label: 'Active Interviews', value: trackerStats.interviewing, icon: <Target size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
          { label: 'Offers Received', value: trackerStats.offer, icon: <Award size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
          { label: 'Success Rate', value: `${successRate}%`, icon: <TrendingUp size={20} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)' },
        ].map(stat => (
          <div key={stat.label} className="card stat-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color, flexShrink: 0
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Quick Actions + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', animation: 'fadeUp 0.6s ease-out' }}>

        {/* Quick Actions */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} style={{ color: 'var(--primary)' }} /> Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {quickActions.map(action => (
              <div
                key={action.path}
                className="dash-card-hover"
                onClick={() => navigate(action.path)}
                style={{
                  padding: '1rem', borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: action.bg,
                  display: 'flex', flexDirection: 'column', gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: action.color }}>{action.icon}</div>
                  <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>{action.title}</p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{action.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} style={{ color: '#64748b' }} /> Recent Activity
            </h2>
            {recentJobs.length > 0 && (
              <button className="btn btn-outline" onClick={() => navigate('/tracker')}
                style={{ fontSize: '11px', padding: '0.25rem 0.6rem', gap: '0.25rem' }}>
                View All <ArrowRight size={11} />
              </button>
            )}
          </div>

          {recentJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              {recentJobs.map((job, idx) => (
                <div key={job.id || idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.65rem 0.75rem', borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${statusColor(job.status)}`,
                  transition: 'background-color 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: '700', color: '#475569', flexShrink: 0
                    }}>
                      {(job.company || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{job.company}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '9999px',
                      fontWeight: '600', textTransform: 'capitalize',
                      backgroundColor: `${statusColor(job.status)}15`,
                      color: statusColor(job.status),
                      border: `1px solid ${statusColor(job.status)}30`
                    }}>
                      {job.status}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
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
              padding: '2rem', border: '1px dashed var(--border-color)',
              borderRadius: '8px', backgroundColor: 'var(--bg-color)'
            }}>
              <BarChart3 size={28} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', margin: 0 }}>
                No tracked applications yet.
              </p>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', margin: '0.25rem 0 0' }}>
                Search for jobs and start tracking to see activity here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Visual Bar */}
      {total > 0 && (
        <div className="card" style={{ padding: '1.25rem', animation: 'fadeUp 0.7s ease-out' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart3 size={16} style={{ color: 'var(--primary)' }} /> Pipeline Overview
          </h2>
          {/* Stacked Bar */}
          <div style={{ display: 'flex', height: '28px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem', backgroundColor: '#f1f5f9' }}>
            {[
              { key: 'applied', count: trackerStats.applied, color: '#3b82f6', label: 'Applied' },
              { key: 'interviewing', count: trackerStats.interviewing, color: '#f59e0b', label: 'Interviewing' },
              { key: 'offer', count: trackerStats.offer, color: '#10b981', label: 'Offer' },
              { key: 'rejected', count: trackerStats.rejected, color: '#ef4444', label: 'Rejected' },
            ].filter(s => s.count > 0).map(s => (
              <div
                key={s.key}
                title={`${s.label}: ${s.count}`}
                style={{
                  width: `${(s.count / total) * 100}%`,
                  backgroundColor: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '10px', fontWeight: '700',
                  minWidth: '24px', transition: 'width 0.5s ease'
                }}
              >
                {s.count}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Applied', count: trackerStats.applied, color: '#3b82f6' },
              { label: 'Interviewing', count: trackerStats.interviewing, color: '#f59e0b' },
              { label: 'Offer', count: trackerStats.offer, color: '#10b981' },
              { label: 'Rejected', count: trackerStats.rejected, color: '#ef4444' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: item.color }} />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.label}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-main)' }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Completeness Nudge */}
      {(!profile.role || !profile.name || (profile.skills || []).length === 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1rem 1.25rem', borderRadius: '10px',
          backgroundColor: '#fffbeb', border: '1px solid #fef3c7',
          animation: 'fadeUp 0.8s ease-out'
        }}>
          <User size={20} style={{ color: '#b45309', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#92400e' }}>Complete your profile</p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#b45309' }}>
              Add your role, skills, and preferences to unlock personalized job search and AI suggestions.
            </p>
          </div>
          <button className="btn" onClick={() => navigate('/profile')}
            style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '12px', padding: '0.4rem 0.85rem', gap: '0.3rem', flexShrink: 0 }}>
            <ArrowRight size={13} /> Set Up
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
