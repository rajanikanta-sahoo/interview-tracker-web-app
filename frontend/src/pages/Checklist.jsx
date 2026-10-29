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
  Search,
  Calendar,
  Clock,
  Edit3,
  RotateCcw,
  Download,
  Share2,
  Flame,
  BookOpen,
  Sparkles,
  X,
  Play,
  Pause,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import ExperienceLevelBadge from '../components/ExperienceLevelBadge';
import { resolveLevelFromYears, EXPERIENCE_LEVELS, LEVEL_EXPECTATIONS_SUMMARY } from '../utils/experience';

function generateCustomId() {
  return `custom-${Math.random().toString(36).slice(2, 10)}`;
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export default function Checklist() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState([]);
  const [activeChecklistId, setActiveChecklistId] = useState(null);
  const [trackedApplications, setTrackedApplications] = useState([]);

  // Prompt banner when user navigated with ?appId=... but no checklist exists
  const [promptCreateForApp, setPromptCreateForApp] = useState(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'critical', 'remaining', 'completed'
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistLevel, setNewChecklistLevel] = useState('mid');
  const [newChecklistCompany, setNewChecklistCompany] = useState('');
  const [newChecklistRole, setNewChecklistRole] = useState('');
  const [newChecklistAppId, setNewChecklistAppId] = useState('');
  const [newChecklistDate, setNewChecklistDate] = useState('');

  // Edit Checklist Details Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    companyName: '',
    role: '',
    experienceLevel: 'mid',
    interviewDate: '',
    applicationId: ''
  });

  // Level Rubric Modal
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [rubricLevelTab, setRubricLevelTab] = useState('senior');

  // Custom Item states
  const [activeAddingCategory, setActiveAddingCategory] = useState(null);
  const [customItemText, setCustomItemText] = useState('');
  const [customItemPriority, setCustomItemPriority] = useState('important');
  const [editingCustomItemId, setEditingCustomItemId] = useState(null);
  const [editingCustomItemText, setEditingCustomItemText] = useState('');
  const [editingCustomItemPriority, setEditingCustomItemPriority] = useState('important');

  // Expanded notes state
  const [expandedNotes, setExpandedNotes] = useState({});

  // Pomodoro Focus Timer state
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Timer interval countdown
  useEffect(() => {
    if (!timerActive || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          showToast("⏰ Practice session finished! Take a 5-minute break.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

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
        if (!ignore) {
          setNewChecklistLevel(userLevel);
          setRubricLevelTab(userLevel);
        }

        // 2. Load tracked applications
        const trackerData = storage.getTrackerJobs() || { applied: [], interviewing: [], offer: [], rejected: [] };
        const allApps = [
          ...(trackerData.interviewing || []),
          ...(trackerData.applied || []),
          ...(trackerData.offer || []),
          ...(trackerData.rejected || [])
        ];
        if (!ignore) setTrackedApplications(allApps);

        // 3. Load checklists from API
        const apiChecklists = await api.fetchChecklists();
        let list = Array.isArray(apiChecklists) ? apiChecklists : [];

        // If user came with ?appId=... or ?id=...
        const queryAppId = searchParams.get('appId');
        const queryId = searchParams.get('id');

        // If no checklists exist at all, auto-generate initial roadmap
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
              // No checklist exists for this tracked application! Offer prompt
              const matchedApp = allApps.find(a => a.id === queryAppId);
              if (matchedApp) {
                setPromptCreateForApp(matchedApp);
              }
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

  const currentLevelInfo = EXPERIENCE_LEVELS.find(l => l.id === activeChecklist?.experienceLevel) || EXPERIENCE_LEVELS[2];
  const overallProgress = activeChecklist?.progress || { total: 0, completed: 0, percentage: 0 };
  const daysUntilInterview = getDaysUntil(activeChecklist?.interviewDate);

  // Priority-based readiness statistics
  const priorityStats = useMemo(() => {
    const stats = {
      critical: { total: 0, completed: 0 },
      important: { total: 0, completed: 0 },
      helpful: { total: 0, completed: 0 }
    };
    if (!activeChecklist) return stats;

    (activeChecklist.categories || []).forEach(cat => {
      (cat.items || []).forEach(item => {
        const p = item.priority || 'important';
        if (stats[p]) {
          stats[p].total++;
          if (item.checked) stats[p].completed++;
        }
      });
    });

    (activeChecklist.customItems || []).forEach(ci => {
      const p = ci.priority || 'important';
      if (stats[p]) {
        stats[p].total++;
        if (ci.checked) stats[p].completed++;
      }
    });

    return stats;
  }, [activeChecklist]);

  // Overall readiness status badge
  const readinessTier = useMemo(() => {
    const pct = overallProgress.percentage;
    if (pct >= 90) return { label: 'Peak Mastery — Ready to Ace!', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: <Sparkles size={14} /> };
    if (pct >= 70) return { label: 'Interview Ready — Strong Bar', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', icon: <Award size={14} /> };
    if (pct >= 40) return { label: 'Building Momentum — Keep Pushing', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: <TrendingUpIcon /> };
    return { label: 'Early Prep Stage — Follow Milestones', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', icon: <ClipboardCheck size={14} /> };
  }, [overallProgress.percentage]);

  // All category IDs for Expand/Collapse All
  const allCategoryIds = useMemo(() => {
    return (activeChecklist?.categories || []).map(c => c.id);
  }, [activeChecklist]);

  const areAllCollapsed = useMemo(() => {
    if (allCategoryIds.length === 0) return false;
    return allCategoryIds.every(id => !!collapsedCategories[id]);
  }, [allCategoryIds, collapsedCategories]);

  const handleToggleExpandAll = () => {
    if (areAllCollapsed) {
      setCollapsedCategories({});
    } else {
      const all = {};
      allCategoryIds.forEach(id => { all[id] = true; });
      setCollapsedCategories(all);
    }
  };

  // Handle switching active checklist
  const handleSelectChecklist = (id) => {
    setActiveChecklistId(id);
    setSearchParams({ id });
    setPromptCreateForApp(null);
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

    const updatedChecklist = {
      ...activeChecklist,
      categories: updatedCategories
    };

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

    let total = 0;
    let completed = 0;
    for (const c of activeChecklist.categories) {
      for (const i of c.items) {
        total++;
        if (i.checked) completed++;
      }
    }
    for (const ci of updatedCustom) {
      total++;
      if (ci.checked) completed++;
    }
    updatedChecklist.progress = {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };

    setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? updatedChecklist : c));
    setCustomItemText('');
    setActiveAddingCategory(null);

    try {
      await api.updateChecklist(activeChecklist.id, { customItems: updatedCustom });
      showToast("Custom prep task added!");
    } catch (e) {
      console.error("Failed adding custom item", e);
    }
  };

  // Delete custom item
  const handleDeleteCustomItem = async (itemId) => {
    if (!activeChecklist) return;

    const updatedCustom = (activeChecklist.customItems || []).filter(ci => ci.id !== itemId);
    const updatedChecklist = {
      ...activeChecklist,
      customItems: updatedCustom
    };

    let total = 0;
    let completed = 0;
    for (const c of activeChecklist.categories) {
      for (const i of c.items) {
        total++;
        if (i.checked) completed++;
      }
    }
    for (const ci of updatedCustom) {
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
      await api.updateChecklist(activeChecklist.id, { customItems: updatedCustom });
      showToast("Custom task removed");
    } catch (e) {
      console.error("Failed deleting custom item", e);
    }
  };

  // Edit custom item
  const handleStartEditCustomItem = (item) => {
    setEditingCustomItemId(item.id);
    setEditingCustomItemText(item.text);
    setEditingCustomItemPriority(item.priority || 'important');
  };

  const handleSaveCustomItemEdit = async (itemId) => {
    if (!editingCustomItemText.trim() || !activeChecklist) return;

    const updatedCustom = (activeChecklist.customItems || []).map(ci => {
      if (ci.id !== itemId) return ci;
      return {
        ...ci,
        text: editingCustomItemText.trim(),
        priority: editingCustomItemPriority
      };
    });

    const updatedChecklist = {
      ...activeChecklist,
      customItems: updatedCustom
    };

    setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? updatedChecklist : c));
    setEditingCustomItemId(null);

    try {
      await api.updateChecklist(activeChecklist.id, { customItems: updatedCustom });
      showToast("Custom task updated");
    } catch (e) {
      console.error("Failed updating custom item", e);
    }
  };

  // Category bulk actions: Mark all complete or reset
  const handleMarkCategoryAll = async (catId, markComplete = true) => {
    if (!activeChecklist) return;

    const updatedCategories = activeChecklist.categories.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => ({ ...item, checked: markComplete }))
      };
    });

    const updatedCustom = (activeChecklist.customItems || []).map(ci => {
      if (ci.categoryId !== catId) return ci;
      return { ...ci, checked: markComplete };
    });

    let total = 0;
    let completed = 0;
    for (const c of updatedCategories) {
      for (const i of c.items) {
        total++;
        if (i.checked) completed++;
      }
    }
    for (const ci of updatedCustom) {
      total++;
      if (ci.checked) completed++;
    }

    const updatedChecklist = {
      ...activeChecklist,
      categories: updatedCategories,
      customItems: updatedCustom,
      progress: {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    };

    setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? updatedChecklist : c));

    try {
      await api.updateChecklist(activeChecklist.id, {
        categories: updatedCategories,
        customItems: updatedCustom
      });
      showToast(markComplete ? "All category items marked complete" : "Category items unchecked");
    } catch (e) {
      console.error("Failed updating category bulk toggle", e);
    }
  };

  // Reset entire checklist progress
  const handleResetChecklist = async () => {
    if (!activeChecklist) return;
    if (!window.confirm(`Reset progress on "${activeChecklist.name}"? All completed milestones will be unchecked.`)) return;

    const updatedCategories = activeChecklist.categories.map(cat => ({
      ...cat,
      items: cat.items.map(i => ({ ...i, checked: false }))
    }));
    const updatedCustom = (activeChecklist.customItems || []).map(ci => ({ ...ci, checked: false }));

    let total = 0;
    for (const c of updatedCategories) total += c.items.length;
    total += updatedCustom.length;

    const updatedChecklist = {
      ...activeChecklist,
      categories: updatedCategories,
      customItems: updatedCustom,
      progress: { total, completed: 0, percentage: 0 }
    };

    setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? updatedChecklist : c));

    try {
      await api.updateChecklist(activeChecklist.id, {
        categories: updatedCategories,
        customItems: updatedCustom
      });
      showToast("Checklist progress reset to 0%");
    } catch (e) {
      console.error("Failed resetting checklist", e);
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
        interviewDate: newChecklistDate || '',
        applicationId: newChecklistAppId || null
      });

      setChecklists(prev => [created, ...prev]);
      setActiveChecklistId(created.id);
      setShowNewModal(false);
      setNewChecklistName('');
      setNewChecklistCompany('');
      setNewChecklistRole('');
      setNewChecklistAppId('');
      setNewChecklistDate('');
      showToast("New tailored checklist created!");
    } catch (e) {
      console.error("Failed creating checklist", e);
      showToast("Failed to create checklist");
    }
  };

  // Create checklist triggered directly from tracker prompt banner
  const handleCreateFromAppPrompt = async (app) => {
    try {
      const created = await api.createChecklist({
        name: `${app.company} Interview Prep`,
        experienceLevel: newChecklistLevel,
        companyName: app.company,
        role: app.title,
        interviewDate: app.interviewDate || app.date || '',
        applicationId: app.id
      });

      setChecklists(prev => [created, ...prev]);
      setActiveChecklistId(created.id);
      setPromptCreateForApp(null);
      showToast(`Tailored checklist generated for ${app.company}!`);
    } catch (e) {
      console.error("Failed creating checklist from prompt", e);
      showToast("Failed to create checklist");
    }
  };

  // Edit details of active checklist
  const handleOpenEditModal = () => {
    if (!activeChecklist) return;
    setEditForm({
      name: activeChecklist.name || '',
      companyName: activeChecklist.companyName || '',
      role: activeChecklist.role || '',
      experienceLevel: activeChecklist.experienceLevel || 'mid',
      interviewDate: activeChecklist.interviewDate || '',
      applicationId: activeChecklist.applicationId || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !activeChecklist) return;

    try {
      const updated = await api.updateChecklist(activeChecklist.id, {
        name: editForm.name.trim(),
        companyName: editForm.companyName.trim(),
        role: editForm.role.trim(),
        experienceLevel: editForm.experienceLevel,
        interviewDate: editForm.interviewDate || '',
        applicationId: editForm.applicationId || null
      });

      setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? updated : c));
      setShowEditModal(false);
      showToast("Checklist details updated!");
    } catch (e) {
      console.error("Failed to update checklist", e);
      showToast("Failed to save changes");
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

  // Markdown Export generator
  const generateMarkdown = () => {
    if (!activeChecklist) return '';
    const lines = [];
    lines.push(`# ${activeChecklist.name}`);
    lines.push(`- **Target Role:** ${activeChecklist.role || 'Software Engineer'}`);
    if (activeChecklist.companyName) lines.push(`- **Company:** ${activeChecklist.companyName}`);
    lines.push(`- **Experience Bar:** ${currentLevelInfo.label}`);
    if (activeChecklist.interviewDate) lines.push(`- **Target Interview Date:** ${activeChecklist.interviewDate}`);
    lines.push(`- **Overall Readiness:** ${overallProgress.completed}/${overallProgress.total} (${overallProgress.percentage}%)`);
    lines.push('');

    (activeChecklist.categories || []).forEach(cat => {
      lines.push(`## ${cat.title}`);
      if (cat.description) lines.push(`*${cat.description}*`);
      lines.push('');

      const regular = cat.items || [];
      const custom = (activeChecklist.customItems || []).filter(ci => ci.categoryId === cat.id);

      regular.forEach(item => {
        const box = item.checked ? '[x]' : '[ ]';
        const priorityTag = `[${(item.priority || 'important').toUpperCase()}]`;
        lines.push(`- ${box} ${item.text} ${priorityTag}`);
        if (item.notes) {
          lines.push(`  > **Notes:** ${item.notes.replace(/\n/g, ' ')}`);
        }
      });

      custom.forEach(item => {
        const box = item.checked ? '[x]' : '[ ]';
        const priorityTag = `[${(item.priority || 'important').toUpperCase()} - CUSTOM]`;
        lines.push(`- ${box} ${item.text} ${priorityTag}`);
        if (item.notes) {
          lines.push(`  > **Notes:** ${item.notes.replace(/\n/g, ' ')}`);
        }
      });

      lines.push('');
    });

    return lines.join('\n');
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md).then(() => {
      showToast("Checklist copied to clipboard as Markdown!");
    }).catch(() => {
      showToast("Failed to copy to clipboard");
    });
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeChecklist.name || 'checklist').toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Markdown file downloaded!");
  };

  // Contextual deep-link builder
  const getContextualLink = (item, catId) => {
    if (!item.linkTo) return null;
    if (item.linkTo === '/prep') {
      const roleParam = activeChecklist?.role ? `&role=${encodeURIComponent(activeChecklist.role)}` : '';
      const levelParam = activeChecklist?.experienceLevel ? `&level=${activeChecklist.experienceLevel}` : '';
      if (catId === 'behavioral') {
        return `/prep?tab=star${levelParam}`;
      }
      if (catId === 'system_design') {
        return `/prep?topic=system-design${levelParam}${roleParam}`;
      }
      return `/prep?${levelParam ? levelParam.slice(1) : ''}${roleParam}`;
    }
    return item.linkTo;
  };

  // Filter items logic
  const filteredCategories = useMemo(() => {
    if (!activeChecklist || !activeChecklist.categories) return [];

    return activeChecklist.categories.map(cat => {
      let items = cat.items || [];
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

  const totalFilteredCount = useMemo(() => {
    return filteredCategories.reduce((acc, c) => acc + c.filteredItems.length, 0);
  }, [filteredCategories]);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px' }} />
        <p style={{ fontWeight: '500' }}>Loading your interview preparation checklists...</p>
      </div>
    );
  }

  return (
    <div className="checklist-page" style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Notification */}
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
          zIndex: 1100,
          fontWeight: '600',
          fontSize: '0.9rem',
          animation: 'fadeUp 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TRACKER AUTO-CREATE PROMPT BANNER */}
      {promptCreateForApp && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Tracked Opportunity: {promptCreateForApp.company} — {promptCreateForApp.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No preparation roadmap exists yet for this role. Generate an experience-calibrated checklist now?
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleCreateFromAppPrompt(promptCreateForApp)}
              title={`Generate an experience-calibrated preparation checklist for ${promptCreateForApp.company} (${promptCreateForApp.title})`}
              aria-label={`Generate checklist for ${promptCreateForApp.company}`}
              style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Generate Checklist for {promptCreateForApp.company}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setPromptCreateForApp(null)}
              title="Dismiss this recommendation prompt"
              aria-label="Dismiss recommendation"
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
            >
              Dismiss
            </button>
          </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
          }}>
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
              Interview Preparation Checklist
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Comprehensive readiness roadmap calibrated for candidate seniority and interview day success
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="action-buttons">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCopyMarkdown}
            title="Copy the entire preparation checklist with notes as GitHub/Notion-compatible Markdown"
            aria-label="Copy checklist as Markdown"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Share2 size={15} /> Copy Markdown
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleDownloadMarkdown}
            title="Download this preparation checklist as a .md Markdown file for offline study"
            aria-label="Download checklist as Markdown file"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Download size={15} /> Export .md
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePrint}
            title="Print this roadmap or export to PDF without sidebars or navigation chrome"
            aria-label="Print checklist or save as PDF"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Printer size={15} /> Print / PDF
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleDuplicate}
            disabled={!activeChecklist}
            title={activeChecklist ? `Create a duplicate copy of "${activeChecklist.name}" to prepare for another company or round` : "Select a checklist to duplicate"}
            aria-label="Duplicate this checklist"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Copy size={15} /> Duplicate
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewModal(true)}
            title="Create a new customized interview preparation roadmap tailored to your experience"
            aria-label="Create new checklist"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700' }}
          >
            <Plus size={16} /> New Checklist
          </button>
        </div>
      </div>

      {/* FOCUS TIMER BAR (Collapsible) */}
      {showTimer && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} style={{ color: timerActive ? '#10b981' : 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
              Practice Focus Timer (LeetCode / Mock Session):
            </span>
            <span style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              fontVariantNumeric: 'tabular-nums',
              color: timerActive ? '#10b981' : 'var(--text-main)',
              background: 'var(--bg-main)',
              padding: '2px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)'
            }}>
              {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${timerActive ? 'btn-outline' : 'btn-primary'}`}
              onClick={() => setTimerActive(prev => !prev)}
              title={timerActive ? "Pause the practice countdown timer" : "Start the countdown timer for focused problem solving (e.g. LeetCode / mock question)"}
              aria-label={timerActive ? "Pause timer" : "Start timer"}
              style={{ padding: '5px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {timerActive ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Start Timer</>}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setTimerActive(false);
                setTimerSeconds(25 * 60);
              }}
              title="Set countdown timer to 25 minutes (standard LeetCode problem or mock session duration)"
              aria-label="Set timer to 25 minutes"
              style={{ padding: '5px 10px', fontSize: '0.8rem' }}
            >
              25m
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setTimerActive(false);
                setTimerSeconds(45 * 60);
              }}
              title="Set countdown timer to 45 minutes (full-length system design or live coding interview duration)"
              aria-label="Set timer to 45 minutes"
              style={{ padding: '5px 10px', fontSize: '0.8rem' }}
            >
              45m
            </button>
            <button
              type="button"
              onClick={() => setShowTimer(false)}
              title="Close and hide the practice focus timer bar"
              aria-label="Close focus timer"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="checklist-workspace">
        
        {/* LEFT COLUMN: Checklist Manager & Navigation */}
        <div className="sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Target Experience Level & Rubric Card */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                Target Experience Bar
              </span>
              <Award size={16} style={{ color: currentLevelInfo.color }} />
            </div>
            <ExperienceLevelBadge levelId={activeChecklist?.experienceLevel} size="md" />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
              Checklist is calibrated for <strong>{currentLevelInfo.label}</strong> expectations.
            </div>
            <button
              type="button"
              onClick={() => {
                setRubricLevelTab(activeChecklist?.experienceLevel || 'mid');
                setShowRubricModal(true);
              }}
              title="Open the assessment rubric explaining technical, architectural, and behavioral expectations for this seniority level"
              aria-label="View level rubric and expectations"
              style={{
                marginTop: '10px',
                width: '100%',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: 'var(--primary)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <BookOpen size={14} /> View Level Rubric & Expectations
            </button>
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
                title="Create a new interview preparation checklist"
                aria-label="Create new checklist"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}
              >
                + New
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {checklists.map(c => {
                const isSelected = c.id === activeChecklistId;
                const lvl = EXPERIENCE_LEVELS.find(l => l.id === c.experienceLevel) || EXPERIENCE_LEVELS[2];
                const pct = c.progress?.percentage || 0;
                const days = getDaysUntil(c.interviewDate);

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
                      <span style={{ fontWeight: isSelected ? '700' : '600', fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '190px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        <Building size={12} />
                        <span>{c.companyName} {c.role ? `• ${c.role}` : ''}</span>
                      </div>
                    )}

                    {/* Interview Date Pill in List */}
                    {days !== null && (
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          background: days <= 1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                          color: days <= 1 ? '#ef4444' : '#3b82f6',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Calendar size={10} />
                          {days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : days < 0 ? 'Past' : `In ${days}d`}
                        </span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Active Checklist Header Card */}
          {activeChecklist && (
            <div className="card" style={{
              padding: '24px',
              background: 'linear-gradient(135deg, var(--bg-card), var(--bg-main))',
              position: 'relative',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, letterSpacing: '-0.3px' }}>
                      {activeChecklist.name}
                    </h2>
                    <button
                      type="button"
                      onClick={handleOpenEditModal}
                      title="Edit checklist title, role, company, target interview date, or experience level"
                      aria-label="Edit checklist details"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', opacity: 0.8 }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      title={`Permanently delete "${activeChecklist.name}"`}
                      aria-label="Delete this checklist"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.8 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Metadata Chips & Readiness Status */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
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
                    
                    {/* Readiness Status Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: readinessTier.bg,
                      color: readinessTier.color,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '0.75rem'
                    }}>
                      {readinessTier.icon} {readinessTier.label}
                    </span>
                  </div>

                  {/* Dynamic Interview Date & Countdown Alert */}
                  {daysUntilInterview !== null ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: daysUntilInterview <= 1 ? 'rgba(239, 68, 68, 0.12)' : daysUntilInterview <= 5 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.1)',
                      border: `1px solid ${daysUntilInterview <= 1 ? 'rgba(239, 68, 68, 0.3)' : daysUntilInterview <= 5 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
                      color: daysUntilInterview <= 1 ? '#ef4444' : daysUntilInterview <= 5 ? '#f59e0b' : '#3b82f6',
                      fontSize: '0.82rem',
                      fontWeight: '600'
                    }}>
                      <Calendar size={14} />
                      <span>
                        {daysUntilInterview === 0 && '🔴 TODAY is Interview Day! Review logistics and key STAR stories.'}
                        {daysUntilInterview === 1 && '🟡 TOMORROW: Final polish & mock review. Rest well tonight!'}
                        {daysUntilInterview > 1 && (
                          <>
                            ⏳ <strong>{daysUntilInterview} days</strong> remaining until interview ({activeChecklist.interviewDate})
                            {overallProgress.total - overallProgress.completed > 0 && ` • Pace: ~${Math.ceil((overallProgress.total - overallProgress.completed) / daysUntilInterview)} items/day`}
                          </>
                        )}
                        {daysUntilInterview < 0 && `Interview date was ${activeChecklist.interviewDate} (${Math.abs(daysUntilInterview)} days ago)`}
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        title="Update or reschedule the target interview date"
                        aria-label="Change target interview date"
                        style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', padding: '0 4px', textDecoration: 'underline', fontSize: '0.78rem' }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenEditModal}
                      title="Set an upcoming interview date to calculate remaining preparation days and daily milestone pacing"
                      aria-label="Set target interview date"
                      style={{
                        background: 'none',
                        border: '1px dashed var(--border)',
                        color: 'var(--text-muted)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Calendar size={13} /> + Set Target Interview Date
                    </button>
                  )}
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
                  <div style={{ width: '68px', height: '68px', position: 'relative' }}>
                    <svg width="68" height="68" viewBox="0 0 36 36">
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
                      fontSize: '0.78rem',
                      fontWeight: '800'
                    }}>
                      {overallProgress.percentage}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRIORITY READINESS BREAKDOWN BAR */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>Critical Milestones:</span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444'
                }}>
                  {priorityStats.critical.completed} / {priorityStats.critical.total} done
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Important:</span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b'
                }}>
                  {priorityStats.important.completed} / {priorityStats.important.total}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Helpful Polish:</span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981'
                }}>
                  {priorityStats.helpful.completed} / {priorityStats.helpful.total}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleResetChecklist}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Uncheck all completed milestones on this checklist to start a fresh preparation pass"
                aria-label="Reset checklist progress"
              >
                <RotateCcw size={13} /> Reset Progress
              </button>
            </div>
          </div>

          {/* SEARCH, FILTER & WORKSPACE CONTROLS BAR */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { id: 'all', label: 'All Items', tip: 'Show all preparation tasks across all categories' },
                { id: 'critical', label: '🔴 Critical Only', tip: 'Filter to show only critical deal-breaker interview milestones' },
                { id: 'remaining', label: 'Remaining', tip: 'Filter to show only unchecked tasks that still require preparation' },
                { id: 'completed', label: 'Completed', tip: 'Filter to show only milestones you have already completed' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPriorityFilter(f.id)}
                  title={f.tip}
                  aria-label={f.label}
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

            {/* Quick Actions: Expand/Collapse All & Study Timer Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="btn btn-outline"
                title={areAllCollapsed ? "Expand all category sections to show tasks" : "Collapse all category sections for a clean summary overview"}
                aria-label={areAllCollapsed ? "Expand all categories" : "Collapse all categories"}
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {areAllCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                <span>{areAllCollapsed ? 'Expand All' : 'Collapse All'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTimer(prev => !prev)}
                className={`btn ${showTimer ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title={showTimer ? "Hide the practice focus timer bar" : "Open 25-minute practice focus timer for timed problem solving (LeetCode / STAR simulations)"}
                aria-label="Toggle practice focus timer"
              >
                <Clock size={14} /> Focus Timer
              </button>

              {/* Keyword Search */}
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search tasks & notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input"
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem', height: '34px' }}
                />
              </div>
            </div>
          </div>

          {/* CHECKLIST CATEGORIES & ITEMS */}
          {totalFilteredCount === 0 && searchQuery.trim() ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                No preparation items match "{searchQuery}"
              </div>
              <p style={{ fontSize: '0.85rem', margin: '0 0 14px 0' }}>
                Try searching for different keywords or clear your search filter.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setSearchQuery(''); setPriorityFilter('all'); }}
                title="Clear keyword search and reset priority filter to All Items"
                aria-label="Clear search and filters"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
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
                      style={{
                        padding: '16px 20px',
                        background: 'var(--bg-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setCollapsedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Category Bulk Actions */}
                        <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleMarkCategoryAll(cat.id, true)}
                            title={`Mark all milestones in "${cat.title}" as completed`}
                            aria-label={`Mark all items in ${cat.title} completed`}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            Mark All Done
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkCategoryAll(cat.id, false)}
                            title={`Uncheck all milestones in "${cat.title}" to reset this section`}
                            aria-label={`Reset all items in ${cat.title}`}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            Reset
                          </button>
                        </div>

                        {/* Mini bar */}
                        <div style={{ width: '90px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
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
                            const isEditing = editingCustomItemId === item.id;
                            const contextualLink = getContextualLink(item, cat.id);

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
                                {isEditing ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
                                    <input
                                      type="text"
                                      value={editingCustomItemText}
                                      onChange={(e) => setEditingCustomItemText(e.target.value)}
                                      className="input"
                                      style={{ width: '100%', fontSize: '0.85rem' }}
                                      autoFocus
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority:</span>
                                        {['critical', 'important', 'helpful'].map(p => (
                                          <button
                                            key={p}
                                            type="button"
                                            onClick={() => setEditingCustomItemPriority(p)}
                                            title={`Set priority to ${p.toUpperCase()}`}
                                            aria-label={`Set priority ${p}`}
                                            style={{
                                              padding: '2px 8px',
                                              borderRadius: '8px',
                                              border: editingCustomItemPriority === p ? '1px solid var(--primary)' : '1px solid var(--border)',
                                              background: editingCustomItemPriority === p ? 'var(--primary)' : 'var(--bg-card)',
                                              color: editingCustomItemPriority === p ? '#fff' : 'var(--text-muted)',
                                              fontSize: '0.72rem',
                                              cursor: 'pointer',
                                              textTransform: 'capitalize'
                                            }}
                                          >
                                            {p}
                                          </button>
                                        ))}
                                      </div>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                          type="button"
                                          className="btn btn-outline"
                                          onClick={() => setEditingCustomItemId(null)}
                                          title="Discard edits to this task"
                                          aria-label="Cancel editing task"
                                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          onClick={() => handleSaveCustomItemEdit(item.id)}
                                          title="Save updated task description and priority"
                                          aria-label="Save custom task"
                                          style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                    {/* Checkbox & Text (Keyboard Accessible) */}
                                    <div
                                      role="checkbox"
                                      aria-checked={isChecked}
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === ' ' || e.key === 'Enter') {
                                          e.preventDefault();
                                          item.isCustom ? handleToggleCustomItem(item.id) : handleToggleItem(cat.id, item.id);
                                        }
                                      }}
                                      onClick={() => item.isCustom ? handleToggleCustomItem(item.id) : handleToggleItem(cat.id, item.id)}
                                      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', flex: 1, outline: 'none' }}
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

                                    {/* Badges, Actions & Links */}
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

                                      {/* Contextual Deep-link practice button */}
                                      {contextualLink && (
                                        <Link
                                          to={contextualLink}
                                          title="Open targeted practice questions and mock simulations for this milestone"
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

                                      {/* Custom Item Edit & Delete triggers */}
                                      {item.isCustom && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditCustomItem(item)}
                                            title="Edit task description and priority"
                                            aria-label="Edit custom task"
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                          >
                                            <Edit3 size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteCustomItem(item.id)}
                                            title="Delete this custom task from checklist"
                                            aria-label="Delete custom task"
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', opacity: 0.8 }}
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </>
                                      )}

                                      {/* Toggle Notes button */}
                                      <button
                                        type="button"
                                        onClick={() => setExpandedNotes(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                        title={item.notes ? "View or edit your personal preparation notes for this task" : "Add personal notes, LeetCode links, or gotchas for this task"}
                                        aria-label="Toggle notes"
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
                                )}

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
                                      placeholder="Add preparation notes, LeetCode problem links, or key gotchas..."
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
                                      title="Save your notes for this milestone"
                                      aria-label="Save notes"
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
                                      title={`Assign priority ${p.toUpperCase()} to this task`}
                                      aria-label={`Set priority ${p}`}
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
                                    title="Cancel and discard this custom task"
                                    aria-label="Cancel adding custom task"
                                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => handleAddCustomItem(cat.id)}
                                    title={`Add this custom task to the ${cat.title} category`}
                                    aria-label="Add custom task"
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
                              title={`Add a custom preparation milestone, problem link, or article to ${cat.title}`}
                              aria-label={`Add custom task to ${cat.title}`}
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
                                justifyCenter: 'center',
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
          )}
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
            maxWidth: '540px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.25s ease'
          }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '800' }}>
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
                  Target Experience Level
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

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                  Target Interview Date (Optional)
                </label>
                <input
                  type="date"
                  value={newChecklistDate}
                  onChange={(e) => setNewChecklistDate(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
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
                        if (!newChecklistDate && (matched.interviewDate || matched.date)) {
                          setNewChecklistDate(matched.interviewDate || matched.date);
                        }
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
                  title="Close without creating a new checklist"
                  aria-label="Cancel creating checklist"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  title="Generate a tailored interview preparation roadmap"
                  aria-label="Create checklist"
                >
                  Create Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CHECKLIST DETAILS MODAL */}
      {showEditModal && (
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
            maxWidth: '540px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.25s ease'
          }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '800' }}>
              Edit Checklist Details
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Update checklist name, target interview date, role, and connected application.
            </p>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                  Checklist Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                  Experience Level
                </label>
                <ExperienceLevelBadge
                  levelId={editForm.experienceLevel}
                  interactive={true}
                  onSelectLevel={(lvlId) => setEditForm(prev => ({ ...prev, experienceLevel: lvlId }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, companyName: e.target.value }))}
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
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                  Target Interview Date
                </label>
                <input
                  type="date"
                  value={editForm.interviewDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, interviewDate: e.target.value }))}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              {trackedApplications.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                    Linked Job Application
                  </label>
                  <select
                    value={editForm.applicationId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, applicationId: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="">-- No Linked Application --</option>
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
                  onClick={() => setShowEditModal(false)}
                  title="Discard changes and keep original checklist details"
                  aria-label="Cancel editing checklist details"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  title="Save and update checklist title, company, role, or interview date"
                  aria-label="Save changes"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEVEL RUBRIC & EXPECTATIONS MODAL */}
      {showRubricModal && (
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
            maxWidth: '680px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.25s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: '800' }}>
                  Interview Assessment Rubric
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  How technical hiring committees evaluate candidates at each seniority tier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRubricModal(false)}
                title="Close rubric modal"
                aria-label="Close rubric modal"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Level Selector Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
              {EXPERIENCE_LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setRubricLevelTab(lvl.id)}
                  title={`View hiring committee assessment rubric and core focus for ${lvl.label} tier (${lvl.desc})`}
                  aria-label={`View ${lvl.label} rubric`}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: rubricLevelTab === lvl.id ? `2px solid ${lvl.color}` : '1px solid var(--border)',
                    background: rubricLevelTab === lvl.id ? lvl.bg : 'var(--bg-main)',
                    color: rubricLevelTab === lvl.id ? lvl.color : 'var(--text-muted)',
                    fontWeight: rubricLevelTab === lvl.id ? '800' : '600',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {lvl.label} ({lvl.desc})
                </button>
              ))}
            </div>

            {/* Rubric Content */}
            {LEVEL_EXPECTATIONS_SUMMARY[rubricLevelTab] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Primary Assessment Focus
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {LEVEL_EXPECTATIONS_SUMMARY[rubricLevelTab].focus}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '10px', color: 'var(--text-main)' }}>
                    Key Competencies Expected by Interviewers:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {LEVEL_EXPECTATIONS_SUMMARY[rubricLevelTab].expectations.map((exp, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          fontSize: '0.85rem',
                          lineHeight: '1.45'
                        }}
                      >
                        <span style={{ color: '#10b981', fontWeight: '800', marginTop: '1px' }}>✓</span>
                        <span>{exp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowRubricModal(false)}
                title="Close rubric and return to your preparation checklist"
                aria-label="Close rubric"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
