import React, { useState } from 'react';
import { api } from '../services/api';

function Contribute() {
  const [jobForm, setJobForm] = useState({ title: '', company: '', department: '', location: '', description: '', requirements: '' });
  const [questionForm, setQuestionForm] = useState({ group: '', keyAreas: '', difficulty: '', text: '' });
  const [questionFile, setQuestionFile] = useState(null);
  const [activeTab, setActiveTab] = useState('text');

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    await api.addCustomJob({ ...jobForm });
    alert("Job successfully added!");
    setJobForm({ title: '', company: '', department: '', location: '', description: '', requirements: '' });
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'text') {
      await api.addQuestionText({ ...questionForm, role: 'General' });
      alert("Question successfully added!");
      setQuestionForm({ group: '', keyAreas: '', difficulty: '', text: '' });
    } else {
      if (!questionFile) return alert("Please select a file");
      await api.uploadQuestionFile({ group: questionForm.group, keyAreas: questionForm.keyAreas, difficulty: questionForm.difficulty, role: 'General' }, questionFile);
      alert("File uploaded successfully!");
      setQuestionFile(null);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Contribute & Evaluate</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Submit your contributions and feedback here.</p>

      <div className="grid-cols-2">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>Add Custom Job Opening</h2>
          <form onSubmit={handleJobSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid-cols-2">
              <div>
                <label className="text-sm">Job Title</label>
                <input required type="text" className="input" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} />
              </div>
              <div>
                <label className="text-sm">Company Name</label>
                <input required type="text" className="input" value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} />
              </div>
            </div>
            <div className="grid-cols-2">
              <div>
                <label className="text-sm">Department</label>
                <input type="text" className="input" value={jobForm.department} onChange={e => setJobForm({...jobForm, department: e.target.value})} />
              </div>
              <div>
                <label className="text-sm">Location</label>
                <input type="text" className="input" value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-sm">Job Description</label>
              <textarea className="input" rows="3" value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})}></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setJobForm({ title: '', company: '', department: '', location: '', description: '', requirements: '' })}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Job</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>Add Interview Questions</h2>
          <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div>
              <label className="text-sm">Question Group (e.g., Core Java, Spring Boot)</label>
              <input required type="text" className="input" placeholder="e.g. Core Java" value={questionForm.group} onChange={e => setQuestionForm({...questionForm, group: e.target.value})} />
            </div>

            <div className="grid-cols-2">
              <div>
                <label className="text-sm">Key Areas (Optional)</label>
                <input type="text" className="input" placeholder="e.g. Multithreading, MVC" value={questionForm.keyAreas} onChange={e => setQuestionForm({...questionForm, keyAreas: e.target.value})} />
              </div>
              <div>
                <label className="text-sm">Difficulty Level (Optional)</label>
                <select className="input" value={questionForm.difficulty} onChange={e => setQuestionForm({...questionForm, difficulty: e.target.value})}>
                  <option value="">Select...</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>


            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <button type="button" style={{ flex: 1, padding: '0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'text' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === 'text' ? 'bold' : 'normal' }} onClick={() => setActiveTab('text')}>Input Raw Text</button>
              <button type="button" style={{ flex: 1, padding: '0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'file' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === 'file' ? 'bold' : 'normal' }} onClick={() => setActiveTab('file')}>Upload File</button>
            </div>

            {activeTab === 'text' ? (
              <div>
                <label className="text-sm">Input Question</label>
                <textarea required className="input" rows="5" placeholder="Type or paste question here..." value={questionForm.text} onChange={e => setQuestionForm({...questionForm, text: e.target.value})}></textarea>
              </div>
            ) : (
              <div style={{ padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
                <input type="file" required accept=".pdf,.doc,.docx" onChange={e => setQuestionFile(e.target.files[0])} />
                <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>Upload Interview Questions (PDF or DOC file)</p>
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">{activeTab === 'text' ? 'Save Questions' : 'Upload File'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Contribute;
