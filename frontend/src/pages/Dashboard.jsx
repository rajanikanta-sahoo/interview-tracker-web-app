import React, { useEffect, useState } from 'react';
import { storage } from '../services/storage';

function Dashboard() {
  const [trackerStats, setTrackerStats] = useState({ applied: 0, interviewing: 0, offer: 0, rejected: 0 });

  useEffect(() => {
    const data = storage.getTrackerJobs();
    setTrackerStats({
      applied: data.applied ? data.applied.length : 0,
      interviewing: data.interviewing ? data.interviewing.length : 0,
      offer: data.offer ? data.offer.length : 0,
      rejected: data.rejected ? data.rejected.length : 0
    });
  }, []);

  const total = trackerStats.applied + trackerStats.interviewing + trackerStats.offer + trackerStats.rejected;

  const handleImport = (e) => {
    const file = e.target.files[0];
    if(file) {
      storage.importData(file, () => {
        alert("Data imported successfully!");
        e.target.value = null;
        window.location.reload();
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => document.getElementById('import-file').click()}>Import JSON</button>
          <input type="file" id="import-file" style={{ display: 'none' }} accept=".json" onChange={handleImport} />
          <button className="btn btn-primary" onClick={storage.exportData}>Export Data</button>
        </div>
      </div>

      <div className="grid-cols-3">
        <div className="card">
          <h3 className="text-muted text-sm">Total Applications</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '0.5rem' }}>{total}</p>
        </div>
        <div className="card">
          <h3 className="text-muted text-sm">Active Interviews</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--primary)' }}>{trackerStats.interviewing}</p>
        </div>
        <div className="card">
          <h3 className="text-muted text-sm">Offers Received</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--success)' }}>{trackerStats.offer}</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Welcome to Interview Tracker</h2>
        <p className="text-muted">Use the sidebar to prepare for interviews, search jobs, track your applications, and evaluate your progress.</p>
      </div>
    </div>
  );
}

export default Dashboard;
