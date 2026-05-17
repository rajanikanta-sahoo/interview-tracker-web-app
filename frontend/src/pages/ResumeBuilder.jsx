import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

function ResumeBuilder() {
  const [activeTab, setActiveTab] = useState('resumes'); // 'resumes' or 'coverLetters'
  const [profile, setProfile] = useState({ name: '', skills: [] });
  
  // Resumes State
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef();

  // Cover Letters State
  const [coverLetters, setCoverLetters] = useState([]);
  const [currentCoverLetter, setCurrentCoverLetter] = useState(null);
  const clPreviewRef = useRef();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const prof = await api.fetchProfile();
    setProfile(prof);
    const loadedResumes = await api.getResumes();
    setResumes(loadedResumes);
    const loadedCLs = await api.getCoverLetters();
    setCoverLetters(loadedCLs);
  };

  // --- RESUME LOGIC ---

  const createNewResume = () => {
    setCurrentResume({
      title: 'New Resume',
      role: '',
      name: profile.name || '',
      email: '',
      phone: '',
      summary: '',
      experience: [],
      education: [],
      skills: profile.skills || [],
      selectedPoints: []
    });
    setSuggestions(null);
  };

  const saveCurrentResume = async () => {
    if (!currentResume) return;
    await api.saveResume(currentResume);
    const updated = await api.getResumes();
    setResumes(updated);
    alert("Resume saved!");
  };

  const deleteResume = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this resume?")) {
      await api.deleteResume(id);
      setResumes(resumes.filter(r => r.id !== id));
      if (currentResume && currentResume.id === id) setCurrentResume(null);
    }
  };

  const generateSuggestions = async () => {
    if (!currentResume || !currentResume.role) {
      alert("Please enter a target role first.");
      return;
    }
    setIsGenerating(true);
    const data = await api.generateSuggestions(currentResume.role, profile.skills);
    setSuggestions(data);
    setIsGenerating(false);
  };

  const togglePoint = (point) => {
    const points = currentResume.selectedPoints || [];
    if (points.includes(point)) {
      setCurrentResume({ ...currentResume, selectedPoints: points.filter(p => p !== point) });
    } else {
      setCurrentResume({ ...currentResume, selectedPoints: [...points, point] });
    }
  };

  const downloadResumePDF = () => {
    alert('In a real environment, this would download a PDF. Opening print dialog instead.');
    window.print();
  };

  // --- COVER LETTER LOGIC ---

  const createNewCoverLetter = () => {
    setCurrentCoverLetter({
      title: 'New Cover Letter',
      role: '',
      company: '',
      content: ''
    });
  };

  const saveCurrentCoverLetter = async () => {
    if (!currentCoverLetter) return;
    await api.saveCoverLetter(currentCoverLetter);
    const updated = await api.getCoverLetters();
    setCoverLetters(updated);
    alert("Cover Letter saved!");
  };

  const deleteCoverLetter = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this cover letter?")) {
      await api.deleteCoverLetter(id);
      setCoverLetters(coverLetters.filter(c => c.id !== id));
      if (currentCoverLetter && currentCoverLetter.id === id) setCurrentCoverLetter(null);
    }
  };

  const generateCoverLetterText = async () => {
    if (!currentCoverLetter || !currentCoverLetter.role) {
      alert("Please enter a target role first.");
      return;
    }
    setIsGenerating(true);
    const data = await api.generateCoverLetter(currentCoverLetter.role, profile.name, currentCoverLetter.company);
    setCurrentCoverLetter({ ...currentCoverLetter, content: data.text });
    setIsGenerating(false);
  };

  const downloadCoverLetterPDF = () => {
    alert('In a real environment, this would download a PDF. Opening print dialog instead.');
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1, paddingRight: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Career Builder</h1>
          <p className="text-muted" style={{ marginBottom: '0.5rem' }}>
            Welcome to your comprehensive career document hub. Here you can easily design and manage your application materials. Features include:
          </p>
          <ul className="text-muted text-sm" style={{ paddingLeft: '1.2rem', marginBottom: '0' }}>
            <li><strong>AI Resume Optimization:</strong> Get tailored bullet points and keyword suggestions based on your target role.</li>
            <li><strong>Skill Gap Analysis:</strong> Automatically compare suggested skills against your profile to see what you're missing.</li>
            <li><strong>Cover Letter Generator:</strong> Instantly draft a personalized cover letter using your profile and target company.</li>
            <li><strong>Multiple Document Versions:</strong> Create, save, and manage different versions of your resumes and cover letters.</li>
            <li><strong>PDF Export:</strong> Download your finished documents as beautifully formatted PDF files ready for application.</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button className={`btn ${activeTab === 'resumes' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('resumes')}>Resumes</button>
          <button className={`btn ${activeTab === 'coverLetters' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('coverLetters')}>Cover Letters</button>
        </div>
      </div>

      {activeTab === 'resumes' && (
        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          {/* Sidebar */}
          <div className="card" style={{ width: '250px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
            <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={createNewResume}>+ New Resume</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
              {resumes.map(r => (
                <div key={r.id} onClick={() => setCurrentResume(r)} style={{ padding: '0.75rem', borderRadius: '4px', cursor: 'pointer', backgroundColor: currentResume?.id === r.id ? 'var(--primary-light, #e0f2fe)' : 'var(--bg-color)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: currentResume?.id === r.id ? 'bold' : 'normal' }}>{r.title}</span>
                  <span onClick={(e) => deleteResume(r.id, e)} style={{ color: 'var(--danger)' }}>✕</span>
                </div>
              ))}
              {resumes.length === 0 && <p className="text-muted text-sm text-center">No resumes saved yet.</p>}
            </div>
          </div>

          {/* Main Area */}
          {currentResume ? (
            <div style={{ flex: 1, display: 'flex', gap: '1rem', overflow: 'hidden' }}>
              {/* Editor */}
              <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3>Edit Resume</h3>
                  <button className="btn btn-primary" onClick={saveCurrentResume}>Save</button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="text-sm">Resume Title</label>
                  <input type="text" className="input" value={currentResume.title} onChange={e => setCurrentResume({...currentResume, title: e.target.value})} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="text-sm">Target Role</label>
                    <input type="text" className="input" placeholder="e.g. Frontend Engineer" value={currentResume.role} onChange={e => setCurrentResume({...currentResume, role: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={generateSuggestions} disabled={isGenerating}>
                      {isGenerating ? 'Analyzing...' : 'AI Optimize'}
                    </button>
                  </div>
                </div>

                {suggestions && (
                  <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0 }}>Optimization Suggestions</h4>
                      <span className="badge" style={{ backgroundColor: '#10b981', color: 'white' }}>ATS Score: {suggestions.atsScore}%</span>
                    </div>
                    
                    <p className="text-sm" style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Skill Gap Analysis:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {suggestions.techSkills.map(skill => {
                        const hasSkill = profile.skills.some(ps => ps.toLowerCase() === skill.toLowerCase());
                        return (
                          <span key={skill} className="badge" style={{ 
                            backgroundColor: hasSkill ? '#dcfce7' : '#fee2e2', 
                            color: hasSkill ? '#166534' : '#991b1b',
                            border: `1px solid ${hasSkill ? '#bbf7d0' : '#fecaca'}`
                          }}>
                            {hasSkill ? '✓' : '✗'} {skill}
                          </span>
                        );
                      })}
                    </div>

                    <p className="text-sm" style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Suggested Bullet Points (Select to add):</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {suggestions.keyPoints.map((point, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <input type="checkbox" checked={(currentResume.selectedPoints || []).includes(point)} onChange={() => togglePoint(point)} style={{ marginTop: '0.25rem' }} />
                          <p className="text-sm">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}><label className="text-sm">Name</label><input type="text" className="input" value={currentResume.name} onChange={e => setCurrentResume({...currentResume, name: e.target.value})} /></div>
                    <div style={{ flex: 1 }}><label className="text-sm">Email</label><input type="text" className="input" value={currentResume.email} onChange={e => setCurrentResume({...currentResume, email: e.target.value})} /></div>
                  </div>
                  <div><label className="text-sm">Professional Summary</label><textarea className="input" rows="3" value={currentResume.summary} onChange={e => setCurrentResume({...currentResume, summary: e.target.value})}></textarea></div>
                </div>

              </div>

              {/* Preview */}
              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#e2e8f0', padding: '1rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button className="btn btn-primary" onClick={downloadResumePDF}>Download PDF</button>
                </div>
                
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {/* The actual A4 paper size preview */}
                  <div ref={previewRef} style={{ width: '8.5in', minHeight: '11in', backgroundColor: 'white', padding: '0.8in', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif', margin: '0 auto', transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                    <h1 style={{ textAlign: 'center', margin: '0 0 0.1in 0', fontSize: '24pt', color: '#111827' }}>{currentResume.name || 'Your Name'}</h1>
                    <p style={{ textAlign: 'center', margin: '0 0 0.2in 0', fontSize: '10pt', color: '#4b5563' }}>
                      {currentResume.email || 'email@example.com'} • {currentResume.role || 'Target Role'}
                    </p>

                    {currentResume.summary && (
                      <div style={{ marginBottom: '0.2in' }}>
                        <p style={{ fontSize: '10pt', lineHeight: '1.5' }}>{currentResume.summary}</p>
                      </div>
                    )}

                    <div style={{ marginBottom: '0.2in' }}>
                      <h2 style={{ fontSize: '12pt', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db', paddingBottom: '4px', marginBottom: '8px' }}>Experience & Highlights</h2>
                      {(currentResume.selectedPoints || []).length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '0.2in', fontSize: '10pt', lineHeight: '1.5' }}>
                          {(currentResume.selectedPoints || []).map((p, i) => <li key={i} style={{ marginBottom: '4px' }}>{p}</li>)}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '10pt', color: '#9ca3af', fontStyle: 'italic' }}>Select suggested bullet points or add experience to see them here.</p>
                      )}
                    </div>

                    <div style={{ marginBottom: '0.2in' }}>
                      <h2 style={{ fontSize: '12pt', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db', paddingBottom: '4px', marginBottom: '8px' }}>Skills</h2>
                      <p style={{ fontSize: '10pt', lineHeight: '1.5' }}>
                        {(currentResume.skills || []).join(', ') || 'Your skills will appear here.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="text-muted">Select a resume from the sidebar or create a new one.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'coverLetters' && (
        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          {/* Sidebar */}
          <div className="card" style={{ width: '250px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
            <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={createNewCoverLetter}>+ New Cover Letter</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
              {coverLetters.map(c => (
                <div key={c.id} onClick={() => setCurrentCoverLetter(c)} style={{ padding: '0.75rem', borderRadius: '4px', cursor: 'pointer', backgroundColor: currentCoverLetter?.id === c.id ? 'var(--primary-light, #e0f2fe)' : 'var(--bg-color)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: currentCoverLetter?.id === c.id ? 'bold' : 'normal' }}>{c.title}</span>
                  <span onClick={(e) => deleteCoverLetter(c.id, e)} style={{ color: 'var(--danger)' }}>✕</span>
                </div>
              ))}
              {coverLetters.length === 0 && <p className="text-muted text-sm text-center">No cover letters saved yet.</p>}
            </div>
          </div>

          {/* Main Area */}
          {currentCoverLetter ? (
            <div style={{ flex: 1, display: 'flex', gap: '1rem', overflow: 'hidden' }}>
              {/* Editor */}
              <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3>Edit Cover Letter</h3>
                  <button className="btn btn-primary" onClick={saveCurrentCoverLetter}>Save</button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="text-sm">Title</label>
                  <input type="text" className="input" value={currentCoverLetter.title} onChange={e => setCurrentCoverLetter({...currentCoverLetter, title: e.target.value})} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="text-sm">Target Role</label>
                    <input type="text" className="input" placeholder="e.g. Frontend Engineer" value={currentCoverLetter.role} onChange={e => setCurrentCoverLetter({...currentCoverLetter, role: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-sm">Company Name</label>
                    <input type="text" className="input" placeholder="e.g. Google" value={currentCoverLetter.company} onChange={e => setCurrentCoverLetter({...currentCoverLetter, company: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={generateCoverLetterText} disabled={isGenerating}>
                      {isGenerating ? 'Generating...' : 'AI Generate'}
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label className="text-sm">Content</label>
                  <textarea className="input" style={{ flex: 1, minHeight: '300px', resize: 'vertical' }} value={currentCoverLetter.content} onChange={e => setCurrentCoverLetter({...currentCoverLetter, content: e.target.value})}></textarea>
                </div>
              </div>

              {/* Preview */}
              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#e2e8f0', padding: '1rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button className="btn btn-primary" onClick={downloadCoverLetterPDF}>Download PDF</button>
                </div>
                
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {/* The actual A4 paper size preview */}
                  <div ref={clPreviewRef} style={{ width: '8.5in', minHeight: '11in', backgroundColor: 'white', padding: '1in', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: '1.6', margin: '0 auto', transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {currentCoverLetter.content || 'Your cover letter text will appear here.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="text-muted">Select a cover letter from the sidebar or create a new one.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResumeBuilder;
