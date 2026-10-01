import { useState, useEffect, useRef } from 'react';
import { api, SERVER_BASE_URL } from '../services/api';

// ── In-App Confirmation Modal ────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmText, confirmVariant = 'danger', onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={onCancel}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: confirmVariant === 'danger' ? '#ef4444' : 'var(--text-color)' }}>
          {confirmVariant === 'danger' ? '⚠️ ' : ''}{title}
        </h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          <button type="button" className="btn btn-outline" onClick={onCancel} style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            style={{
              fontSize: '0.82rem',
              padding: '0.4rem 0.9rem',
              background: confirmVariant === 'danger' ? '#ef4444' : 'var(--primary)',
              borderColor: confirmVariant === 'danger' ? '#ef4444' : 'var(--primary)',
            }}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionPracticeHub({ q, onSaveSuccess }) {
  const [answers, setAnswers] = useState({
    situation: q.starAnswer?.situation || '',
    task: q.starAnswer?.task || '',
    action: q.starAnswer?.action || '',
    result: q.starAnswer?.result || ''
  });
  const [status, setStatus] = useState(q.practiceStatus || 'Not Started');
  const [prevQId, setPrevQId] = useState(q.id);

  if (prevQId !== q.id) {
    setPrevQId(q.id);
    setAnswers({
      situation: q.starAnswer?.situation || '',
      task: q.starAnswer?.task || '',
      action: q.starAnswer?.action || '',
      result: q.starAnswer?.result || ''
    });
    setStatus(q.practiceStatus || 'Not Started');
  }

  // Timer State
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Coach State
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Speech Recognition State
  const [activeSpeechField, setActiveSpeechField] = useState(null);
  const recognitionRef = useRef(null);

  // Stop recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleSpeech = (e, field) => {
    e.stopPropagation();
    if (activeSpeechField === field) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setActiveSpeechField(null);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is supported in modern browsers like Chrome, Edge, and Safari.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let baseText = answers[field] || '';
      if (baseText && !baseText.endsWith(' ')) baseText += ' ';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setAnswers(prev => ({
          ...prev,
          [field]: (baseText + transcript).trimStart()
        }));
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setActiveSpeechField(null);
      };

      recognition.onend = () => {
        setActiveSpeechField(null);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setActiveSpeechField(field);
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setActiveSpeechField(null);
    }
  };

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const handleStartStop = (e) => {
    e.stopPropagation();
    setTimerActive(!timerActive);
  };

  const handleResetTimer = (e) => {
    e.stopPropagation();
    setTimerActive(false);
    setTime(0);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Timer Color Shifting
  const getTimerStyles = () => {
    if (time === 0) return { color: 'var(--text-muted)', label: 'Ready to Practice', colorToken: 'var(--text-muted)' };
    if (time < 60) return { color: '#3b82f6', label: 'Warm up... Aim for 60s!', colorToken: '#3b82f6' };
    if (time <= 120) return { color: '#10b981', label: 'Perfect answer length! (60-120s)', colorToken: '#10b981' };
    return { color: '#ef4444', label: 'Running long! Try to wrap up.', colorToken: '#ef4444' };
  };

  const timerDetails = getTimerStyles();

  const handleSave = async (e) => {
    if (e) e.stopPropagation();
    setSaving(true);
    try {
      await api.savePracticeAnswer(q.id, answers, status);
      setSaveMessage('✓ Draft Saved Successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error(err);
      setSaveMessage('Failed to save draft.');
    }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      await api.savePracticeAnswer(q.id, answers, newStatus);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerCoach = async (e) => {
    e.stopPropagation();
    setCoachingLoading(true);
    try {
      const feedback = await api.getAICoachFeedback(q.id, answers);
      setCoachFeedback(feedback);
    } catch (err) {
      console.error(err);
    }
    setCoachingLoading(false);
  };

  return (
    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
      {/* Timer and Status Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        
        {/* Practice Status Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label className="text-sm" style={{ fontWeight: '600' }}>Practice Status:</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['Not Started', 'Practicing', 'Mastered'].map(s => {
              const isActive = status === s;
              const activeStyle = s === 'Mastered' 
                ? { backgroundColor: '#10b981', color: '#fff', borderColor: '#10b981' }
                : s === 'Practicing'
                ? { backgroundColor: '#f59e0b', color: '#fff', borderColor: '#f59e0b' }
                : { backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' };
              
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    ...(isActive ? activeStyle : {})
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stopwatch Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Interview Clock</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'monospace', color: timerDetails.colorToken }}>
              {timerActive && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', marginRight: '0.25rem' }} className="timer-pulse" />}
              {formatTime(time)}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: timerDetails.colorToken }}>{timerDetails.label}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
              onClick={handleStartStop}
            >
              {timerActive ? 'Stop' : 'Start'}
            </button>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
              onClick={handleResetTimer}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* STAR Playground */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STAR Answer Playground</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Situation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="text-sm" style={{ fontWeight: '600', color: 'var(--primary)' }}>S - Situation</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={(e) => toggleSpeech(e, 'situation')}
                  title={activeSpeechField === 'situation' ? 'Stop Listening' : 'Voice Dictate'}
                  style={{
                    background: activeSpeechField === 'situation' ? '#ef4444' : 'transparent',
                    color: activeSpeechField === 'situation' ? '#fff' : 'var(--text-muted)',
                    border: activeSpeechField === 'situation' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.12rem 0.45rem',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {activeSpeechField === 'situation' ? '🔴 Recording...' : '🎙️ Dictate'}
                </button>
                <span className="text-muted text-sm">{answers.situation.length} chars</span>
              </div>
            </div>
            <textarea
              className="input"
              rows={4}
              style={{ padding: '0.5rem', fontSize: '0.85rem', lineHeight: '1.4', resize: 'vertical' }}
              placeholder="Describe the context: e.g., 'During my project at Google, our frontend page load times grew by 40% due to legacy packages...'"
              value={answers.situation}
              onChange={(e) => setAnswers({ ...answers, situation: e.target.value })}
            />
          </div>

          {/* Task */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="text-sm" style={{ fontWeight: '600', color: 'var(--primary)' }}>T - Task</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={(e) => toggleSpeech(e, 'task')}
                  title={activeSpeechField === 'task' ? 'Stop Listening' : 'Voice Dictate'}
                  style={{
                    background: activeSpeechField === 'task' ? '#ef4444' : 'transparent',
                    color: activeSpeechField === 'task' ? '#fff' : 'var(--text-muted)',
                    border: activeSpeechField === 'task' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.12rem 0.45rem',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {activeSpeechField === 'task' ? '🔴 Recording...' : '🎙️ Dictate'}
                </button>
                <span className="text-muted text-sm">{answers.task.length} chars</span>
              </div>
            </div>
            <textarea
              className="input"
              rows={4}
              style={{ padding: '0.5rem', fontSize: '0.85rem', lineHeight: '1.4', resize: 'vertical' }}
              placeholder="Outline your goal: e.g., 'I was tasked with reducing bundle sizes and auditing our package weight within a 2-week deadline...'"
              value={answers.task}
              onChange={(e) => setAnswers({ ...answers, task: e.target.value })}
            />
          </div>

          {/* Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="text-sm" style={{ fontWeight: '600', color: 'var(--primary)' }}>A - Action</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={(e) => toggleSpeech(e, 'action')}
                  title={activeSpeechField === 'action' ? 'Stop Listening' : 'Voice Dictate'}
                  style={{
                    background: activeSpeechField === 'action' ? '#ef4444' : 'transparent',
                    color: activeSpeechField === 'action' ? '#fff' : 'var(--text-muted)',
                    border: activeSpeechField === 'action' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.12rem 0.45rem',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {activeSpeechField === 'action' ? '🔴 Recording...' : '🎙️ Dictate'}
                </button>
                <span className="text-muted text-sm">{answers.action.length} chars</span>
              </div>
            </div>
            <textarea
              className="input"
              rows={4}
              style={{ padding: '0.5rem', fontSize: '0.85rem', lineHeight: '1.4', resize: 'vertical' }}
              placeholder="Detail your actions: e.g., 'I built a custom webpack bundle analyzer, moved large imports to lazy loaded states, and recompiled codebases...'"
              value={answers.action}
              onChange={(e) => setAnswers({ ...answers, action: e.target.value })}
            />
          </div>

          {/* Result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="text-sm" style={{ fontWeight: '600', color: 'var(--primary)' }}>R - Result</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={(e) => toggleSpeech(e, 'result')}
                  title={activeSpeechField === 'result' ? 'Stop Listening' : 'Voice Dictate'}
                  style={{
                    background: activeSpeechField === 'result' ? '#ef4444' : 'transparent',
                    color: activeSpeechField === 'result' ? '#fff' : 'var(--text-muted)',
                    border: activeSpeechField === 'result' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.12rem 0.45rem',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {activeSpeechField === 'result' ? '🔴 Recording...' : '🎙️ Dictate'}
                </button>
                <span className="text-muted text-sm">{answers.result.length} chars</span>
              </div>
            </div>
            <textarea
              className="input"
              rows={4}
              style={{ padding: '0.5rem', fontSize: '0.85rem', lineHeight: '1.4', resize: 'vertical' }}
              placeholder="Prove outcomes (add numbers!): e.g., 'We successfully reduced overall page load speed by 35% and shrank the bundle by 4.2MB.'"
              value={answers.result}
              onChange={(e) => setAnswers({ ...answers, result: e.target.value })}
            />
          </div>
        </div>

        {/* Playground Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>{saveMessage}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ minWidth: '130px', fontSize: '0.8rem', padding: '0.35rem 0.75rem', height: '32px' }}
              onClick={triggerCoach}
              disabled={coachingLoading}
            >
              {coachingLoading ? 'Analyzing...' : '🤖 Score My Answer'}
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ minWidth: '100px', fontSize: '0.8rem', padding: '0.35rem 0.75rem', height: '32px' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>
      </div>

      {/* AI STAR Coach Feedback Dashboard */}
      {coachFeedback && (
        <div className="card" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1.5px solid var(--primary)',
          borderRadius: '12px',
          padding: '1.25rem',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Header Score Info */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '3px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--primary)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }}>
                {coachFeedback.score}
              </div>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>AI Coach Evaluation</h4>
                <p className="text-muted text-sm" style={{ margin: 0, fontSize: '0.75rem' }}>Reviewing STAR structural completeness</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Metric Bar structures */}
              {[
                { label: 'Structure', val: coachFeedback.structureScore, color: '#3b82f6' },
                { label: 'Clarity', val: coachFeedback.clarityScore, color: '#f59e0b' },
                { label: 'Impact', val: coachFeedback.impactScore, color: '#10b981' }
              ].map(bar => (
                <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>{bar.label}</span>
                  <div style={{ width: '40px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${bar.val}%`, height: '100%', backgroundColor: bar.color }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{bar.val}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coach's Summary */}
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0, fontStyle: 'italic', color: 'var(--text-color)' }}>
              "{coachFeedback.summary}"
            </p>
          </div>

          {/* Strengths and Action Items */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.25rem' }}>
            {/* Strengths */}
            <div style={{ textAlign: 'left' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ✓ What You Did Well
              </h5>
              {coachFeedback.strengths.length === 0 ? (
                <p className="text-muted text-sm" style={{ margin: 0, fontSize: '0.8rem' }}>Write a detailed answer in the blocks above to see strengths.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {coachFeedback.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                </ul>
              )}
            </div>

            {/* Improvements */}
            <div style={{ textAlign: 'left' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ⚠ Dynamic Recommendations
              </h5>
              {coachFeedback.improvements.length === 0 ? (
                <p className="text-success text-sm" style={{ margin: 0, fontSize: '0.8rem' }}>Great job! No urgent recommendations found.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {coachFeedback.improvements.map((imp, idx) => <li key={idx}>{imp}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Preparation() {
  const [searchParams, setSearchParams] = useState({ keyword: '', group: '', difficulty: '' });
  const [questions, setQuestions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({...prev, [groupName]: !prev[groupName]}));
  };

  const loadQuestions = async (params = {}) => {
    let data = await api.fetchQuestions(params);
    
    // Merge client-side localStorage overrides
    data = data.map(q => {
      const stored = localStorage.getItem(`practice_question_${q.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            ...q,
            starAnswer: parsed.starAnswer || q.starAnswer,
            practiceStatus: parsed.practiceStatus || q.practiceStatus
          };
        } catch (e) {
          console.error("Error parsing stored question practice", e);
        }
      }
      return q;
    });

    setQuestions(data);
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        let data = await api.fetchQuestions({});
        data = data.map(q => {
          const stored = localStorage.getItem(`practice_question_${q.id}`);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              return {
                ...q,
                starAnswer: parsed.starAnswer || q.starAnswer,
                practiceStatus: parsed.practiceStatus || q.practiceStatus
              };
            } catch (e) {
              console.error("Error parsing stored question practice", e);
            }
          }
          return q;
        });
        if (!ignore) setQuestions(data);
      } catch (err) {
        console.error("Error loading questions", err);
      }
    }
    init();
    return () => { ignore = true; };
  }, []);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const handleSearch = (e) => {
    e.preventDefault();
    loadQuestions(searchParams);
  };

  const handleDeleteAll = () => {
    setModalConfig({
      isOpen: true,
      title: 'Delete All Questions',
      message: 'Are you sure you want to delete ALL questions? This action is permanent and cannot be undone.',
      confirmText: 'Delete All',
      onConfirm: async () => {
        closeModal();
        await api.deleteAllQuestions();
        loadQuestions(searchParams);
      }
    });
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? Any saved STAR practice draft will also be deleted.',
      confirmText: 'Delete',
      onConfirm: async () => {
        closeModal();
        await api.deleteQuestion(id);
        loadQuestions(searchParams);
      }
    });
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', textAlign: 'left' }}>{q.type === 'file' ? `📁 File: ${q.originalName}` : q.text}</h4>
                          {q.practiceStatus && q.practiceStatus !== 'Not Started' && (
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              borderRadius: '12px',
                              color: '#fff',
                              backgroundColor: q.practiceStatus === 'Mastered' ? '#10b981' : '#f59e0b'
                            }}>
                              {q.practiceStatus}
                            </span>
                          )}
                        </div>
                        <span>{expandedId === q.id ? '▲' : '▼'}</span>
                      </div>
                      {expandedId === q.id && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Role: {q.role}</p>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            {q.group && <span className="badge badge-neutral">Group: {q.group}</span>}
                            {q.difficulty && <span className={`badge ${q.difficulty === 'Hard' ? 'badge-danger' : q.difficulty === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{q.difficulty}</span>}
                          </div>
                          {q.keyAreas && <p className="text-sm text-muted" style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Key Areas: {q.keyAreas}</p>}
                          
                          {q.type === 'file' && (
                            <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                              <a href={`${SERVER_BASE_URL}${q.path}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-block', marginBottom: '1rem' }}>Download Document</a>
                              {q.path.toLowerCase().endsWith('.pdf') ? (
                                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                  <iframe src={`${SERVER_BASE_URL}${q.path}`} width="100%" height="400px" style={{ border: 'none' }} title="Document Preview"></iframe>
                                </div>
                              ) : (
                                <p className="text-muted text-sm">Preview not available for this file type. Please download to view.</p>
                              )}
                            </div>
                          )}

                          {/* STAR Method Practice Playground Hub */}
                          <QuestionPracticeHub key={q.id} q={q} onSaveSuccess={loadQuestions} />

                          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
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
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        confirmVariant="danger"
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}

export default Preparation;
