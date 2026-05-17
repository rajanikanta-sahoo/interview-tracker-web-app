import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';

function Tracker() {
  const [trackerData, setTrackerData] = useState({ applied: [], interviewing: [], offer: [], rejected: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTrackerData(storage.getTrackerJobs());
  };

  const moveJob = (job, fromStatus, toStatus) => {
    const data = { ...trackerData };
    data[fromStatus] = data[fromStatus].filter(j => j.id !== job.id);
    job.status = toStatus === 'applied' ? 'Applied' : toStatus === 'interviewing' ? 'Interviewing' : toStatus === 'offer' ? 'Offer' : 'Rejected';
    data[toStatus].push(job);
    setTrackerData(data);
    storage.saveTrackerJobs(data);
  };

  const removeJob = (jobId, statusKey) => {
    if (window.confirm("Are you sure you want to remove this job from the tracker?")) {
      const data = { ...trackerData };
      data[statusKey] = data[statusKey].filter(j => j.id !== jobId);
      setTrackerData(data);
      storage.saveTrackerJobs(data);
    }
  };

  const renderColumn = (title, statusKey, jobs) => (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem' }}>{title}</h3>
        <span className="badge badge-neutral">{jobs.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {jobs.map(job => (
          <div key={job.id} className="card" style={{ padding: '1rem', cursor: 'pointer' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{job.title}</h4>
            <p className="text-muted text-sm" style={{ marginBottom: '0.5rem' }}>{job.company}</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select className="input" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem' }} value={statusKey} onChange={(e) => moveJob(job, statusKey, e.target.value)}>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
              <button 
                className="btn btn-outline" 
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => removeJob(job.id, statusKey)}
                title="Remove Job"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Application Tracker</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Track your job applications and progress</p>

      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {renderColumn('1. Applied', 'applied', trackerData.applied)}
        {renderColumn('2. Interviewing', 'interviewing', trackerData.interviewing)}
        {renderColumn('3. Offer', 'offer', trackerData.offer)}
        {renderColumn('4. Rejected', 'rejected', trackerData.rejected)}
      </div>
    </div>
  );
}

export default Tracker;
