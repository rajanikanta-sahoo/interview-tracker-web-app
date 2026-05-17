import React from 'react';
import { Bell, Search } from 'lucide-react';

function Header() {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'flex-end', 
      alignItems: 'center', 
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: `1px solid var(--border-color)`
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="input-group" style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input type="text" className="input" placeholder="Search..." style={{ paddingLeft: '32px', width: '200px' }} />
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}

export default Header;
