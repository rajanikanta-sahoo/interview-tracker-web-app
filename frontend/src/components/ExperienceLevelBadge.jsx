import { useState } from 'react';
import { Award, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import {
  EXPERIENCE_LEVELS,
  resolveLevelFromYears,
  LEVEL_EXPECTATIONS_SUMMARY
} from '../utils/experience';

export default function ExperienceLevelBadge({
  levelId,
  years,
  interactive = false,
  onSelectLevel,
  showExpectations = false,
  size = 'md'
}) {
  const [expanded, setExpanded] = useState(false);

  const activeLevel = levelId
    ? (EXPERIENCE_LEVELS.find(l => l.id === levelId) || EXPERIENCE_LEVELS[2])
    : resolveLevelFromYears(years);

  const expData = LEVEL_EXPECTATIONS_SUMMARY[activeLevel.id];

  if (interactive) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {EXPERIENCE_LEVELS.map(lvl => {
            const isSelected = lvl.id === activeLevel.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => onSelectLevel && onSelectLevel(lvl.id)}
                title={`Select ${lvl.label} tier (${lvl.desc} experience) to calibrate interview expectations`}
                aria-label={`Select ${lvl.label} tier`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: isSelected ? `2px solid ${lvl.color}` : '1px solid var(--border)',
                  background: isSelected ? lvl.bg : 'var(--bg-card)',
                  color: isSelected ? lvl.color : 'var(--text-muted)',
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: lvl.color }} />
                <span>{lvl.label}</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.75 }}>({lvl.desc})</span>
              </button>
            );
          })}
        </div>

        {showExpectations && expData && (
          <div style={{
            background: activeLevel.bg,
            border: `1px solid ${activeLevel.border}`,
            borderRadius: '10px',
            padding: '12px 14px',
            marginTop: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeLevel.color, fontWeight: '700', fontSize: '0.85rem' }}>
                <Award size={16} />
                <span>Target Focus: {expData.focus}</span>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                title={expanded ? "Hide key interview expectations for this seniority tier" : "Show key interview expectations and focus areas for this seniority tier"}
                aria-label="Toggle expectations details"
                style={{ background: 'none', border: 'none', color: activeLevel.color, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '600' }}
              >
                {expanded ? 'Hide Key Expectations' : 'View Expectations'}
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {expanded && (
              <ul style={{ margin: '10px 0 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                {expData.expectations.map((exp, idx) => (
                  <li key={idx} style={{ lineHeight: '1.4' }}>{exp}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  const isSmall = size === 'sm';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: isSmall ? '2px 8px' : '4px 10px',
          borderRadius: '16px',
          background: activeLevel.bg,
          border: `1px solid ${activeLevel.border}`,
          color: activeLevel.color,
          fontSize: isSmall ? '0.75rem' : '0.83rem',
          fontWeight: '600',
          letterSpacing: '0.2px'
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeLevel.color }} />
        {activeLevel.label}
        <span style={{ opacity: 0.8, fontSize: '0.72rem', fontWeight: '500' }}>({activeLevel.desc})</span>
      </span>

      {showExpectations && expData && (
        <div style={{
          background: activeLevel.bg,
          border: `1px solid ${activeLevel.border}`,
          borderRadius: '8px',
          padding: '10px 12px',
          fontSize: '0.8rem',
          color: 'var(--text-main)',
          marginTop: '4px'
        }}>
          <div style={{ fontWeight: '700', color: activeLevel.color, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} />
            <span>Interview Bar for {activeLevel.label}:</span>
          </div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.78rem' }}>{expData.focus}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {expData.expectations.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem' }}>
                <CheckCircle2 size={13} style={{ color: activeLevel.color, flexShrink: 0, marginTop: '2px' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
