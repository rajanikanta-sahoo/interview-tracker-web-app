import React, { useState } from 'react';

function ResumeBuilder() {
  const [role, setRole] = useState('');
  const [suggestions, setSuggestions] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!role) return;

    // Mock suggestions based on role
    setSuggestions({
      techSkills: ['Cloud Computing', 'AWS', 'Python', 'React', 'Microservices', 'Docker'],
      softSkills: ['Leadership', 'Problem Solving', 'Communication', 'Agile'],
      keyPoints: [
        `Led development of a scalable architecture using modern tools to improve performance.`,
        `Improved system efficiency by 30% through optimization.`,
        `Mentored junior developers and conducted code reviews.`,
        `Collaborated with product managers to define technical requirements.`
      ]
    });
  };

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Resume Builder</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Optimize your resume with targeted keywords and key points</p>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input type="text" className="input" style={{ flex: 1 }} placeholder="Target Job Role (e.g., Senior Software Engineer)" value={role} onChange={(e) => setRole(e.target.value)} />
          <button type="submit" className="btn btn-primary">Get Suggestions</button>
        </form>
      </div>

      {suggestions && (
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>Optimization Suggestions for '{role}'</h2>
          
          <div className="grid-cols-2">
            <div>
              <h3>Suggested Keywords</h3>
              
              <h4 className="text-sm text-muted" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Technical Skills</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {suggestions.techSkills.map(skill => <span key={skill} className="badge badge-neutral" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>{skill}</span>)}
              </div>

              <h4 className="text-sm text-muted" style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Soft Skills</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {suggestions.softSkills.map(skill => <span key={skill} className="badge badge-neutral" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>{skill}</span>)}
              </div>
            </div>

            <div>
              <h3>Suggested Key Points to Include</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {suggestions.keyPoints.map((point, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input type="checkbox" style={{ marginTop: '0.25rem' }} />
                    <p className="text-sm">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeBuilder;
