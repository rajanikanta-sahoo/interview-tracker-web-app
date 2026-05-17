import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function Profile() {
  const [profile, setProfile] = useState({
    name: '', role: '', experience: '', skills: [],
    preferences: { location: '', salary: '', type: '' }
  });
  const [skillInput, setSkillInput] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    api.fetchProfile().then(data => setProfile(data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('pref_')) {
      const prefName = name.split('_')[1];
      setProfile({ ...profile, preferences: { ...profile.preferences, [prefName]: value } });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (skillInput && !profile.skills.includes(skillInput)) {
      setProfile({ ...profile, skills: [...profile.skills, skillInput] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const handleSave = async () => {
    await api.updateProfile(profile);
    if (resumeFile) {
      const res = await api.uploadResume(resumeFile);
      setProfile(prev => ({ ...prev, resumePath: res.resumePath }));
    }
    alert('Profile saved successfully!');
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>User Profile</h2>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Update your personal details and professional information</p>

      <div className="grid-cols-2" style={{ marginBottom: '1.5rem' }}>
        <div>
          <label className="text-sm">Name</label>
          <input type="text" name="name" className="input" value={profile.name} onChange={handleChange} />
        </div>
        <div></div>
        <div>
          <label className="text-sm">Current Role</label>
          <input type="text" name="role" className="input" value={profile.role} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm">Years of Experience</label>
          <input type="number" name="experience" className="input" value={profile.experience} onChange={handleChange} />
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label className="text-sm">Key Skills</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {profile.skills.map(skill => (
            <span key={skill} className="badge badge-neutral" style={{ padding: '0.5rem' }}>
              {skill} <span style={{ cursor: 'pointer', marginLeft: '0.5rem' }} onClick={() => removeSkill(skill)}>×</span>
            </span>
          ))}
        </div>
        <form onSubmit={addSkill} style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" className="input" placeholder="Add skill..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)} />
          <button type="submit" className="btn btn-outline">Add</button>
        </form>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Job Preferences</h3>
      <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
        <div>
          <label className="text-sm">Location</label>
          <input type="text" name="pref_location" className="input" value={profile.preferences?.location} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm">Minimum Salary</label>
          <input type="text" name="pref_salary" className="input" value={profile.preferences?.salary} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm">Job Type</label>
          <select name="pref_type" className="input" value={profile.preferences?.type} onChange={handleChange}>
            <option value="">Select...</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
        <input type="file" onChange={(e) => setResumeFile(e.target.files[0])} accept=".pdf,.doc,.docx" />
        <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>Upload Resume (PDF/DOC)</p>
      </div>

      {profile.resumePath && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Document Review</h3>
          {profile.resumePath.toLowerCase().endsWith('.pdf') ? (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe src={`http://localhost:5001${profile.resumePath}`} width="100%" height="400px" style={{ border: 'none' }} title="Resume Preview"></iframe>
            </div>
          ) : (
            <p className="text-muted">Preview not available for this file type. <a href={`http://localhost:5001${profile.resumePath}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Download to view</a>.</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
}

export default Profile;
