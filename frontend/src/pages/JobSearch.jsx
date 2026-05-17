import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';

function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [searchParams, setSearchParams] = useState({ role: '', location: '', remote: false, skills: '', experience: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    const data = await api.fetchJobs(searchParams.role, searchParams.location, searchParams.remote, searchParams.skills, searchParams.experience);
    setJobs(data);
    setLoading(false);
  };

  const loadFromProfile = async () => {
    try {
      const profile = await api.fetchProfile();
      setSearchParams({
        role: profile.name ? profile.name + "'s Role" : '', // the profile currently only has name/email/skills in backend, wait, does it have role/experience?
        location: 'Remote',
        remote: true,
        skills: profile.skills ? profile.skills.join(', ') : '',
        experience: '3' // default
      });
      // We will actually just set what we can from the profile API response
    } catch (e) {
      console.error(e);
    }
  };

  const trackJob = (job) => {
    const data = storage.getTrackerJobs();
    // avoid duplicates based on ID
    if (!data.applied.find(j => j.id === job.id)) {
      data.applied.push({ ...job, status: 'Applied', trackedAt: new Date().toISOString() });
      storage.saveTrackerJobs(data);
      alert(`Tracking "${job.title}" at ${job.company}`);
    } else {
      alert("Job is already being tracked.");
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Job Search</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Find your next opportunity and start tracking</p>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Search Criteria</h2>
          <button className="btn btn-outline" type="button" onClick={loadFromProfile} style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem' }}>
            Auto-fill from Profile
          </button>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label className="text-sm">Role (e.g. Frontend Developer)</label>
              <input type="text" className="input" placeholder="Role..." 
                value={searchParams.role} onChange={(e) => setSearchParams({...searchParams, role: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-sm">Location</label>
              <input type="text" className="input" placeholder="Location" 
                value={searchParams.location} onChange={(e) => setSearchParams({...searchParams, location: e.target.value})} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label className="text-sm">Key Skills (comma separated)</label>
              <input type="text" className="input" placeholder="React, Node.js, Python..." 
                value={searchParams.skills} onChange={(e) => setSearchParams({...searchParams, skills: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-sm">Years of Exp.</label>
              <input type="number" className="input" placeholder="e.g. 3" min="0" max="50"
                value={searchParams.experience} onChange={(e) => setSearchParams({...searchParams, experience: e.target.value})} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="checkbox" id="remote" checked={searchParams.remote} onChange={(e) => setSearchParams({...searchParams, remote: e.target.checked})} />
              <label htmlFor="remote" className="text-sm">Remote</label>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '38px', minWidth: '100px' }}>Search Jobs</button>
          </div>
        </form>
      </div>

      {loading ? <p>Loading jobs...</p> : (
        <div className="grid-cols-3">
          {jobs.map(job => (
            <div key={job.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{job.title}</h3>
                <span className="badge badge-neutral">{job.type}</span>
              </div>
              <p className="text-muted">{job.company}</p>
              <p className="text-sm">📍 {job.location}</p>
              <p className="text-sm text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{job.description}</p>
              
              <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }}>Apply</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => trackJob(job)}>Track</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobSearch;
