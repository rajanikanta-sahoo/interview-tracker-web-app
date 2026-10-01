import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Briefcase, HelpCircle, FileText, Compass, Check, X } from 'lucide-react';
import { storage } from '../services/storage';
import { api } from '../services/api';

const APP_PAGES = [
  { title: 'Dashboard', subtitle: 'Overview, analytics & quick actions', path: '/', icon: 'compass', category: 'Pages' },
  { title: 'Prep Hub', subtitle: 'Practice STAR interview questions & flashcards', path: '/prep', icon: 'help', category: 'Pages' },
  { title: 'Job Search', subtitle: 'Explore curated tech jobs & filter by skills', path: '/jobs', icon: 'briefcase', category: 'Pages' },
  { title: 'Resume Builder', subtitle: 'Edit ATS-optimized resumes & cover letters', path: '/resume', icon: 'file', category: 'Pages' },
  { title: 'Application Tracker', subtitle: 'Kanban board for job applications', path: '/tracker', icon: 'briefcase', category: 'Pages' },
  { title: 'Contribute', subtitle: 'Submit new interview questions and job openings', path: '/contribute', icon: 'file', category: 'Pages' },
  { title: 'Profile & Settings', subtitle: 'Update career preferences and personal skills', path: '/profile', icon: 'compass', category: 'Pages' },
];

