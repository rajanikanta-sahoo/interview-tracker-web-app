import { useEffect, useState } from 'react';

export default function GlobalTooltip() {
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0,
    placement: 'top'
  });

  useEffect(() => {
    let timeoutId = null;

    const handleMouseOver = (e) => {
      // Find closest element with data-tooltip or title
      const target = e.target.closest('[data-tooltip], [title]');
      if (!target) return;

      let text = target.getAttribute('data-tooltip');
      if (!text && target.hasAttribute('title')) {
        text = target.getAttribute('title');
        if (text && text.trim()) {
          target.setAttribute('data-tooltip', text);
          // Remove native title so browser does not display double tooltip
          target.removeAttribute('title');
        }
      }

      if (!text || !text.trim()) return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        // Center horizontally above element, clamp within window bounds
        const centerX = rect.left + rect.width / 2;
        const clampedX = Math.max(120, Math.min(window.innerWidth - 120, centerX));

        let tooltipY = rect.top - 8;
        let placement = 'top';

        // Flip to bottom if element is too close to top of viewport
        if (rect.top < 50) {
          tooltipY = rect.bottom + 8;
          placement = 'bottom';
        }

        setTooltip({
          visible: true,
          text,
          x: clampedX,
          y: tooltipY,
          placement
        });
      }, 120); // 120ms responsive appearance delay
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        clearTimeout(timeoutId);
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: tooltip.placement === 'top'
          ? 'translate(-50%, -100%)'
          : 'translate(-50%, 0)',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '11.5px',
        fontWeight: '500',
        lineHeight: '1.4',
        maxWidth: '280px',
        textAlign: 'center',
        zIndex: 999999,
        pointerEvents: 'none',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        animation: 'tooltipFadeIn 0.12s ease-out forwards',
        whiteSpace: 'normal',
        wordBreak: 'break-word'
      }}
    >
      {tooltip.text}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          ...(tooltip.placement === 'top'
            ? { bottom: '-5px', borderTop: '5px solid #0f172a' }
            : { top: '-5px', borderBottom: '5px solid #0f172a' }),
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          width: 0,
          height: 0
        }}
      />
    </div>
  );
}
