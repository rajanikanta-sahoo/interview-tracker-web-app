import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen, Search, AlertCircle, Trash2, ChevronDown, ChevronUp,
  ExternalLink, RefreshCw, ShieldAlert, Sparkles, Clock, Play,
  X, Award, FileText
} from 'lucide-react';
import { api, SERVER_BASE_URL } from '../services/api';

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn("Audio chime could not play:", e);
  }
}

// ── In-App Confirmation Modal ────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmText, confirmVariant = 'danger', onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={onCancel}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '1.75rem', borderRadius: '18px', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            backgroundColor: confirmVariant === 'danger' ? '#fee2e2' : '#e0e7ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: confirmVariant === 'danger' ? '#ef4444' : 'var(--primary)'
          }}>
            {confirmVariant === 'danger' ? <ShieldAlert size={20} /> : <AlertCircle size={20} />}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {title}
          </h3>
        </div>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          <button type="button" className="btn btn-outline" onClick={onCancel} style={{ fontSize: '12.5px', padding: '0.45rem 1rem', borderRadius: '10px' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            style={{
              fontSize: '12.5px',
              padding: '0.45rem 1.15rem',
              borderRadius: '10px',
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

// ── Interactive Mock Interview Simulator Modal ──────────────────────────────
function MockInterviewModal({ isOpen, onClose, allQuestions, onSaveSuccess }) {
  const [step, setStep] = useState('config'); // 'config' | 'running' | 'summary'
  const [count, setCount] = useState(3);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [answers, setAnswers] = useState({});
  const [activeSpeechField, setActiveSpeechField] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    let timerId;
    if (step === 'running' && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            playChime();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [step, timeLeft]);

  // Clean speech recognition on close/unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  if (!isOpen) return null;

  const startSession = () => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(count, allQuestions.length));
    setSelectedQuestions(picked);
    setCurrentIndex(0);
    setTimeLeft(120);
    const initialAns = {};
    picked.forEach(q => {
      initialAns[q.id] = {
        situation: q.starAnswer?.situation || '',
        task: q.starAnswer?.task || '',
        action: q.starAnswer?.action || '',
        result: q.starAnswer?.result || ''
      };
    });
    setAnswers(initialAns);
    setStep('running');
    playChime();
  };

  const currentQ = selectedQuestions[currentIndex];
  const currentAnswers = currentQ ? (answers[currentQ.id] || { situation: '', task: '', action: '', result: '' }) : {};

  const handleAnswerChange = (field, val) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {}),
        [field]: val
      }
    }));
  };

  const toggleSpeech = (field) => {
    if (activeSpeechField === field) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setActiveSpeechField(null);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is supported in modern browsers like Chrome, Edge, and Safari.');
      return;
    }

    if (recognitionRef.current) recognitionRef.current.stop();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let baseText = currentAnswers[field] || '';
      if (baseText && !baseText.endsWith(' ')) baseText += ' ';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        handleAnswerChange(field, (baseText + transcript).trimStart());
      };

      recognition.onerror = () => setActiveSpeechField(null);
      recognition.onend = () => setActiveSpeechField(null);

      recognition.start();
      recognitionRef.current = recognition;
      setActiveSpeechField(field);
    } catch {
      setActiveSpeechField(null);
    }
  };

  const nextQuestion = async () => {
    if (activeSpeechField && recognitionRef.current) recognitionRef.current.stop();
    // Save draft for current question
    if (currentQ) {
      await api.savePracticeAnswer(currentQ.id, currentAnswers, 'Practicing').catch(() => {});
    }
    if (currentIndex < selectedQuestions.length - 1) {
      setCurrentIndex(i => i + 1);
      setTimeLeft(120);
      playChime();
    } else {
      setStep('summary');
      playChime();
      if (onSaveSuccess) onSaveSuccess();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '24px', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Mock Interview Simulator</h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time timed STAR response practice</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-alt)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {step === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>
              Test your readiness under interview conditions. You will be given randomized questions with a 2-minute answer timer and voice dictation support.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              {[3, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '16px',
                    border: count === n ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: count === n ? 'rgba(79, 70, 229, 0.08)' : 'var(--surface)',
                    color: count === n ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {n} Questions {n === 3 ? '(Quick Drill)' : '(Full Round)'}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={startSession} style={{ padding: '0.65rem 2rem', fontSize: '0.95rem', borderRadius: '12px', gap: '0.5rem' }}>
                <Play size={16} /> Begin Simulation
              </button>
            </div>
          </div>
        )}

        {step === 'running' && currentQ && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Progress & Countdown Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface-alt)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Question {currentIndex + 1} of {selectedQuestions.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: '800', color: timeLeft <= 30 ? '#ef4444' : 'var(--primary)' }}>
                <Clock size={18} />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* Question Text */}
            <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(79, 70, 229, 0.04)', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'var(--primary)', color: 'white' }}>
                  {currentQ.role || 'General'}
                </span>
                {currentQ.group && (
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    {currentQ.group}
                  </span>
                )}
              </div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.4 }}>
                {currentQ.text || currentQ.originalName || 'Interview Question'}
              </h4>
            </div>

            {/* STAR Response Inputs with Dictation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {[
                { key: 'situation', label: 'S - Situation', hint: 'Context and problem background...' },
                { key: 'task', label: 'T - Task', hint: 'Your core goal or constraint...' },
                { key: 'action', label: 'A - Action', hint: 'What you personally designed and built...' },
                { key: 'result', label: 'R - Result', hint: 'Measurable metric outcomes achieved...' },
              ].map(sec => (
                <div key={sec.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--primary)' }}>{sec.label}</label>
                    <button
                      type="button"
                      onClick={() => toggleSpeech(sec.key)}
                      style={{
                        background: activeSpeechField === sec.key ? '#ef4444' : 'transparent',
                        color: activeSpeechField === sec.key ? '#fff' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '0.1rem 0.4rem',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      {activeSpeechField === sec.key ? '🔴 Recording' : '🎙️ Dictate'}
                    </button>
                  </div>
                  <textarea
                    className="input"
                    rows={3}
                    style={{ fontSize: '12px', resize: 'vertical' }}
                    placeholder={sec.hint}
                    value={currentAnswers[sec.key] || ''}
                    onChange={e => handleAnswerChange(sec.key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={nextQuestion} style={{ borderRadius: '10px', gap: '0.35rem' }}>
                {currentIndex < selectedQuestions.length - 1 ? 'Next Question →' : 'Complete Interview ✓'}
              </button>
            </div>
          </div>
        )}

        {step === 'summary' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Award size={32} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Mock Session Complete!
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '480px', alignSelf: 'center', lineHeight: 1.5 }}>
              You answered {selectedQuestions.length} interview questions under simulated timing conditions. Your responses have been saved to your practice drafts bank.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={onClose} style={{ borderRadius: '10px' }}>
                Done & Return to Hub
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Printable STAR Cheat Sheet Modal ─────────────────────────────────────────
function CheatSheetModal({ isOpen, onClose, questions }) {
  if (!isOpen) return null;
  const answered = questions.filter(q => {
    const a = q.starAnswer;
    return a && (a.situation || a.task || a.action || a.result);
  });

  const printSheet = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '840px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '20px', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>Pre-Interview STAR Cheat Sheet</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Quick revision guide containing your structured STAR stories
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={printSheet} style={{ borderRadius: '10px', gap: '0.35rem', fontSize: '12px' }}>
              <FileText size={14} /> Print / Save PDF
            </button>
            <button onClick={onClose} style={{ background: 'var(--surface-alt)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {answered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem' }}>No STAR answers saved yet</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>Practice questions using the STAR framework to generate your customized pre-interview cheat sheet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {answered.map((q, idx) => (
              <div key={q.id || idx} style={{ padding: '1.15rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {idx + 1}. {q.text || q.originalName}
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
                    {q.role || 'General'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '12.5px', marginTop: '0.5rem' }}>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>Situation:</strong> {q.starAnswer?.situation || '—'}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>Task:</strong> {q.starAnswer?.task || '—'}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>Action:</strong> {q.starAnswer?.action || '—'}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>Result:</strong> {q.starAnswer?.result || '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
  const [searchUrlParams] = useSearchParams();
  const [searchParams, setSearchParams] = useState({ keyword: '', group: '', difficulty: '' });
  const [questions, setQuestions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [isMockOpen, setIsMockOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

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
        const roleQuery = searchUrlParams.get('role');
        const filterToUse = roleQuery ? { keyword: roleQuery } : {};
        if (roleQuery) {
          setSearchParams(prev => ({ ...prev, keyword: roleQuery }));
        }

        let data = await api.fetchQuestions(filterToUse);
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
  }, [searchUrlParams]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      <style>{`
        .prep-card-hover {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-xs);
          border-radius: 14px;
        }
        .prep-card-hover:hover {
          box-shadow: var(--shadow-md) !important;
          border-color: #cbd5e1;
        }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', marginBottom: '0.4rem' }}>
            <BookOpen size={12} /> Interview Readiness Hub
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
            Practice & AI Coaching
          </h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Master behavioral and technical questions using the STAR framework with real-time AI scoring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ fontSize: '12.5px', borderRadius: '10px', gap: '0.4rem' }} onClick={() => setIsMockOpen(true)}>
            <Play size={13} /> Mock Simulator
          </button>
          <button className="btn btn-outline" style={{ fontSize: '12.5px', borderRadius: '10px', gap: '0.4rem' }} onClick={() => setIsCheatSheetOpen(true)}>
            <FileText size={13} /> Cheat Sheet
          </button>
          {questions.length > 0 && (
            <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fecaca', fontSize: '12.5px', borderRadius: '10px', gap: '0.35rem' }} onClick={handleDeleteAll}>
              <Trash2 size={13} /> Reset All
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Card */}
      <div className="card" style={{ padding: '1.35rem', borderRadius: '16px', boxShadow: 'var(--shadow-xs)' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Search Topic / Keyword</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" className="input" style={{ paddingLeft: '32px' }} placeholder="e.g. System Design, React hooks, Conflict..." value={searchParams.keyword} onChange={(e) => setSearchParams({...searchParams, keyword: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Group / Category</label>
            <input type="text" className="input" placeholder="e.g. Core Java, Frontend, Behavioral..." value={searchParams.group} onChange={(e) => setSearchParams({...searchParams, group: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Difficulty</label>
            <select className="input" value={searchParams.difficulty} onChange={(e) => setSearchParams({...searchParams, difficulty: e.target.value})}>
              <option value="">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '38px', borderRadius: '10px', gap: '0.35rem', minWidth: '120px' }}>
            <Search size={14} /> Filter
          </button>
        </form>
      </div>

      {/* Questions by Category Accordions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {questions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '16px' }}>
            <BookOpen size={36} style={{ color: '#94a3b8', marginBottom: '0.75rem' }} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>No interview questions found</h3>
            <p className="text-muted" style={{ margin: '0.25rem 0 1rem', fontSize: '0.85rem' }}>Adjust your keyword search or add custom questions via the Contribute page.</p>
            <button className="btn btn-outline" onClick={() => loadQuestions({})} style={{ borderRadius: '10px', gap: '0.35rem' }}>
              <RefreshCw size={13} /> Reset Filter
            </button>
          </div>
        ) : (
          Object.entries(groupedQuestions).map(([groupName, groupQuestions]) => (
            <div key={groupName} className="card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xs)' }}>
              {/* Category Header */}
              <div 
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', padding: '1rem 1.35rem',
                  backgroundColor: 'var(--surface-alt)', borderBottom: collapsedGroups[groupName] ? 'none' : '1px solid var(--border-color)',
                  transition: 'background-color 0.15s'
                }}
                onClick={() => toggleGroup(groupName)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{groupName}</h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '0.15rem 0.55rem', borderRadius: '9999px', backgroundColor: '#e0e7ff', color: 'var(--primary)' }}>
                    {groupQuestions.length} question{groupQuestions.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {collapsedGroups[groupName] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </div>
              </div>
              
              {!collapsedGroups[groupName] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
                  {groupQuestions.map(q => (
                    <div key={q.id} className="prep-card-hover card" style={{ cursor: 'pointer', padding: '1.2rem', backgroundColor: 'var(--surface)' }} onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', textAlign: 'left', lineHeight: 1.3 }}>
                            {q.type === 'file' ? `📁 File: ${q.originalName}` : q.text}
                          </h4>
                          {q.practiceStatus && q.practiceStatus !== 'Not Started' && (
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              fontSize: '11px',
                              fontWeight: '700',
                              borderRadius: '9999px',
                              color: q.practiceStatus === 'Mastered' ? '#065f46' : '#92400e',
                              backgroundColor: q.practiceStatus === 'Mastered' ? '#dcfce7' : '#fef3c7',
                              border: `1px solid ${q.practiceStatus === 'Mastered' ? '#a7f3d0' : '#fde68a'}`,
                              flexShrink: 0
                            }}>
                              {q.practiceStatus}
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#94a3b8', paddingLeft: '0.75rem' }}>
                          {expandedId === q.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {expandedId === q.id && (
                        <div style={{ marginTop: '1.15rem', paddingTop: '1.15rem', borderTop: '1px solid var(--border-color)' }}>
                          {q.role && <p className="text-sm text-muted" style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Role: <strong style={{ color: 'var(--text-main)' }}>{q.role}</strong></p>}
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                            {q.group && <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Group: {q.group}</span>}
                            {q.difficulty && (
                              <span style={{
                                fontSize: '11px', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: '700',
                                backgroundColor: q.difficulty === 'Hard' ? '#fee2e2' : q.difficulty === 'Medium' ? '#fef3c7' : '#dcfce7',
                                color: q.difficulty === 'Hard' ? '#991b1b' : q.difficulty === 'Medium' ? '#92400e' : '#166534'
                              }}>
                                {q.difficulty}
                              </span>
                            )}
                          </div>
                          {q.keyAreas && <p className="text-sm text-muted" style={{ marginBottom: '0.75rem', textAlign: 'left' }}>Key Areas: {q.keyAreas}</p>}
                          
                          {q.type === 'file' && (
                            <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                              <a href={`${SERVER_BASE_URL}${q.path}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
                                <ExternalLink size={14} /> Open Document
                              </a>
                              {q.path.toLowerCase().endsWith('.pdf') ? (
                                <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
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
                            <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fecaca', padding: '0.3rem 0.85rem', fontSize: '12px', gap: '0.35rem' }} onClick={(e) => handleDelete(e, q.id)}>
                              <Trash2 size={13} /> Delete Question
                            </button>
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

      {/* Mock Interview Simulator Modal */}
      <MockInterviewModal
        isOpen={isMockOpen}
        onClose={() => setIsMockOpen(false)}
        allQuestions={questions}
        onSaveSuccess={() => loadQuestions(searchParams)}
      />

      {/* Printable Cheat Sheet Modal */}
      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        questions={questions}
      />
    </div>
  );
}

export default Preparation;
