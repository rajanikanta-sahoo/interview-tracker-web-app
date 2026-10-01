import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, Search, Briefcase, HelpCircle, FileText, Compass, Check, X, 
  ArrowRight, CheckCircle2, ChevronRight, Sun, Moon, Plus, Download
} from 'lucide-react';
import { storage } from '../services/storage';
import { api } from '../services/api';

const APP_PAGES = [
  { title: 'Dashboard', subtitle: 'Overview, pipeline metrics & quick actions', path: '/', icon: 'compass', category: 'Pages' },
  { title: 'Prep Hub', subtitle: 'Practice STAR interview questions & AI scoring', path: '/prep', icon: 'help', category: 'Pages' },
  { title: 'Job Search', subtitle: 'Explore tech jobs with match percentage', path: '/jobs', icon: 'briefcase', category: 'Pages' },
  { title: 'Career Builder', subtitle: 'ATS resumes, cover letters & JD optimizer', path: '/resume', icon: 'file', category: 'Pages' },
  { title: 'Application Tracker', subtitle: 'Kanban board for job applications', path: '/tracker', icon: 'briefcase', category: 'Pages' },
  { title: 'Contribute Hub', subtitle: 'Submit new interview questions and openings', path: '/contribute', icon: 'file', category: 'Pages' },
  { title: 'Profile & Settings', subtitle: 'Update career preferences and skill matrix', path: '/profile', icon: 'compass', category: 'Pages' },
];