function getDaysSince(dateStr) {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function Header() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [questionsCache, setQuestionsCache] = useState([]);
  const [dismissedNotifs, setDismissedNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const searchContainerRef = useRef(null);
  const notifContainerRef = useRef(null);

  // Fetch lightweight questions for search indexing
  useEffect(() => {
    let ignore = false;
    async function loadIndex() {
      try {
        const qData = await api.fetchQuestions({});
        if (Array.isArray(qData) && !ignore) {
          setQuestionsCache(qData);
        }
      } catch (err) {
        console.warn('Could not pre-load questions for search:', err);
      }
    }
    loadIndex();
    return () => { ignore = true; };
  }, []);

  // Close overlays on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute live notifications from pipeline & profile
  const trackerData = storage.getTrackerJobs();
  const rawNotifications = [];

  const interviewingJobs = trackerData.interviewing || [];
  if (interviewingJobs.length > 0) {
    rawNotifications.push({
      id: 'interviews-active',
      title: `${interviewingJobs.length} Active Interview${interviewingJobs.length > 1 ? 's' : ''}`,
      message: `You have active interview stages with ${interviewingJobs.map(j => j.company).slice(0, 2).join(', ')}.`,
      path: '/tracker',
      type: 'success',
      icon: '🎯',
    });
  }

  const appliedJobs = trackerData.applied || [];
  appliedJobs.forEach(job => {
    if (job.appliedDate) {
      const days = getDaysSince(job.appliedDate);
      if (days >= 7) {
        rawNotifications.push({
          id: `stale-${job.id}`,
          title: `Follow-up Suggestion`,
          message: `${job.company} (${job.title}) was applied ${days} days ago with no update. Consider sending a recruiter note!`,
          path: '/tracker',
          type: 'warning',
          icon: '⏰',
        });
      }
    }
  });

  const profile = storage.getProfile();
  if (!profile.targetRole || profile.targetRole === 'Senior Full Stack Developer' && (!profile.skills || profile.skills.length <= 2)) {
    rawNotifications.push({
      id: 'profile-incomplete',
      title: 'Complete Your Profile',
      message: 'Add your skills and preferred job titles to unlock tailored interview prep questions.',
      path: '/profile',
      type: 'info',
      icon: '💡',
    });
  }

  const activeNotifications = rawNotifications.filter(n => !dismissedNotifs.includes(n.id));

  const dismissNotification = (id) => {
    const updated = [...dismissedNotifs, id];
    setDismissedNotifs(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
  };

  const clearAllNotifications = () => {
    const allIds = rawNotifications.map(n => n.id);
    setDismissedNotifs(allIds);
    localStorage.setItem('dismissed_notifications', JSON.stringify(allIds));
  };

  // Compute search results
  const q = searchTerm.trim().toLowerCase();
  let searchResults = [];

  if (q.length > 0) {
    // 1. Pages
    const matchedPages = APP_PAGES.filter(p =>
      p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
    );

    // 2. Tracked Applications
    const allTracked = Object.values(trackerData).flat();
    const matchedTracked = allTracked
      .filter(j => j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(j => ({
        title: `${j.title} @ ${j.company}`,
        subtitle: `Tracked application (${j.status})`,
        path: '/tracker',
        icon: 'briefcase',
        category: 'Applications',
      }));

    // 3. Prep Questions
    const matchedQuestions = questionsCache
      .filter(item => item.question?.toLowerCase().includes(q) || item.group?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(item => ({
        title: item.question,
        subtitle: `Prep Question (${item.group || 'General'})`,
        path: '/prep',
        icon: 'help',
        category: 'Prep Questions',
      }));

    searchResults = [...matchedPages, ...matchedTracked, ...matchedQuestions];
  }

  const handleSelectResult = (path) => {
    setIsSearchOpen(false);
    setSearchTerm('');
    navigate(path);
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--border-color)',
      position: 'relative',
      zIndex: 50,
    }}>
      {/* Search Input Container */}
      <div ref={searchContainerRef} style={{ position: 'relative', flex: '1', maxWidth: '420px' }}>
        <div className="input-group" style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Quick search questions, jobs, pages..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchTerm.trim().length > 0) setIsSearchOpen(true);
            }}
            style={{
              paddingLeft: '36px',
              paddingRight: searchTerm ? '32px' : '12px',
              width: '100%',
              borderRadius: '20px',
              fontSize: '0.85rem',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setIsSearchOpen(false);
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '9px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchOpen && q.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
            maxHeight: '360px',
            overflowY: 'auto',
            padding: '0.5rem',
            zIndex: 100,
          }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No matching results found for &quot;{searchTerm}&quot;
              </div>
            ) : (
              searchResults.map((res, i) => (
                <div
                  key={`${res.path}-${i}`}
                  onClick={() => handleSelectResult(res.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0,
                  }}>
                    {res.icon === 'briefcase' && <Briefcase size={14} />}
                    {res.icon === 'help' && <HelpCircle size={14} />}
                    {res.icon === 'file' && <FileText size={14} />}
                    {res.icon === 'compass' && <Compass size={14} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {res.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: '500', color: 'var(--primary)' }}>[{res.category}]</span> {res.subtitle}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Header Actions (Notification Bell) */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div ref={notifContainerRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsNotifOpen(prev => !prev)}
            aria-label="Notifications"
            style={{
              background: isNotifOpen ? 'var(--card-bg)' : 'none',
              border: isNotifOpen ? '1px solid var(--border-color)' : 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-color)',
              position: 'relative',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <Bell size={20} />
            {activeNotifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                minWidth: '16px',
                height: '16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                border: '2px solid var(--card-bg)',
              }}>
                {activeNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {isNotifOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '320px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
              padding: '1rem',
              zIndex: 100,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>Notifications</h4>
                {activeNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.72rem',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {activeNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🎉</div>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '500' }}>All caught up!</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem' }}>No pending interview alerts.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {activeNotifications.map(notif => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '8px',
                        background: 'var(--bg-color)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ fontSize: '1rem', lineHeight: 1 }}>{notif.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{notif.title}</span>
                          <button
                            onClick={() => dismissNotification(notif.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 2px' }}
                            title="Dismiss"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                        <p style={{ margin: '0.2rem 0 0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                          {notif.message}
                        </p>
                        <button
                          onClick={() => {
                            setIsNotifOpen(false);
                            navigate(notif.path);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontSize: '0.72rem',
                            color: 'var(--primary)',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          View &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
