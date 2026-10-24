import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Copy,
  Printer,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  RefreshCw,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import ExperienceLevelBadge from '../components/ExperienceLevelBadge';
import { resolveLevelFromYears, EXPERIENCE_LEVELS } from '../utils/experience';

function generateCustomId() {
  return `custom-${Math.random().toString(36).slice(2, 10)}`;
}

export default function Checklist() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState([]);
  const [activeChecklistId, setActiveChecklistId] = useState(null);
  const [trackedApplications, setTrackedApplications] = useState([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'critical', 'remaining', 'completed'
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Modals & New item states
  const [showNewModal, setShowNewModal] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistLevel, setNewChecklistLevel] = useState('mid');
  const [newChecklistCompany, setNewChecklistCompany] = useState('');
  const [newChecklistRole, setNewChecklistRole] = useState('');
  const [newChecklistAppId, setNewChecklistAppId] = useState('');

  // Custom Item state
  const [activeAddingCategory, setActiveAddingCategory] = useState(null);
  const [customItemText, setCustomItemText] = useState('');
  const [customItemPriority, setCustomItemPriority] = useState('important');

  // Expanded notes state
  const [expandedNotes, setExpandedNotes] = useState({});

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let ignore = false;

    async function initChecklistData() {
      try {
        // 1. Load user profile
        let profile = storage.getProfile();
        if (!profile || !profile.role) {
          try {
            const apiProf = await api.fetchProfile();
            if (apiProf && apiProf.role) {
              profile = apiProf;
              storage.saveProfile(apiProf);
            }
          } catch (e) {
            console.warn("Failed fetching profile from API", e);
          }
        }

        // Default level from profile experience
        const userLevel = profile?.experience ? resolveLevelFromYears(profile.experience).id : 'mid';
        if (!ignore) setNewChecklistLevel(userLevel);

        // 2. Load tracked applications from localStorage and API
        const trackerData = storage.getTrackerJobs() || { applied: [], interviewing: [], offer: [], rejected: [] };
        const allApps = [
          ...(trackerData.interviewing || []),
          ...(trackerData.applied || []),
          ...(trackerData.offer || []),
          ...(trackerData.rejected || [])
        ];
        if (!ignore) setTrackedApplications(allApps);

        // 3. Load checklists from backend API
        const apiChecklists = await api.fetchChecklists();
        let list = Array.isArray(apiChecklists) ? apiChecklists : [];

        // If user came with ?appId=... or ?id=..., respect it
        const queryAppId = searchParams.get('appId');
        const queryId = searchParams.get('id');

        // If no checklists exist at all, auto-generate the first one based on profile
        if (list.length === 0) {
          const initial = await api.createChecklist({
            name: `${profile?.name ? profile.name + "'s " : ''}${profile?.role || 'Full Stack'} Interview Checklist`,
            experienceLevel: userLevel,
            role: profile?.role || 'Full Stack Engineer',
            companyName: allApps[0]?.company || 'Target Company'
          });
          list = [initial];
        }

        if (!ignore) {
          setChecklists(list);

          if (queryId && list.some(c => c.id === queryId)) {
            setActiveChecklistId(queryId);
          } else if (queryAppId) {
            const matched = list.find(c => c.applicationId === queryAppId);
            if (matched) {
              setActiveChecklistId(matched.id);
            } else {
              setActiveChecklistId(list[0]?.id || null);
            }
          } else {
            setActiveChecklistId(list[0]?.id || null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading checklist data:", err);
        if (!ignore) {
          showToast("Error loading checklist data");
          setLoading(false);
        }
      }
    }

    initChecklistData();
    return () => {
      ignore = true;
    };
  }, [searchParams]);

  const activeChecklist = useMemo(() => {
    return checklists.find(c => c.id === activeChecklistId) || checklists[0] || null;
  }, [checklists, activeChecklistId]);

  // Handle switching active checklist
  const handleSelectChecklist = (id) => {
    setActiveChecklistId(id);
    setSearchParams({ id });
  };

  // Toggle checklist item
  const handleToggleItem = async (catId, itemId) => {
    if (!activeChecklist) return;

    const updatedCategories = activeChecklist.categories.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, checked: !item.checked };
        })
      };
    });

    // Update local state immediately for instant feedback
    const updatedChecklist = {
      ...activeChecklist,
      categories: updatedCategories
    };

    // Recalculate progress locally
    let total = 0;
    let completed = 0;
    for (const c of updatedCategories) {
      for (const i of c.items) {
        total++;
        if (i.checked) completed++;
      }
    }
    if (activeChecklist.customItems) {
      for (const ci of activeChecklist.customItems) {
        total++;
        if (ci.checked) completed++;
      }
    }
    updatedChecklist.progress = {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };

    setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? updatedChecklist : c));

    // Save to API
    try {
      await api.updateChecklist(activeChecklist.id, { categories: updatedCategories });
    } catch (e) {
      console.error("Failed saving checklist toggle to server", e);
    }
  };

  // Toggle custom item
  const handleToggleCustomItem = async (itemId) => {
    if (!activeChecklist) return;

    const updatedCustomItems = (activeChecklist.customItems || []).map(ci => {
      if (ci.id !== itemId) return ci;
      return { ...ci, checked: !ci.checked };
    });

    const updatedChecklist = {
      ...activeChecklist,
      customItems: updatedCustomItems
    };

    let total = 0;
    let completed = 0;
    for (const c of activeChecklist.categories) {
      for (const i of c.items) {
        total++;
        if (i.checked) completed++;
      }
    }
    for (const ci of updatedCustomItems) {
      total++;
      if (ci.checked) completed++;
    }
    updatedChecklist.progress = {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };

    setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? updatedChecklist : c));

    try {
      await api.updateChecklist(activeChecklist.id, { customItems: updatedCustomItems });
    } catch (e) {
      console.error("Failed saving custom item toggle", e);
    }
  };

  // Add custom item
  const handleAddCustomItem = async (catId) => {
    if (!customItemText.trim() || !activeChecklist) return;

    const newItem = {
      id: generateCustomId(),
      categoryId: catId,
      text: customItemText.trim(),
      priority: customItemPriority,
      checked: false,
      notes: ''
    };

    const updatedCustom = [...(activeChecklist.customItems || []), newItem];
    const updatedChecklist = {
      ...activeChecklist,
      customItems: updatedCustom
    };

    setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? updatedChecklist : c));
    setCustomItemText('');
    setActiveAddingCategory(null);

    try {
      await api.updateChecklist(activeChecklist.id, { customItems: updatedCustom });
      showToast("Custom prep item added!");
    } catch (e) {
      console.error("Failed adding custom item", e);
    }
  };

  // Update item notes
  const handleSaveNotes = async (catId, itemId, notesText, isCustom = false) => {
    if (!activeChecklist) return;

    if (isCustom) {
      const updatedCustom = (activeChecklist.customItems || []).map(ci => {
        if (ci.id !== itemId) return ci;
        return { ...ci, notes: notesText };
      });
      setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? { ...c, customItems: updatedCustom } : c));
      await api.updateChecklist(activeChecklist.id, { customItems: updatedCustom });
    } else {
      const updatedCategories = activeChecklist.categories.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id !== itemId) return item;
            return { ...item, notes: notesText };
          })
        };
      });
      setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? { ...c, categories: updatedCategories } : c));
      await api.updateChecklist(activeChecklist.id, { categories: updatedCategories });
    }
    showToast("Notes saved");
  };

  // Create new checklist
  const handleCreateChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistName.trim()) return;

    try {
      const created = await api.createChecklist({
        name: newChecklistName.trim(),
        experienceLevel: newChecklistLevel,
        companyName: newChecklistCompany.trim(),
        role: newChecklistRole.trim(),
        applicationId: newChecklistAppId || null
      });

      setChecklists(prev => [created, ...prev]);
      setActiveChecklistId(created.id);
      setShowNewModal(false);
      setNewChecklistName('');
      setNewChecklistCompany('');
      setNewChecklistRole('');
      setNewChecklistAppId('');
      showToast("New tailored checklist created!");
    } catch (e) {
      console.error("Failed creating checklist", e);
      showToast("Failed to create checklist");
    }
  };

  // Duplicate checklist
  const handleDuplicate = async () => {
    if (!activeChecklist) return;
    try {
      const dup = await api.duplicateChecklist(activeChecklist.id);
      setChecklists(prev => [dup, ...prev]);
      setActiveChecklistId(dup.id);
      showToast("Checklist duplicated successfully");
    } catch (e) {
      console.error("Failed to duplicate checklist", e);
    }
  };

  // Delete checklist
  const handleDelete = async () => {
    if (!activeChecklist) return;
    if (!window.confirm(`Are you sure you want to delete "${activeChecklist.name}"?`)) return;

    try {
      await api.deleteChecklist(activeChecklist.id);
      const remaining = checklists.filter(c => c.id !== activeChecklist.id);
      setChecklists(remaining);
      setActiveChecklistId(remaining[0]?.id || null);
      showToast("Checklist deleted");
    } catch (e) {
      console.error("Failed to delete checklist", e);
    }
  };

  // Print checklist
  const handlePrint = () => {
    window.print();
  };

  // Filter items logic
  const filteredCategories = useMemo(() => {
    if (!activeChecklist || !activeChecklist.categories) return [];

    return activeChecklist.categories.map(cat => {
      // Regular category items
      let items = cat.items || [];
      // Also grab custom items that belong to this category
      const customForCat = (activeChecklist.customItems || []).filter(ci => ci.categoryId === cat.id);

      let allCatItems = [
        ...items.map(i => ({ ...i, isCustom: false })),
        ...customForCat.map(ci => ({ ...ci, isCustom: true }))
      ];

      // Priority / status filter
      if (priorityFilter === 'critical') {
        allCatItems = allCatItems.filter(i => i.priority === 'critical');
      } else if (priorityFilter === 'remaining') {
        allCatItems = allCatItems.filter(i => !i.checked);
      } else if (priorityFilter === 'completed') {
        allCatItems = allCatItems.filter(i => i.checked);
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        allCatItems = allCatItems.filter(i =>
          i.text.toLowerCase().includes(q) ||
          (i.notes && i.notes.toLowerCase().includes(q))
        );
      }

      const totalItems = (cat.items || []).length + customForCat.length;
      const completedItems = (cat.items || []).filter(i => i.checked).length + customForCat.filter(ci => ci.checked).length;

      return {
        ...cat,
        filteredItems: allCatItems,
        totalItems,
        completedItems
      };
    });
  }, [activeChecklist, priorityFilter, searchQuery]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px' }} />
        <p>Loading your interview preparation checklists...</p>
      </div>
    );
  }

  const overallProgress = activeChecklist?.progress || { total: 0, completed: 0, percentage: 0 };
  const currentLevelInfo = EXPERIENCE_LEVELS.find(l => l.id === activeChecklist?.experienceLevel) || EXPERIENCE_LEVELS[2];

  return (
    <div className="checklist-page" style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--primary)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 1000,
          fontWeight: '600',
          fontSize: '0.9rem',
          animation: 'fadeUp 0.2s ease'
        }}>
          {toastMessage}
        </div>
      )}

      {/* TOP HEADER: Title, Subtitle, & Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <ClipboardCheck size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                Interview Preparation Checklist
              </h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Complete step-by-step readiness roadmap tailored to candidate experience level
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} className="action-buttons">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Printer size={16} /> Print / PDF
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleDuplicate}
            disabled={!activeChecklist}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Copy size={16} /> Duplicate
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> New Checklist
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: Checklist Manager & Saved Checklists */}
        <div className="sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Target Experience Level Card */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                Target Experience Level
              </span>
              <Award size={16} style={{ color: currentLevelInfo.color }} />
            </div>
            <ExperienceLevelBadge levelId={activeChecklist?.experienceLevel} size="md" />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
              Items are calibrated for <strong>{currentLevelInfo.label}</strong> bar.
            </div>
          </div>

          {/* Saved Checklists List */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                My Checklists ({checklists.length})
              </span>
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
              >
                + Create
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {checklists.map(c => {
                const isSelected = c.id === activeChecklistId;
                const lvl = EXPERIENCE_LEVELS.find(l => l.id === c.experienceLevel) || EXPERIENCE_LEVELS[2];
                const pct = c.progress?.percentage || 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectChecklist(c.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-main)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: isSelected ? '700' : '600', fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                        {c.name}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: lvl.bg,
                        color: lvl.color,
                        fontWeight: '700'
                      }}>
                        {lvl.label}
                      </span>
                    </div>

                    {c.companyName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <Building size={12} />
                        <span>{c.companyName} {c.role ? `• ${c.role}` : ''}</span>
                      </div>
                    )}

                    {/* Mini Progress bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <span>Progress</span>
                        <span style={{ fontWeight: '700', color: pct === 100 ? '#10b981' : 'var(--text-main)' }}>{pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: pct === 100 ? '#10b981' : 'linear-gradient(90deg, var(--primary), #a855f7)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Cross-Nav Links */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Connected Tools
            </span>
            <Link to="/prep" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '500' }}>
              <span>🎙️ Mock Simulator & STAR Bank</span>
              <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
            </Link>
            <Link to="/resume" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '500' }}>
              <span>📄 Resume Builder & ATS Scorer</span>
              <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
            </Link>
            <Link to="/tracker" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '500' }}>
              <span>📋 Kanban Application Pipeline</span>
              <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Checklist Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active Checklist Header Card with SVG Progress Ring */}
          {activeChecklist && (
            <div className="card" style={{
              padding: '24px',
              background: 'linear-gradient(135deg, var(--bg-card), var(--bg-main))',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
                      {activeChecklist.name}
                    </h2>
                    <button
                      type="button"
                      onClick={handleDelete}
                      title="Delete this checklist"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.7 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Metadata Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {activeChecklist.companyName && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <Building size={13} /> {activeChecklist.companyName}
                      </span>
                    )}
                    {activeChecklist.role && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <FileText size={13} /> {activeChecklist.role}
                      </span>
                    )}
                    <ExperienceLevelBadge levelId={activeChecklist.experienceLevel} size="sm" />
                  </div>
                </div>

                {/* Progress Ring & Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: overallProgress.percentage === 100 ? '#10b981' : 'var(--primary)' }}>
                      {overallProgress.completed} / {overallProgress.total}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Items Completed ({overallProgress.percentage}%)
                    </div>
                  </div>

                  {/* SVG Circle */}
                  <div style={{ width: '64px', height: '64px', position: 'relative' }}>
                    <svg width="64" height="64" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={overallProgress.percentage === 100 ? '#10b981' : 'var(--primary)'}
                        strokeWidth="3.5"
                        strokeDasharray={`${overallProgress.percentage}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      {overallProgress.percentage}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH & FILTER CONTROLS BAR */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'All Items' },
                { id: 'critical', label: '🔴 Critical Only' },
                { id: 'remaining', label: 'Remaining' },
                { id: 'completed', label: 'Completed' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPriorityFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: priorityFilter === f.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: priorityFilter === f.id ? 'var(--primary)' : 'var(--bg-card)',
                    color: priorityFilter === f.id ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: priorityFilter === f.id ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Keyword Search */}
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search checklist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem', height: '34px' }}
              />
            </div>
          </div>

          {/* CHECKLIST CATEGORIES & ITEMS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredCategories.map(cat => {
              const isCollapsed = collapsedCategories[cat.id];
              const pct = cat.totalItems > 0 ? Math.round((cat.completedItems / cat.totalItems) * 100) : 0;

              return (
                <div
                  key={cat.id}
                  className="card category"
                  style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)' }}
                >
                  {/* Category Header */}
                  <div
                    onClick={() => setCollapsedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                    style={{
                      padding: '16px 20px',
                      background: 'var(--bg-main)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: isCollapsed ? 'none' : '1px solid var(--border)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{cat.title}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          ({cat.completedItems}/{cat.totalItems} done)
                        </span>
                      </div>
                      {cat.description && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Mini bar */}
                      <div style={{ width: '100px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: pct === 100 ? '#10b981' : 'var(--primary)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: pct === 100 ? '#10b981' : 'var(--text-main)', minWidth: '35px', textAlign: 'right' }}>
                        {pct}%
                      </span>
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </div>
                  </div>

                  {/* Items list */}
                  {!isCollapsed && (
                    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column' }}>
                      {cat.filteredItems.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No checklist items match current filter.
                        </div>
                      ) : (
                        cat.filteredItems.map(item => {
                          const isChecked = item.checked;
                          const isNotesOpen = expandedNotes[item.id];

                          return (
                            <div
                              key={item.id}
                              className={`checklist-item ${isChecked ? 'checked' : ''}`}
                              style={{
                                padding: '12px 10px',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                {/* Checkbox & Label */}
                                <div
                                  onClick={() => item.isCustom ? handleToggleCustomItem(item.id) : handleToggleItem(cat.id, item.id)}
                                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', flex: 1 }}
                                >
                                  <div style={{ marginTop: '2px', color: isChecked ? '#10b981' : 'var(--text-muted)' }}>
                                    {isChecked ? <CheckCircle2 size={20} fill="#10b981" color="#fff" /> : <Circle size={20} />}
                                  </div>
                                  <div style={{
                                    fontSize: '0.9rem',
                                    lineHeight: '1.45',
                                    color: isChecked ? 'var(--text-muted)' : 'var(--text-main)',
                                    textDecoration: isChecked ? 'line-through' : 'none',
                                    fontWeight: isChecked ? '400' : '500'
                                  }}>
                                    {item.text}
                                  </div>
                                </div>

                                {/* Badges & Deep-Link */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                  {/* Priority Badge */}
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                    background: item.priority === 'critical' ? 'rgba(239, 68, 68, 0.15)' : item.priority === 'important' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: item.priority === 'critical' ? '#ef4444' : item.priority === 'important' ? '#f59e0b' : '#10b981',
                                    border: `1px solid ${item.priority === 'critical' ? 'rgba(239, 68, 68, 0.3)' : item.priority === 'important' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                  }}>
                                    {item.priority}
                                  </span>

                                  {/* Deep-link action button */}
                                  {item.linkTo && (
                                    <Link
                                      to={item.linkTo}
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: '600',
                                        color: 'var(--primary)',
                                        textDecoration: 'none',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        background: 'rgba(99, 102, 241, 0.08)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                    >
                                      <span>Practice</span>
                                      <ExternalLink size={11} />
                                    </Link>
                                  )}

                                  {/* Toggle Notes button */}
                                  <button
                                    type="button"
                                    onClick={() => setExpandedNotes(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: item.notes ? 'var(--primary)' : 'var(--text-muted)',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      padding: '3px 6px'
                                    }}
                                  >
                                    {item.notes ? '📝 Notes' : '+ Notes'}
                                  </button>
                                </div>
                              </div>

                              {/* Expandable Notes Input */}
                              {isNotesOpen && (
                                <div style={{
                                  marginTop: '4px',
                                  paddingLeft: '32px',
                                  display: 'flex',
                                  gap: '8px',
                                  alignItems: 'flex-start'
                                }}>
                                  <textarea
                                    defaultValue={item.notes || ''}
                                    placeholder="Add preparation notes, LeetCode problem links, or reminders..."
                                    rows="2"
                                    className="input"
                                    id={`note-${item.id}`}
                                    style={{ flex: 1, fontSize: '0.82rem', padding: '8px', borderRadius: '8px' }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                      const text = document.getElementById(`note-${item.id}`)?.value || '';
                                      handleSaveNotes(cat.id, item.id, text, item.isCustom);
                                    }}
                                    style={{ padding: '6px 12px', fontSize: '0.78rem', height: '36px' }}
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}

                      {/* Add Custom Item trigger */}
                      <div style={{ padding: '12px 10px 6px' }}>
                        {activeAddingCategory === cat.id ? (
                          <div style={{
                            background: 'var(--bg-main)',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            <input
                              type="text"
                              className="input"
                              placeholder="e.g. Read Alex Xu chapter 4 on Rate Limiting..."
                              value={customItemText}
                              onChange={(e) => setCustomItemText(e.target.value)}
                              style={{ width: '100%', fontSize: '0.85rem' }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Priority:</span>
                                {['critical', 'important', 'helpful'].map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setCustomItemPriority(p)}
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      border: customItemPriority === p ? '1px solid var(--primary)' : '1px solid var(--border)',
                                      background: customItemPriority === p ? 'var(--primary)' : 'var(--bg-card)',
                                      color: customItemPriority === p ? '#fff' : 'var(--text-muted)',
                                      fontSize: '0.72rem',
                                      cursor: 'pointer',
                                      textTransform: 'capitalize'
                                    }}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => setActiveAddingCategory(null)}
                                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => handleAddCustomItem(cat.id)}
                                  style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                                >
                                  Add Item
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAddingCategory(cat.id);
                              setCustomItemText('');
                            }}
                            style={{
                              background: 'none',
                              border: '1px dashed var(--border)',
                              borderRadius: '8px',
                              width: '100%',
                              padding: '8px',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Plus size={15} /> Add Custom Prep Task to {cat.title}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CREATE NEW CHECKLIST MODAL */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.25s ease'
          }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '800' }}>
              Create New Interview Prep Checklist
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Generates a tailored preparation roadmap with ~25 experience-calibrated milestones.
            </p>

            <form onSubmit={handleCreateChecklist} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                  Checklist Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Senior Frontend Prep"
                  value={newChecklistName}
                  onChange={(e) => setNewChecklistName(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                  Experience Level
                </label>
                <ExperienceLevelBadge
                  levelId={newChecklistLevel}
                  interactive={true}
                  onSelectLevel={(lvlId) => setNewChecklistLevel(lvlId)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Meta"
                    value={newChecklistCompany}
                    onChange={(e) => setNewChecklistCompany(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                    Target Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineer"
                    value={newChecklistRole}
                    onChange={(e) => setNewChecklistRole(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {trackedApplications.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                    Link to Tracked Job Application (Optional)
                  </label>
                  <select
                    value={newChecklistAppId}
                    onChange={(e) => {
                      setNewChecklistAppId(e.target.value);
                      const matched = trackedApplications.find(a => a.id === e.target.value);
                      if (matched) {
                        if (!newChecklistCompany) setNewChecklistCompany(matched.company);
                        if (!newChecklistRole) setNewChecklistRole(matched.title);
                        if (!newChecklistName) setNewChecklistName(`${matched.company} Interview Prep`);
                      }
                    }}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Standalone Checklist --</option>
                    {trackedApplications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.company} — {app.title} ({app.status || 'Tracked'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Create Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