function getDaysSince(dateStr) {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [questionsCache, setQuestionsCache] = useState([]);
  const [notifTab, setNotifTab] = useState('all'); // 'all' or 'urgent'
  const [dismissedNotifs, setDismissedNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  };

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
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

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
        searchInputRef.current?.blur();
      }
    };

    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Compute live notifications from pipeline & profile
  const trackerData = storage.getTrackerJobs();
  const rawNotifications = [];

  const interviewingJobs = trackerData.interviewing || [];
  if (interviewingJobs.length > 0) {
    rawNotifications.push({
      id: 'interviews-active',
      title: `${interviewingJobs.length} Active Interview Stage${interviewingJobs.length > 1 ? 's' : ''}`,
      message: `You have active interview rounds with ${interviewingJobs.map(j => j.company).slice(0, 2).join(', ')}. Keep practicing!`,
      path: '/tracker',
      type: 'success',
      icon: '🎯',
      urgent: true
    });
  }

  const appliedJobs = trackerData.applied || [];
  appliedJobs.forEach(job => {
    if (job.appliedDate) {
      const days = getDaysSince(job.appliedDate);
      if (days >= 7) {
        rawNotifications.push({
          id: `stale-${job.id}`,
          title: `Follow-up on ${job.company}`,
          message: `${job.title} applied ${days} days ago without an update. A polite recruiter note is recommended.`,
          path: '/tracker',
          type: 'warning',
          icon: '⏰',
          urgent: days >= 14
        });
      }
    }
  });

  const profile = storage.getProfile();
  if (!profile.role || !profile.name || (profile.skills || []).length <= 2) {
    rawNotifications.push({
      id: 'profile-incomplete',
      title: 'Complete Candidate Profile',
      message: 'Add your skills and preferences to enable JD auto-matching and tailored questions.',
      path: '/profile',
      type: 'info',
      icon: '💡',
      urgent: false
    });
  }

  const activeNotifications = rawNotifications.filter(n => !dismissedNotifs.includes(n.id));
  const filteredNotifications = notifTab === 'urgent' 
    ? activeNotifications.filter(n => n.urgent) 
    : activeNotifications;

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
        subtitle: `Tracked Application (${j.status || 'Applied'})`,
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
        category: 'Interview Prep',
      }));

    searchResults = [...matchedPages, ...matchedTracked, ...matchedQuestions];
  }

  const handleSelectResult = (path) => {
    setIsSearchOpen(false);
    setSearchTerm('');
    navigate(path);
  };

  // Get human friendly current breadcrumb
  const getCurrentPageTitle = () => {
    const p = APP_PAGES.find(item => item.path === location.pathname);
    return p ? p.title : 'Overview';
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.75rem',
      paddingBottom: '1.25rem',
      borderBottom: '1px solid var(--border-color)',
      position: 'relative',
      zIndex: 50,
    }}>
      {/* Search Input Container */}
      <div ref={searchContainerRef} style={{ position: 'relative', flex: '1', maxWidth: '440px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
          <input
            ref={searchInputRef}
            type="text"
            className="input"
            placeholder="Search pages, interview questions, jobs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchTerm.trim().length > 0) setIsSearchOpen(true);
            }}
            style={{
              paddingLeft: '38px',
              paddingRight: searchTerm ? '32px' : '65px',
              width: '100%',
              borderRadius: '12px',
              fontSize: '0.85rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-xs)'
            }}
          />
          
          {searchTerm ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setIsSearchOpen(false);
              }}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <span style={{
              position: 'absolute',
              right: '10px',
              padding: '2px 6px',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              color: 'var(--text-subtle)',
              pointerEvents: 'none',
              letterSpacing: '0.04em'
            }}>
              ⌘K
            </span>
          )}
        </div>

        {/* Global Search Results & Action Palette Dropdown */}
        {isSearchOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.6rem',
            zIndex: 100,
            animation: 'fadeUp 0.15s ease-out'
          }}>
            {q.length === 0 ? (
              <div>
                <div style={{ padding: '0.4rem 0.6rem', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.04em' }}>
                  Quick Actions & Shortcuts
                </div>
                {[
                  {
                    icon: <Plus size={15} />,
                    title: 'Track New Job Application',
                    subtitle: 'Add a new opportunity to your pipeline',
                    action: () => handleSelectResult('/tracker?action=add')
                  },
                  {
                    icon: <HelpCircle size={15} />,
                    title: 'Practice STAR Interview Questions',
                    subtitle: 'Open Prep Hub for interactive AI coaching',
                    action: () => handleSelectResult('/prep')
                  },
                  {
                    icon: <Briefcase size={15} />,
                    title: 'Explore Tech Job Listings',
                    subtitle: 'Find roles with real-time match percentages',
                    action: () => handleSelectResult('/jobs')
                  },
                  {
                    icon: <FileText size={15} />,
                    title: 'Career & ATS Resume Optimizer',
                    subtitle: 'Tailor your resume against target JDs',
                    action: () => handleSelectResult('/resume')
                  },
                  {
                    icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
                    title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
                    subtitle: 'Toggle theme preferences',
                    action: () => { toggleTheme(); setIsSearchOpen(false); }
                  },
                  {
                    icon: <Download size={15} />,
                    title: 'Backup & Export Pipeline JSON',
                    subtitle: 'Download full local data snapshot',
                    action: () => { storage.exportData(); setIsSearchOpen(false); }
                  }
                ].map((act, i) => (
                  <div
                    key={i}
                    onClick={act.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-alt)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(79, 70, 229, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      flexShrink: 0,
                    }}>
                      {act.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {act.subtitle}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-subtle)' }} />
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Search size={22} style={{ color: 'var(--text-subtle)', marginBottom: '0.35rem', opacity: 0.7 }} />
                <p style={{ margin: 0, fontWeight: '500' }}>No results found for &quot;{searchTerm}&quot;</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Try searching for &quot;React&quot;, &quot;Frontend&quot;, or &quot;Tracker&quot;</p>
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
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-alt)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(79, 70, 229, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0,
                  }}>
                    {res.icon === 'briefcase' && <Briefcase size={15} />}
                    {res.icon === 'help' && <HelpCircle size={15} />}
                    {res.icon === 'file' && <FileText size={15} />}
                    {res.icon === 'compass' && <Compass size={15} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {res.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: '600', color: 'var(--primary)' }}>[{res.category}]</span> {res.subtitle}
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-subtle)' }} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Header Right Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        
        {/* Active Stage Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.75rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted)' }}>
            {getCurrentPageTitle()}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            cursor: 'pointer',
            color: theme === 'dark' ? '#fbbf24' : 'var(--text-main)',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications Popover Container */}
        <div ref={notifContainerRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsNotifOpen(prev => !prev)}
            aria-label="Notifications"
            style={{
              background: isNotifOpen ? 'var(--surface-alt)' : 'var(--surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              cursor: 'pointer',
              color: 'var(--text-main)',
              position: 'relative',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <Bell size={18} style={{ color: activeNotifications.length > 0 ? 'var(--text-main)' : 'var(--text-muted)' }} />
            {activeNotifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: '700',
                minWidth: '17px',
                height: '17px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid var(--surface)',
                boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
              }}>
                {activeNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '350px',
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-xl)',
              padding: '1.25rem',
              zIndex: 100,
              animation: 'fadeUp 0.15s ease-out'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Updates & Alerts</h4>
                  {activeNotifications.length > 0 && (
                    <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#eef2ff', color: 'var(--primary)' }}>
                      {activeNotifications.length}
                    </span>
                  )}
                </div>
                {activeNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.72rem',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontWeight: '600',
                      padding: '2px 4px',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--surface-alt)', padding: '3px', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setNotifTab('all')}
                  style={{
                    flex: 1,
                    border: 'none',
                    padding: '4px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: notifTab === 'all' ? '600' : '500',
                    backgroundColor: notifTab === 'all' ? '#fff' : 'transparent',
                    color: notifTab === 'all' ? 'var(--text-main)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: notifTab === 'all' ? 'var(--shadow-xs)' : 'none'
                  }}
                >
                  All ({activeNotifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifTab('urgent')}
                  style={{
                    flex: 1,
                    border: 'none',
                    padding: '4px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: notifTab === 'urgent' ? '600' : '500',
                    backgroundColor: notifTab === 'urgent' ? '#fff' : 'transparent',
                    color: notifTab === 'urgent' ? '#b91c1c' : 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: notifTab === 'urgent' ? 'var(--shadow-xs)' : 'none'
                  }}
                >
                  Priority Action
                </button>
              </div>

              {/* List */}
              {filteredNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} style={{ color: '#10b981', marginBottom: '0.5rem', opacity: 0.9 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>You're all caught up!</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>No pending actions or urgent deadlines.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '320px', overflowY: 'auto' }}>
                  {filteredNotifications.map(notif => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: notif.type === 'success' ? '#f0fdf4' : notif.type === 'warning' ? '#fffbeb' : '#f8fafc',
                        border: `1px solid ${notif.type === 'success' ? '#bbf7d0' : notif.type === 'warning' ? '#fde68a' : '#e2e8f0'}`,
                        display: 'flex',
                        gap: '0.6rem',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{notif.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>{notif.title}</span>
                          <button
                            onClick={() => dismissNotification(notif.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: '0 2px' }}
                            title="Dismiss"
                          >
                            <Check size={13} />
                          </button>
                        </div>
                        <p style={{ margin: '0.2rem 0 0.4rem', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
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
                            fontSize: '0.74rem',
                            color: 'var(--primary)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          View in Tracker <ArrowRight size={11} />
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
