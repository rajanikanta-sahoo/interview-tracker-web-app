import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, Check, AlertCircle, ExternalLink, ChevronDown, ChevronUp,
  MapPin, Clock, RefreshCw, Sparkles, Plus, Filter, Target
} from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../services/storage';

// Relative time helper
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

// Skeleton card (module scope to avoid component recreation during render)
function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ height: '18px', width: '60%', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '22px', width: '70px', backgroundColor: '#e2e8f0', borderRadius: '9999px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: '14px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: '12px', width: '30%', backgroundColor: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: '36px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
        <div style={{ height: '34px', flex: 1, backgroundColor: '#e2e8f0', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '34px', flex: 1, backgroundColor: '#e2e8f0', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

function JobSearch() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [searchParams, setSearchParams] = useState({ role: '', location: '', remote: false, skills: '', experience: '' });
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [trackedIds, setTrackedIds] = useState(() => {
    const data = storage.getTrackerJobs();
    const ids = new Set();
    Object.values(data).forEach(arr => { if (Array.isArray(arr)) arr.forEach(j => ids.add(j.id)); });
    return ids;
  });
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ show: true, message, type });
    toastRef.current = setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.fetchJobs(searchParams.role, searchParams.location, searchParams.remote, searchParams.skills, searchParams.experience);
      setJobs(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch jobs.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      setHasSearched(true);
      try {
        const [jobsData, profData] = await Promise.all([
          api.fetchJobs().catch(() => []),
          api.fetchProfile().catch(() => null)
        ]);
        if (!ignore) {
          setJobs(jobsData || []);
          setUserProfile(profData || null);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          showToast('Failed to fetch jobs.', 'error');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
      if (toastRef.current) clearTimeout(toastRef.current);
    };
  }, []);

  const loadFromProfile = async () => {
    try {
      const profile = userProfile || await api.fetchProfile();
      setUserProfile(profile);
      const skillNames = (profile.skills || []).map(s => typeof s === 'object' ? s.name : s).join(', ');
      setSearchParams({
        role: profile.role || '',
        location: profile.preferences?.location || '',
        remote: profile.preferences?.type === 'Remote',
        skills: skillNames,
        experience: profile.experience || ''
      });
      showToast('Search criteria auto-filled from your profile!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to load profile data.', 'error');
    }
  };

  const clearFilters = () => {
    setSearchParams({ role: '', location: '', remote: false, skills: '', experience: '' });
    setActiveQuickFilter('all');
  };

  const trackJob = (job) => {
    if (trackedIds.has(job.id)) {
      showToast('This job is already being tracked.', 'info');
      return;
    }
    const data = storage.getTrackerJobs();
    data.applied.push({ ...job, status: 'Applied', trackedAt: new Date().toISOString() });
    storage.saveTrackerJobs(data);
    setTrackedIds(prev => new Set(prev).add(job.id));
    showToast(`Now tracking "${job.title}" at ${job.company}`, 'success');
  };

  const openApplySearch = (job) => {
    const q = encodeURIComponent(`${job.title} ${job.company} jobs apply`);
    window.open(`https://www.google.com/search?q=${q}`, '_blank');
  };

  const handleAnalyzeFit = (job) => {
    sessionStorage.setItem('jd_match_payload', JSON.stringify({
      jobDescription: `${job.title} at ${job.company}\n\n${job.description || ''}\n\nRequired Skills: ${(job.skills || []).join(', ')}`,
      targetRole: job.title,
      companyName: job.company
    }));
    navigate('/resume?tab=jd_match');
  };

  // Helper to compute match score
  const getJobMatch = (job) => {
    if (!userProfile) return null;
    const userRole = (userProfile.role || '').toLowerCase();
    const userSkills = (userProfile.skills || []).map(s => (typeof s === 'object' ? s.name : s).toLowerCase());
    const jobText = `${job.title} ${job.description || ''} ${(job.skills || []).join(' ')}`.toLowerCase();

    let score = 65; // baseline
    if (userRole && jobText.includes(userRole)) score += 20;
    const matches = userSkills.filter(s => jobText.includes(s));
    score += Math.min(15, matches.length * 5);
    return Math.min(98, score);
  };

  const typeBadgeStyle = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('remote')) return { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' };
    if (t.includes('hybrid')) return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
  };

  const sourceBadgeStyle = (src) => {
    if ((src || '').includes('User')) return { bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' };
    return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  };

  // Apply quick filters if selected
  const displayedJobs = jobs.filter(job => {
    if (activeQuickFilter === 'remote') {
      return (job.type || '').toLowerCase().includes('remote');
    }
    if (activeQuickFilter === 'hybrid') {
      return (job.type || '').toLowerCase().includes('hybrid');
    }
    if (activeQuickFilter === 'saved') {
      return trackedIds.has(job.id);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes toastIn { from{transform:translateY(-12px);opacity:0} to{transform:translateY(0);opacity:1} }
        .job-card-modern {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          border: 1px solid var(--border-color);
          background-color: var(--card-bg);
          box-shadow: var(--shadow-xs);
        }
        .job-card-modern:hover {
          box-shadow: var(--shadow-lg) !important;
          transform: translateY(-3px);
          border-color: #cbd5e1;
        }
        .quick-pill {
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid var(--border-color);
          background: #ffffff;
          color: #64748b;
        }
        .quick-pill:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .quick-pill.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
        }
      `}</style>

      {/* Toast */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.25rem', borderRadius: '12px',
          boxShadow: 'var(--shadow-xl)',
          backgroundColor: '#ffffff',
          border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : toast.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
          color: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#1e3a8a',
          animation: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', fontSize: '13px', fontWeight: '600'
        }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            backgroundColor: toast.type === 'success' ? '#dcfce7' : toast.type === 'error' ? '#fee2e2' : '#e0e7ff',
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

      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', marginBottom: '0.4rem' }}>
            <Sparkles size={12} /> Live Opportunity Radar
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
            Job Discovery & Match
          </h1>
          <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
            Search curated opportunities matched to your target role, stack, and preferences.
          </p>
        </div>

        {/* Quick Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`quick-pill ${activeQuickFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveQuickFilter('all')}>
            All ({jobs.length})
          </button>
          <button
            className={`quick-pill ${activeQuickFilter === 'remote' ? 'active' : ''}`}
            onClick={() => setActiveQuickFilter('remote')}>
            Remote
          </button>
          <button
            className={`quick-pill ${activeQuickFilter === 'hybrid' ? 'active' : ''}`}
            onClick={() => setActiveQuickFilter('hybrid')}>
            Hybrid
          </button>
          <button
            className={`quick-pill ${activeQuickFilter === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveQuickFilter('saved')}>
            Tracked ({trackedIds.size})
          </button>
        </div>
      </div>

      {/* Unified Search Criteria Card */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Filter size={17} style={{ color: 'var(--primary)' }} /> Search Filters
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" type="button" onClick={clearFilters}
              style={{ fontSize: '12px', padding: '0.35rem 0.75rem', gap: '0.35rem', borderRadius: '8px' }}>
              <RefreshCw size={12} /> Clear
            </button>
            <button className="btn btn-outline" type="button" onClick={loadFromProfile}
              style={{ fontSize: '12px', padding: '0.35rem 0.75rem', gap: '0.35rem', borderRadius: '8px', color: 'var(--primary)', borderColor: 'rgba(79,70,229,0.3)' }}>
              <Sparkles size={12} /> Auto-fill from Profile
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Role / Target Title</label>
              <input type="text" className="input" placeholder="e.g. Senior Frontend Engineer, Full Stack Developer"
                value={searchParams.role} onChange={e => setSearchParams({...searchParams, role: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Location / City</label>
              <input type="text" className="input" placeholder="e.g. Bangalore, London, Remote"
                value={searchParams.location} onChange={e => setSearchParams({...searchParams, location: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Key Technologies & Skills</label>
              <input type="text" className="input" placeholder="React, TypeScript, Node.js, GraphQL..."
                value={searchParams.skills} onChange={e => setSearchParams({...searchParams, skills: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Years Exp.</label>
              <input type="number" className="input" placeholder="e.g. 3" min="0" max="50"
                value={searchParams.experience} onChange={e => setSearchParams({...searchParams, experience: e.target.value})} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.45rem' }}>
              <input type="checkbox" id="remote-check" checked={searchParams.remote}
                onChange={e => setSearchParams({...searchParams, remote: e.target.checked})}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }} />
              <label htmlFor="remote-check" style={{ fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>Remote Only</label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ height: '40px', minWidth: '130px', gap: '0.4rem', borderRadius: '10px' }}>
              <Search size={15} /> {loading ? 'Searching...' : 'Search Jobs'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Area */}
      {loading ? (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ height: '16px', width: '140px', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div className="grid-cols-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </>
      ) : hasSearched && displayedJobs.length === 0 ? (
        /* Empty State */
        <div className="card" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '3.5rem 2rem', minHeight: '340px', borderRadius: '16px', textAlign: 'center'
        }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '20px',
            backgroundColor: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', marginBottom: '1.25rem'
          }}>
            <Search size={30} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)' }}>No matching opportunities found</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem', maxWidth: '400px', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            We couldn't find any jobs matching your filters. Try clearing your filters or adding broader keywords.
          </p>
          <button className="btn btn-outline" onClick={clearFilters} style={{ gap: '0.4rem', borderRadius: '10px' }}>
            <RefreshCw size={14} /> Reset Search Filters
          </button>
        </div>
      ) : displayedJobs.length > 0 ? (
        <>
          {/* Result Count and sort banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', margin: 0 }}>
              Showing <strong style={{ color: 'var(--text-main)' }}>{displayedJobs.length}</strong> active position{displayedJobs.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="grid-cols-3">
            {displayedJobs.map(job => {
              const isTracked = trackedIds.has(job.id);
              const isExpanded = expandedJobId === job.id;
              const tStyle = typeBadgeStyle(job.type);
              const sStyle = sourceBadgeStyle(job.source);
              const matchScore = getJobMatch(job);

              return (
                <div key={job.id} className="card job-card-modern" style={{
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  padding: '1.35rem', borderRadius: '16px', position: 'relative'
                }}>
                  {/* Top Row: Title + Match Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.3' }}>
                        {job.title}
                      </h3>
                    </div>
                    {matchScore && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem',
                        borderRadius: '9999px', fontSize: '11px', fontWeight: '800', flexShrink: 0,
                        backgroundColor: matchScore >= 80 ? '#ecfdf5' : '#eff6ff',
                        color: matchScore >= 80 ? '#059669' : '#2563eb',
                        border: `1px solid ${matchScore >= 80 ? '#a7f3d0' : '#bfdbfe'}`
                      }}>
                        {matchScore}% match
                      </span>
                    )}
                  </div>

                  {/* Company & Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', flexShrink: 0
                      }}>
                        {(job.company || '?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-main)' }}>{job.company}</span>
                    </div>

                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem',
                      borderRadius: '9999px', fontSize: '11px', fontWeight: '600', flexShrink: 0,
                      backgroundColor: tStyle.bg, color: tStyle.color, border: `1px solid ${tStyle.border}`
                    }}>
                      {job.type}
                    </span>
                  </div>

                  {/* Location + Posted */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} style={{ color: '#94a3b8' }} /> {job.location}
                    </span>
                    {job.postedAt && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} style={{ color: '#94a3b8' }} /> {timeAgo(job.postedAt)}
                      </span>
                    )}
                  </div>

                  {/* Description (clamped or expanded) */}
                  <p style={{
                    fontSize: '12.5px', color: '#64748b', lineHeight: '1.5', margin: 0,
                    ...(isExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' })
                  }}>
                    {job.description}
                  </p>

                  {/* Expand/Collapse Toggle */}
                  {job.description && job.description.length > 90 && (
                    <button
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--primary)',
                        fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0
                      }}
                    >
                      {isExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read overview</>}
                    </button>
                  )}

                  {/* Expanded: Source Badge */}
                  {isExpanded && job.source && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem',
                        borderRadius: '6px', fontSize: '10.5px', fontWeight: '600',
                        backgroundColor: sStyle.bg, color: sStyle.color, border: `1px solid ${sStyle.border}`
                      }}>
                        Source: {job.source}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.85rem', display: 'flex', gap: '0.45rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" style={{ flex: 1, minWidth: '95px', gap: '0.35rem', fontSize: '12px', borderRadius: '10px' }}
                      onClick={() => openApplySearch(job)}>
                      <ExternalLink size={13} /> Apply
                    </button>

                    <button className="btn btn-outline" style={{ flex: 1, minWidth: '105px', gap: '0.35rem', fontSize: '12px', borderRadius: '10px', color: 'var(--primary)', borderColor: 'rgba(79, 70, 229, 0.3)' }}
                      onClick={() => handleAnalyzeFit(job)}
                      title="Match with your resume & calculate ATS Score">
                      <Target size={13} /> Match Fit
                    </button>

                    {isTracked ? (
                      <button className="btn" disabled style={{
                        flex: 1, minWidth: '95px', fontSize: '12px', gap: '0.35rem', borderRadius: '10px',
                        backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0',
                        cursor: 'default', opacity: 1, fontWeight: '700'
                      }}>
                        <Check size={14} /> Tracked
                      </button>
                    ) : (
                      <button className="btn btn-primary" style={{ flex: 1, minWidth: '95px', gap: '0.35rem', fontSize: '12px', borderRadius: '10px' }}
                        onClick={() => trackJob(job)}>
                        <Plus size={14} /> Track
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default JobSearch;
