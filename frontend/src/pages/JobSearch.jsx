import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, Check, AlertCircle, ExternalLink, ChevronDown, ChevronUp,
  MapPin, Clock, Briefcase, Info, RefreshCw, Sparkles, Plus, Filter
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

function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [searchParams, setSearchParams] = useState({ role: '', location: '', remote: false, skills: '', experience: '' });
  const [loading, setLoading] = useState(false);
  const [trackedIds, setTrackedIds] = useState(new Set());
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

  useEffect(() => {
    // Load tracked IDs from localStorage
    const data = storage.getTrackerJobs();
    const ids = new Set();
    Object.values(data).forEach(arr => { if (Array.isArray(arr)) arr.forEach(j => ids.add(j.id)); });
    setTrackedIds(ids);
    handleSearch();
    return () => { if (toastRef.current) clearTimeout(toastRef.current); };
  }, []);

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

  const loadFromProfile = async () => {
    try {
      const profile = await api.fetchProfile();
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

  // Skeleton card
  const SkeletonCard = () => (
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes toastIn { from{transform:translateY(-12px);opacity:0} to{transform:translateY(0);opacity:1} }
        .job-card-hover:hover { box-shadow: 0 8px 25px -5px rgba(0,0,0,0.08), 0 4px 10px -6px rgba(0,0,0,0.06) !important; transform: translateY(-2px); }
        .job-card-hover { transition: all 0.2s ease !important; }
      `}</style>

      {/* Toast */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          backgroundColor: toast.type === 'success' ? '#ecfdf5' : toast.type === 'error' ? '#fef2f2' : '#eff6ff',
          border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : toast.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
          color: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#1e3a8a',
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

      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>Job Search</h1>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Discover opportunities, track applications, and launch your next career move.</p>
      </div>

      {/* Search Criteria Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={16} style={{ color: 'var(--primary)' }} /> Search Criteria
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" type="button" onClick={clearFilters}
              style={{ fontSize: '12px', padding: '0.3rem 0.7rem', gap: '0.3rem' }}>
              <RefreshCw size={12} /> Clear
            </button>
            <button className="btn btn-outline" type="button" onClick={loadFromProfile}
              style={{ fontSize: '12px', padding: '0.3rem 0.7rem', gap: '0.3rem' }}>
              <Sparkles size={12} style={{ color: 'var(--primary)' }} /> Auto-fill from Profile
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Role / Title</label>
              <input type="text" className="input" placeholder="e.g. Frontend Developer, Java Engineer"
                value={searchParams.role} onChange={e => setSearchParams({...searchParams, role: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Location</label>
              <input type="text" className="input" placeholder="e.g. Bangalore, Remote"
                value={searchParams.location} onChange={e => setSearchParams({...searchParams, location: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '0.85rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Key Skills</label>
              <input type="text" className="input" placeholder="React, Node.js, Python..."
                value={searchParams.skills} onChange={e => setSearchParams({...searchParams, skills: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Years Exp.</label>
              <input type="number" className="input" placeholder="e.g. 3" min="0" max="50"
                value={searchParams.experience} onChange={e => setSearchParams({...searchParams, experience: e.target.value})} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingBottom: '0.35rem' }}>
              <input type="checkbox" id="remote-check" checked={searchParams.remote}
                onChange={e => setSearchParams({...searchParams, remote: e.target.checked})}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label htmlFor="remote-check" style={{ fontSize: '12px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>Remote Only</label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ height: '36px', minWidth: '110px', gap: '0.35rem' }}>
              <Search size={14} /> {loading ? 'Searching...' : 'Search Jobs'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Area */}
      {loading ? (
        <>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ height: '14px', width: '120px', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div className="grid-cols-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </>
      ) : hasSearched && jobs.length === 0 ? (
        /* Empty State */
        <div className="card" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '3rem', minHeight: '300px', border: '1px solid var(--border-color)', borderRadius: '12px'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', marginBottom: '1.25rem'
          }}>
            <Search size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Jobs Found</h3>
          <p className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center', maxWidth: '360px', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Try broadening your search criteria — adjust the role, location, or skills filters to discover more opportunities.
          </p>
          <button className="btn btn-outline" onClick={clearFilters} style={{ gap: '0.35rem' }}>
            <RefreshCw size={14} /> Clear All Filters
          </button>
        </div>
      ) : jobs.length > 0 ? (
        <>
          {/* Result Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              Showing <strong style={{ color: 'var(--text-main)' }}>{jobs.length}</strong> {jobs.length === 1 ? 'result' : 'results'}
            </p>
          </div>

          <div className="grid-cols-3">
            {jobs.map(job => {
              const isTracked = trackedIds.has(job.id);
              const isExpanded = expandedJobId === job.id;
              const tStyle = typeBadgeStyle(job.type);
              const sStyle = sourceBadgeStyle(job.source);

              return (
                <div key={job.id} className="card job-card-hover" style={{
                  display: 'flex', flexDirection: 'column', gap: '0.6rem',
                  padding: '1.25rem', cursor: 'default', position: 'relative'
                }}>
                  {/* Header: Title + Type Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', lineHeight: '1.3' }}>{job.title}</h3>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem',
                      borderRadius: '9999px', fontSize: '10.5px', fontWeight: '600', flexShrink: 0,
                      backgroundColor: tStyle.bg, color: tStyle.color, border: `1px solid ${tStyle.border}`
                    }}>
                      {job.type}
                    </span>
                  </div>

                  {/* Company */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '700', color: '#475569', flexShrink: 0
                    }}>
                      {(job.company || '?')[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{job.company}</span>
                  </div>

                  {/* Location + Posted */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> {job.location}
                    </span>
                    {job.postedAt && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {timeAgo(job.postedAt)}
                      </span>
                    )}
                  </div>

                  {/* Description (clamped or expanded) */}
                  <p style={{
                    fontSize: '12.5px', color: '#64748b', lineHeight: '1.45', margin: 0,
                    ...(isExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' })
                  }}>
                    {job.description}
                  </p>

                  {/* Expand/Collapse Toggle */}
                  {job.description && job.description.length > 100 && (
                    <button
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--primary)',
                        fontSize: '11.5px', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0
                      }}
                    >
                      {isExpanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> View details</>}
                    </button>
                  )}

                  {/* Expanded: Source Badge */}
                  {isExpanded && job.source && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.45rem',
                        borderRadius: '4px', fontSize: '10px', fontWeight: '600',
                        backgroundColor: sStyle.bg, color: sStyle.color, border: `1px solid ${sStyle.border}`
                      }}>
                        Source: {job.source}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ flex: 1, gap: '0.3rem', fontSize: '12.5px' }}
                      onClick={() => openApplySearch(job)}>
                      <ExternalLink size={13} /> Apply
                    </button>

                    {isTracked ? (
                      <button className="btn" disabled style={{
                        flex: 1, fontSize: '12.5px', gap: '0.3rem',
                        backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0',
                        cursor: 'default', opacity: 1
                      }}>
                        <Check size={14} /> Tracked
                      </button>
                    ) : (
                      <button className="btn btn-primary" style={{ flex: 1, gap: '0.3rem', fontSize: '12.5px' }}
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
