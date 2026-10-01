import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, DollarSign, ExternalLink, FileText,
  Trash2, X, Briefcase, Clock, Calendar, BookOpen
} from 'lucide-react';
import { storage } from '../services/storage';
import { api } from '../services/api';

// ── constants ────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'applied',      label: 'Applied',      color: '#3b82f6', bg: 'var(--surface-alt)', border: 'var(--border-color)', badgeBg: 'rgba(59, 130, 246, 0.15)', dot: '#3b82f6' },
  { key: 'interviewing', label: 'Interviewing',  color: '#f59e0b', bg: 'var(--surface-alt)', border: 'var(--border-color)', badgeBg: 'rgba(245, 158, 11, 0.15)', dot: '#f59e0b' },
  { key: 'offer',        label: 'Offer Received', color: '#10b981', bg: 'var(--surface-alt)', border: 'var(--border-color)', badgeBg: 'rgba(16, 185, 129, 0.15)', dot: '#10b981' },
  { key: 'rejected',     label: 'Archived / Reject', color: '#64748b', bg: 'var(--surface-alt)', border: 'var(--border-color)', badgeBg: 'rgba(100, 116, 139, 0.15)', dot: '#94a3b8' },
];

const EMPTY_JOB = {
  title: '', company: '', url: '', salary: '',
  appliedDate: new Date().toISOString().slice(0, 10),
  interviewDate: '', interviewTime: '', interviewType: 'Technical Round',
  notes: '', status: 'applied', round: '',
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

// ── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ data }) {
  const total      = Object.values(data).flat().length;
  const active     = (data.applied?.length || 0) + (data.interviewing?.length || 0);
  const offers     = data.offer?.length || 0;
  const successPct = total ? Math.round((offers / total) * 100) : 0;

  const stats = [
    { label: 'Total Applications', value: total, sub: 'All pipeline items', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    { label: 'In Progress',        value: active, sub: 'Active pipeline', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Offers Secured',     value: offers, sub: 'Final conversion', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Conversion Rate',    value: `${successPct}%`, sub: 'Offer ratio', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
      {stats.map(s => (
        <div key={s.label} className="card" style={{
          padding: '1.25rem 1.4rem', borderRadius: '16px',
          border: '1px solid var(--border-color)',
          borderLeft: `4px solid ${s.color}`,
          display: 'flex', flexDirection: 'column', gap: '0.4rem',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{s.label}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: '800', color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '500' }}>{s.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Add Job Modal ─────────────────────────────────────────────────────────────
function AddJobModal({ onClose, onAdd }) {
  const [job, setJob] = useState(EMPTY_JOB);
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const handle = (e) => {
    const { name, value } = e.target;
    setJob(p => ({ ...p, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!job.title || !job.company) return;
    onAdd({ ...job, id: `manual-${Date.now()}` });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '2rem', borderRadius: '20px', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>Add Job Application</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Track a new submission in your personal pipeline</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Job Title *</label>
              <input ref={firstRef} className="input" name="title" value={job.title} onChange={handle} placeholder="Senior Frontend Engineer" required />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Company *</label>
              <input className="input" name="company" value={job.company} onChange={handle} placeholder="Google, Stripe..." required />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Expected Salary / Comp</label>
              <input className="input" name="salary" value={job.salary} onChange={handle} placeholder="₹24 LPA / $150k" />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Applied Date</label>
              <input className="input" type="date" name="appliedDate" value={job.appliedDate} onChange={handle} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Job Posting URL</label>
            <input className="input" name="url" value={job.url} onChange={handle} placeholder="https://careers.company.com/job/..." />
          </div>

          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Initial Column</label>
            <select className="input" name="status" value={job.status} onChange={handle}>
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>

          {/* Optional Interview Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Interview Date</label>
              <input className="input" type="date" name="interviewDate" value={job.interviewDate || ''} onChange={handle} />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Time</label>
              <input className="input" type="time" name="interviewTime" value={job.interviewTime || ''} onChange={handle} />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Round Type</label>
              <select className="input" name="interviewType" value={job.interviewType || 'Technical Round'} onChange={handle}>
                <option value="Screening">Screening</option>
                <option value="Technical Round">Technical</option>
                <option value="System Design">System Design</option>
                <option value="Behavioral">Behavioral</option>
                <option value="Final / Manager">Final Round</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Interview Notes & Next Steps</label>
            <textarea className="input" name="notes" value={job.notes} onChange={handle} rows={3}
              placeholder="e.g. Recruiter screened, Technical round on Tuesday with Lead Architect..."
              style={{ resize: 'vertical', padding: '0.65rem', lineHeight: '1.45' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ borderRadius: '10px' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px', gap: '0.35rem' }}>
              <Plus size={15} /> Save Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, statusKey, colColor, onMove, onDelete, onUpdate }) {
  const navigate = useNavigate();
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(job.notes || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const days = daysSince(job.appliedDate);
  const daysUntilInterview = daysUntil(job.interviewDate);

  const saveNotes = () => {
    onUpdate(job.id, statusKey, { notes: notesDraft });
    setNotesOpen(false);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: job.id, fromStatus: statusKey }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={!isDeleting}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        background: 'var(--surface)',
        borderRadius: '14px',
        padding: '1.1rem',
        border: isDragging ? `2px dashed ${colColor}` : '1px solid var(--border-color)',
        borderLeft: `4px solid ${colColor}`,
        boxShadow: isDragging ? 'none' : 'var(--shadow-xs)',
        opacity: isDragging ? 0.35 : 1,
        cursor: isDeleting ? 'default' : 'grab',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={e => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'var(--border-hover)';
        }
      }}
      onMouseLeave={e => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }
      }}
    >
      {/* Title + Company */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '8px',
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '800', color: 'var(--text-main)', flexShrink: 0
            }}>
              {(job.company || '?')[0].toUpperCase()}
            </div>
            <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: '700', lineHeight: '1.3', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {job.title}
            </h4>
          </div>
          <p style={{ margin: '0.2rem 0 0 2.15rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            {job.company}
          </p>
        </div>
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.65rem 0' }}>
        {days !== null && (
          <span style={{ fontSize: '11px', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'var(--surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}>
            <Clock size={11} /> {days === 0 ? 'Today' : `${days}d ago`}
          </span>
        )}
        {job.salary && (
          <span style={{ fontSize: '11px', padding: '0.2rem 0.5rem', borderRadius: '6px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <DollarSign size={11} /> {job.salary}
          </span>
        )}
        {job.round && (
          <span style={{ fontSize: '11px', padding: '0.2rem 0.5rem', borderRadius: '6px', background: `${colColor}15`, color: colColor, border: `1px solid ${colColor}30`, fontWeight: '700' }}>
            Round {job.round}
          </span>
        )}
        {job.interviewDate && (
          <span style={{ 
            fontSize: '11px', padding: '0.2rem 0.5rem', borderRadius: '6px', 
            background: daysUntilInterview <= 1 ? '#fee2e2' : '#fef3c7', 
            color: daysUntilInterview <= 1 ? '#b91c1c' : '#92400e', 
            border: `1px solid ${daysUntilInterview <= 1 ? '#fecaca' : '#fde68a'}`, 
            fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' 
          }}>
            <Calendar size={11} /> 
            {daysUntilInterview === 0 ? 'Today' : daysUntilInterview === 1 ? 'Tomorrow' : daysUntilInterview > 1 ? `In ${daysUntilInterview}d` : 'Passed'}
            {job.interviewType ? ` · ${job.interviewType}` : ''}
          </span>
        )}
      </div>

      {/* URL link */}
      {job.url && (
        <a href={job.url} target="_blank" rel="noreferrer" style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
          <ExternalLink size={12} /> View Posting
        </a>
      )}

      {/* Quick Role Prep Link */}
      {statusKey === 'interviewing' && (
        <button
          className="btn btn-outline"
          onClick={() => navigate(`/prep?role=${encodeURIComponent(job.title)}`)}
          style={{
            width: '100%',
            gap: '0.35rem',
            fontSize: '11px',
            height: '28px',
            borderRadius: '8px',
            color: 'var(--warning-text)',
            borderColor: 'var(--warning-border)',
            backgroundColor: 'var(--warning-bg)',
            marginBottom: '0.65rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Practice questions specifically for this role"
        >
          <BookOpen size={12} /> Practice Questions for Role
        </button>
      )}

      {/* Notes toggle */}
      <div style={{ marginBottom: '0.65rem' }}>
        <button onClick={() => setNotesOpen(!notesOpen)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem'
        }}>
          <FileText size={12} /> {notesOpen ? 'Hide Notes' : job.notes ? 'View Notes' : '+ Add Note'}
        </button>
        {notesOpen && (
          <div style={{ marginTop: '0.5rem', padding: '0.65rem', borderRadius: '10px', background: 'var(--surface-alt)', border: '1px solid var(--border-color)' }}>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              rows={3}
              className="input"
              style={{ fontSize: '12px', padding: '0.5rem', resize: 'vertical', width: '100%', boxSizing: 'border-box', background: 'var(--surface)' }}
              placeholder="Add key insights, questions asked, or interviewer names..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.4rem' }}>
              <button className="btn btn-outline" onClick={() => setNotesOpen(false)} style={{ padding: '0.25rem 0.6rem', fontSize: '11px', height: '26px', borderRadius: '6px' }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveNotes} style={{ padding: '0.25rem 0.65rem', fontSize: '11px', height: '26px', borderRadius: '6px' }}>Save Note</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls: Round input + Status selector + Delete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Rd:</span>
          <input type="number" className="input" min="1"
            style={{ width: '44px', padding: '0.15rem 0.35rem', fontSize: '11px', height: '26px', textAlign: 'center', borderRadius: '6px' }}
            value={job.round || ''}
            placeholder="—"
            onChange={e => onUpdate(job.id, statusKey, { round: e.target.value })}
          />
        </div>

        {isDeleting ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>Delete?</span>
            <button className="btn" onClick={() => onDelete(job.id, statusKey)}
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.2rem 0.5rem', fontSize: '11px', height: '24px', borderRadius: '6px' }}>Yes</button>
            <button className="btn btn-outline" onClick={() => setIsDeleting(false)}
              style={{ padding: '0.2rem 0.5rem', fontSize: '11px', height: '24px', borderRadius: '6px' }}>No</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <select className="input" value={statusKey}
              style={{ fontSize: '11px', padding: '0.15rem 0.45rem', height: '28px', maxWidth: '140px', borderRadius: '8px' }}
              onChange={e => onMove(job, statusKey, e.target.value)}>
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <button onClick={() => setIsDeleting(true)}
              style={{
                background: 'none', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444',
                cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Remove Application">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ col, isOver }) {
  const msgs = {
    applied:      'No applications here yet.\nDrag a card or add one above.',
    interviewing: 'No active rounds.\nMove cards here when interviews are scheduled.',
    offer:        'No offers received yet.\nKeep practicing and executing!',
    rejected:     'No archived applications.',
  };
  return (
    <div style={{
      textAlign: 'center', padding: '2.5rem 1.25rem', color: '#94a3b8',
      borderRadius: '12px',
      border: isOver ? '2px dashed var(--primary)' : '1.5px dashed #cbd5e1',
      backgroundColor: isOver ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
      transition: 'all 0.2s ease',
    }}>
      {isOver ? (
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>Drop card here to update status</p>
      ) : (
        msgs[col]?.split('\n').map((line, i) => (
          <p key={i} style={{ margin: '0.15rem 0', fontSize: '0.8rem', lineHeight: 1.4, color: '#94a3b8' }}>{line}</p>
        ))
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function Tracker() {
  const [searchParams] = useSearchParams();
  const [trackerData, setTrackerData] = useState(() => storage.getTrackerJobs());
  const [showModal, setShowModal]     = useState(() => searchParams.get('action') === 'add');
  const [search, setSearch]           = useState('');
  const [filterCol, setFilterCol]     = useState('all');
  const [dragOverCol, setDragOverCol] = useState(null);

  // Sync with backend on mount
  useEffect(() => {
    let isMounted = true;
    async function syncBackend() {
      try {
        const res = await api.getApplications();
        const serverData = res?.data || (res && typeof res === 'object' && Array.isArray(res.applied) ? res : null);
        if (serverData && isMounted) {
          const hasServerData = Object.values(serverData).some(arr => Array.isArray(arr) && arr.length > 0);
          const localData = storage.getTrackerJobs();
          const hasLocalData = Object.values(localData).some(arr => Array.isArray(arr) && arr.length > 0);

          if (hasServerData) {
            setTrackerData(serverData);
            storage.saveTrackerJobs(serverData);
          } else if (hasLocalData) {
            await api.saveApplications(localData);
          }
        }
      } catch (err) {
        console.warn('Backend sync failed, continuing offline:', err);
      }
    }
    syncBackend();
    return () => { isMounted = false; };
  }, []);

  const save = (data) => {
    setTrackerData(data);
    storage.saveTrackerJobs(data);
    api.saveApplications(data).catch(err => {
      console.warn('Could not sync applications to backend:', err);
    });
  };

  const addJob = (job) => {
    const data = { ...trackerData };
    data[job.status] = [...(data[job.status] || []), job];
    save(data);
  };

  const moveJob = (job, from, to) => {
    if (from === to) return;
    const data = { ...trackerData };
    data[from] = (data[from] || []).filter(j => j.id !== job.id);
    data[to]   = [...(data[to] || []), { ...job, status: to }];
    save(data);
  };

  const deleteJob = (id, statusKey) => {
    const data = { ...trackerData };
    data[statusKey] = data[statusKey].filter(j => j.id !== id);
    save(data);
  };

  const updateJob = (id, statusKey, fields) => {
    const data = { ...trackerData };
    const idx  = data[statusKey].findIndex(j => j.id === id);
    if (idx > -1) { data[statusKey][idx] = { ...data[statusKey][idx], ...fields }; save(data); }
  };

  // Filter logic
  const q = search.toLowerCase();
  const filtered = Object.fromEntries(
    COLUMNS.map(c => [
      c.key,
      (trackerData[c.key] || []).filter(j =>
        (filterCol === 'all' || filterCol === c.key) &&
        (!q || j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q))
      )
    ])
  );

  const totalVisible = Object.values(filtered).flat().length;

  return (
    <div>
      <style>{`
        .tracker-col-modern {
          flex: 1; min-width: 280px; border-radius: 18px;
          padding: 1.15rem; min-height: 480px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid var(--border-color);
        }
        .col-header-modern {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.15rem; padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-color);
        }
      `}</style>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', marginBottom: '0.4rem' }}>
            <Briefcase size={12} /> Pipeline Workflow
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.025em', color: 'var(--text-main)' }}>Application Board</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Drag and drop cards across interview stages or manage key notes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', height: '42px', borderRadius: '12px', padding: '0 1.25rem' }}>
          <Plus size={16} /> Add Application
        </button>
      </div>

      {/* Stats bar */}
      <StatsBar data={trackerData} />

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="input" style={{ width: '100%', paddingLeft: '36px', height: '40px', borderRadius: '12px' }}
            placeholder="Search by company or role..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: '160px', height: '40px', borderRadius: '12px' }} value={filterCol} onChange={e => setFilterCol(e.target.value)}>
          <option value="all">All Stages</option>
          {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        {(search || filterCol !== 'all') && (
          <button className="btn btn-outline" style={{ height: '40px', borderRadius: '12px', padding: '0 1rem' }} onClick={() => { setSearch(''); setFilterCol('all'); }}>
            Reset Filters
          </button>
        )}
      </div>

      {/* No results message */}
      {(search || filterCol !== 'all') && totalVisible === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
          <Search size={32} style={{ color: '#94a3b8', marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>No matching applications found</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Try a different role or company keyword.</p>
        </div>
      )}

      {/* Modern Kanban board */}
      <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1.5rem', alignItems: 'flex-start' }}>
        {COLUMNS.map(col => {
          const colJobs = filtered[col.key] || [];
          const show = filterCol === 'all' || filterCol === col.key;
          if (!show) return null;
          const isOver = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              className="tracker-col-modern"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverCol !== col.key) setDragOverCol(col.key);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget)) return;
                setDragOverCol(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverCol(null);
                const raw = e.dataTransfer.getData('application/json');
                if (!raw) return;
                try {
                  const payload = JSON.parse(raw);
                  if (payload?.id && payload?.fromStatus) {
                    const job = (trackerData[payload.fromStatus] || []).find(j => j.id === payload.id);
                    if (job) moveJob(job, payload.fromStatus, col.key);
                  }
                } catch (err) {
                  console.error('Drag drop parse error:', err);
                }
              }}
              style={{
                backgroundColor: isOver ? 'var(--surface-alt)' : col.bg,
                borderColor: isOver ? col.color : col.border,
                boxShadow: isOver ? `0 0 20px ${col.color}25` : 'none',
              }}
            >
              {/* Column header */}
              <div className="col-header-modern">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.dot }} />
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>{col.label}</h3>
                </div>
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '11px', fontWeight: '800',
                  background: col.badgeBg, color: col.color, border: `1px solid ${col.border}`
                }}>{colJobs.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {colJobs.length === 0
                  ? <EmptyState col={col.key} isOver={isOver} />
                  : colJobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      statusKey={col.key}
                      colColor={col.color}
                      onMove={moveJob}
                      onDelete={deleteJob}
                      onUpdate={updateJob}
                    />
                  ))
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Job Modal */}
      {showModal && <AddJobModal onClose={() => setShowModal(false)} onAdd={addJob} />}
    </div>
  );
}

export default Tracker;
