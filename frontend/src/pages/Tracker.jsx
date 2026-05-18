import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../services/storage';

// ── constants ────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'applied',      label: 'Applied',      emoji: '📨', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)'  },
  { key: 'interviewing', label: 'Interviewing',  emoji: '🎯', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { key: 'offer',        label: 'Offer',         emoji: '🏆', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  { key: 'rejected',     label: 'Rejected',      emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
];

const EMPTY_JOB = {
  title: '', company: '', url: '', salary: '',
  appliedDate: new Date().toISOString().slice(0, 10),
  notes: '', status: 'applied', round: '',
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

// ── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ data }) {
  const total      = Object.values(data).flat().length;
  const active     = (data.applied?.length || 0) + (data.interviewing?.length || 0);
  const offers     = data.offer?.length || 0;
  const successPct = total ? Math.round((offers / total) * 100) : 0;

  const stats = [
    { label: 'Total Applied',   value: total,       color: '#3b82f6', icon: '📋' },
    { label: 'Active Pipeline', value: active,      color: '#f59e0b', icon: '⚡' },
    { label: 'Offers',          value: offers,      color: '#10b981', icon: '🏆' },
    { label: 'Success Rate',    value: `${successPct}%`, color: '#8b5cf6', icon: '📈' },
  ];

  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      {stats.map(s => (
        <div key={s.label} style={{
          flex: '1 1 140px', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border-color)', background: 'var(--card-bg)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          transition: 'transform 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
          <div>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.label}</p>
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
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0 }}>➕ Add Job Application</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-sm">Job Title *</label>
              <input ref={firstRef} className="input" name="title" value={job.title} onChange={handle} placeholder="Senior Java Developer" required />
            </div>
            <div>
              <label className="text-sm">Company *</label>
              <input className="input" name="company" value={job.company} onChange={handle} placeholder="Google" required />
            </div>
            <div>
              <label className="text-sm">Expected Salary</label>
              <input className="input" name="salary" value={job.salary} onChange={handle} placeholder="₹20 LPA" />
            </div>
            <div>
              <label className="text-sm">Applied Date</label>
              <input className="input" type="date" name="appliedDate" value={job.appliedDate} onChange={handle} />
            </div>
          </div>

          <div>
            <label className="text-sm">Job Posting URL</label>
            <input className="input" name="url" value={job.url} onChange={handle} placeholder="https://careers.google.com/..." />
          </div>

          <div>
            <label className="text-sm">Initial Status</label>
            <select className="input" name="status" value={job.status} onChange={handle}>
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm">Notes</label>
            <textarea className="input" name="notes" value={job.notes} onChange={handle} rows={3}
              placeholder="e.g. Referred by John, expect 2 rounds of technical..."
              style={{ resize: 'vertical', padding: '0.5rem', lineHeight: '1.4' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Application</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, statusKey, colColor, onMove, onDelete, onUpdate }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(job.notes || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const days = daysSince(job.appliedDate);

  const saveNotes = () => {
    onUpdate(job.id, statusKey, { notes: notesDraft });
    setNotesOpen(false);
  };

  return (
    <div style={{
      background: 'var(--card-bg)', borderRadius: '10px', padding: '0.9rem',
      border: '1px solid var(--border-color)',
      borderLeft: `3.5px solid ${colColor}`,
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.12)`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Title + Company */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', lineHeight: '1.3' }}>{job.title}</h4>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>{job.company}</p>
        </div>
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
        {days !== null && (
          <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
            📅 {days === 0 ? 'Today' : `${days}d ago`}
          </span>
        )}
        {job.salary && (
          <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: '600' }}>
            💰 {job.salary}
          </span>
        )}
        {job.round && (
          <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '10px', background: `${colColor}18`, color: colColor, border: `1px solid ${colColor}30`, fontWeight: '600' }}>
            Round {job.round}
          </span>
        )}
      </div>

      {/* URL link */}
      {job.url && (
        <a href={job.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: colColor, textDecoration: 'none', display: 'block', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🔗 View Posting
        </a>
      )}

      {/* Notes toggle */}
      <div style={{ marginBottom: '0.5rem' }}>
        <button onClick={() => setNotesOpen(!notesOpen)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem'
        }}>
          📝 {notesOpen ? 'Hide' : job.notes ? 'View' : 'Add'} Notes {notesOpen ? '▲' : '▼'}
        </button>
        {notesOpen && (
          <div style={{ marginTop: '0.4rem' }}>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              rows={3}
              className="input"
              style={{ fontSize: '0.78rem', padding: '0.4rem', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              placeholder="Interview notes, next steps..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '0.3rem' }}>
              <button className="btn btn-outline" onClick={() => setNotesOpen(false)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', height: '24px' }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveNotes} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', height: '24px' }}>Save</button>
            </div>
          </div>
        )}
      </div>

      {/* Round input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Round:</label>
        <input type="number" className="input" min="1"
          style={{ width: '52px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', height: '24px' }}
          value={job.round || ''}
          onChange={e => onUpdate(job.id, statusKey, { round: e.target.value })}
        />
      </div>

      {/* Actions row */}
      {isDeleting ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600', flex: 1 }}>Remove?</span>
          <button className="btn btn-primary" onClick={() => onDelete(job.id, statusKey)}
            style={{ background: '#ef4444', border: 'none', padding: '0.2rem 0.5rem', fontSize: '0.72rem', height: '24px' }}>Yes</button>
          <button className="btn btn-outline" onClick={() => setIsDeleting(false)}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', height: '24px' }}>No</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <select className="input" value={statusKey}
            style={{ flex: 1, fontSize: '0.72rem', padding: '0.2rem 0.4rem', height: '26px' }}
            onChange={e => onMove(job, statusKey, e.target.value)}>
            {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
          </select>
          <button onClick={() => setIsDeleting(true)}
            style={{ background: 'none', border: '1.5px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', width: '26px', height: '26px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="Remove">✕</button>
        </div>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ col }) {
  const msgs = {
    applied:      { icon: '📨', text: 'No applications yet.\nAdd a job or search for one!' },
    interviewing: { icon: '🎯', text: 'No interviews yet.\nMove applied jobs here when you hear back.' },
    offer:        { icon: '🏆', text: 'No offers yet.\nKeep pushing — you\'re close!' },
    rejected:     { icon: '❌', text: 'Nothing rejected yet.\nHopefully it stays that way! 🙂' },
  };
  const { icon, text } = msgs[col] || {};
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
      <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>{icon}</p>
      {text.split('\n').map((line, i) => <p key={i} style={{ margin: '0.1rem 0', fontSize: '0.78rem', lineHeight: 1.5 }}>{line}</p>)}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function Tracker() {
  const [trackerData, setTrackerData] = useState({ applied: [], interviewing: [], offer: [], rejected: [] });
  const [showModal, setShowModal]     = useState(false);
  const [search, setSearch]           = useState('');
  const [filterCol, setFilterCol]     = useState('all');

  useEffect(() => { setTrackerData(storage.getTrackerJobs()); }, []);

  const save = (data) => { setTrackerData(data); storage.saveTrackerJobs(data); };

  const addJob = (job) => {
    const data = { ...trackerData };
    data[job.status] = [...(data[job.status] || []), job];
    save(data);
  };

  const moveJob = (job, from, to) => {
    if (from === to) return;
    const data = { ...trackerData };
    data[from] = data[from].filter(j => j.id !== job.id);
    data[to]   = [...data[to], { ...job, status: to }];
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
        .tracker-col { flex: 1; min-width: 240px; border-radius: 12px; padding: 1rem; min-height: 420px; }
        .col-header  { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.9rem; padding-bottom:0.6rem; border-bottom: 2px solid; }
      `}</style>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Application Tracker</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>Track your job applications and pipeline progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '40px' }}>
          ＋ Add Job
        </button>
      </div>

      {/* Stats bar */}
      <StatsBar data={trackerData} />

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          className="input" style={{ flex: 1, minWidth: '200px' }}
          placeholder="🔍  Search by company or role..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="input" style={{ width: 'auto' }} value={filterCol} onChange={e => setFilterCol(e.target.value)}>
          <option value="all">All Columns</option>
          {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
        </select>
        {(search || filterCol !== 'all') && (
          <button className="btn btn-outline" style={{ height: '38px' }} onClick={() => { setSearch(''); setFilterCol('all'); }}>
            Clear
          </button>
        )}
      </div>

      {/* No results message */}
      {(search || filterCol !== 'all') && totalVisible === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.5rem', margin: 0 }}>🔍</p>
          <p>No applications match your search.</p>
        </div>
      )}

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start' }}>
        {COLUMNS.map(col => {
          const colJobs = filtered[col.key] || [];
          const show = filterCol === 'all' || filterCol === col.key;
          if (!show) return null;
          return (
            <div key={col.key} className="tracker-col" style={{ background: col.bg }}>
              {/* Column header */}
              <div className="col-header" style={{ borderColor: col.color }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1rem' }}>{col.emoji}</span>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: col.color }}>{col.label}</h3>
                </div>
                <span style={{
                  padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                  background: `${col.color}22`, color: col.color
                }}>{colJobs.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {colJobs.length === 0
                  ? <EmptyState col={col.key} />
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
