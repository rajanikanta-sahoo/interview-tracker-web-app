import { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, X } from 'lucide-react';
import ExperienceLevelBadge from './ExperienceLevelBadge';
import { resolveLevelFromYears } from '../utils/experience';

export default function OnboardingModal({ isOpen, onClose, onComplete, initialProfile }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialProfile?.name || '');
  const [role, setRole] = useState(initialProfile?.role || 'Full Stack Engineer');
  const [years, setYears] = useState(initialProfile?.experience || '3');
  const [primaryGoal, setPrimaryGoal] = useState('job_switch');
  const [targetCompany, setTargetCompany] = useState('');
  const [autoGenerateChecklist, setAutoGenerateChecklist] = useState(true);

  if (!isOpen) return null;

  const resolvedLevel = resolveLevelFromYears(years);

  const handleFinish = () => {
    onComplete({
      name,
      role,
      experience: years,
      levelId: resolvedLevel.id,
      primaryGoal,
      targetCompany,
      autoGenerateChecklist
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        animation: 'fadeUp 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Personalize Your Prep Roadmap</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Step {step} of 2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                  What's your name?
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Rajanikanta Sahoo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                  Target Role / Title
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Senior Java Developer, Full Stack Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Years of Experience</label>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: resolvedLevel.color }}>
                    {years} {Number(years) === 1 ? 'Year' : 'Years'} → {resolvedLevel.label}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  style={{ width: '100%', accentColor: resolvedLevel.color, cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Fresher (0)</span>
                  <span>Junior (1-3)</span>
                  <span>Mid (3-6)</span>
                  <span>Senior (6-10)</span>
                  <span>Lead (10+)</span>
                </div>
              </div>

              <div style={{ marginTop: '4px' }}>
                <ExperienceLevelBadge levelId={resolvedLevel.id} showExpectations={true} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                  What is your primary interview preparation goal?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'job_switch', label: 'Mid-Career Switch', desc: 'Targeting tier-1 tech or higher pay' },
                    { id: 'first_job', label: 'First Software Job', desc: 'Campus placements or bootcamps' },
                    { id: 'promotion', label: 'Senior Promotion', desc: 'Advancing to Staff/Lead rank' },
                    { id: 'refresh', label: 'Skills Sharpening', desc: 'System design & DSA practice' }
                  ].map(g => (
                    <div
                      key={g.id}
                      onClick={() => setPrimaryGoal(g.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: primaryGoal === g.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: primaryGoal === g.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-main)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '2px' }}>{g.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                  Target Company (Optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Google, Amazon, Stripe, Startup"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <input
                  type="checkbox"
                  id="autoChecklist"
                  checked={autoGenerateChecklist}
                  onChange={(e) => setAutoGenerateChecklist(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="autoChecklist" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  <div style={{ fontWeight: '600' }}>Automatically generate tailored Interview Prep Checklist</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Pre-loads ~25 critical preparation tasks customized for a {resolvedLevel.label} ({years} yrs)
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-main)'
        }}>
          {step === 2 ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setStep(1)}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Back
            </button>
          ) : <div />}

          {step === 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep(2)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Next: Set Goals <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinish}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Launch Personalized Prep <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
