import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function Preparation() {
  const [searchParams, setSearchParams] = useState({ keyword: '', group: '', difficulty: '' });
  const [questions, setQuestions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({...prev, [groupName]: !prev[groupName]}));
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async (params = {}) => {
    const data = await api.fetchQuestions(params);
    setQuestions(data);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadQuestions(searchParams);
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete ALL questions?")) {
      await api.deleteAllQuestions();
      loadQuestions(searchParams);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this question?")) {
      await api.deleteQuestion(id);
      loadQuestions(searchParams);
    }
  };

  const groupedQuestions = questions.reduce((acc, q) => {
    const groupName = q.group || 'General';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(q);
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Prep Hub</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Find and practice interview questions for any role</p>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="text-sm">Search Keyword</label>
            <input type="text" className="input" placeholder="e.g., React hooks" value={searchParams.keyword} onChange={(e) => setSearchParams({...searchParams, keyword: e.target.value})} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-sm">Group</label>
            <input type="text" className="input" placeholder="e.g., Core Java" value={searchParams.group} onChange={(e) => setSearchParams({...searchParams, group: e.target.value})} />
          </div>
          <div>
            <label className="text-sm">Difficulty Level</label>
            <select className="input" value={searchParams.difficulty} onChange={(e) => setSearchParams({...searchParams, difficulty: e.target.value})}>
              <option value="">Any Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>Search Questions</button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Frequently Asked Interview Questions</h3>
        {questions.length > 0 && (
          <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDeleteAll}>Clear All Questions</button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
        {questions.length === 0 ? <p>No questions found.</p> : (
          Object.entries(groupedQuestions).map(([groupName, groupQuestions]) => (
            <div key={groupName}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}
                onClick={() => toggleGroup(groupName)}
              >
                <h4 style={{ margin: 0, color: 'var(--primary)' }}>{groupName}</h4>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{collapsedGroups[groupName] ? '▼' : '▲'}</span>
              </div>
              
              {!collapsedGroups[groupName] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {groupQuestions.map(q => (
                    <div key={q.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{q.type === 'file' ? `📁 File: ${q.originalName}` : q.text}</h4>
                        <span>{expandedId === q.id ? '▲' : '▼'}</span>
                      </div>
                      {expandedId === q.id && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Role: {q.role}</p>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            {q.group && <span className="badge badge-neutral">Group: {q.group}</span>}
                            {q.difficulty && <span className={`badge ${q.difficulty === 'Hard' ? 'badge-danger' : q.difficulty === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{q.difficulty}</span>}
                          </div>
                          {q.keyAreas && <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Key Areas: {q.keyAreas}</p>}
                          {q.type === 'file' ? (
                            <a href={`http://localhost:5001${q.path}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', marginTop: '0.5rem', display: 'inline-block' }}>Download Document</a>
                          ) : (
                            <p style={{ marginTop: '0.5rem' }}>Practice answering this question using the STAR method (Situation, Task, Action, Result).</p>
                          )}
                          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={(e) => handleDelete(e, q.id)}>Delete Question</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Preparation;
