import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, User, Briefcase, FileText, 
  CheckSquare, Settings, BookOpen, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { storage } from '../services/storage';
import './Sidebar.css';

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const [userName] = useState(() => {
    const profile = storage.getProfile();
    return profile?.name || 'Applicant';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={19} />, path: '/' },
    { name: 'User Profile', icon: <User size={19} />, path: '/profile' },
    { name: 'Prep Hub', icon: <BookOpen size={19} />, path: '/prep' },
    { name: 'Job Search', icon: <Briefcase size={19} />, path: '/jobs' },
    { name: 'Career Builder', icon: <FileText size={19} />, path: '/resume' },
    { name: 'Application Tracker', icon: <CheckSquare size={19} />, path: '/tracker' },
    { name: 'Contribute Hub', icon: <Settings size={19} />, path: '/contribute' },
  ];

  const getInitials = (name) => {
    if (!name) return 'IT';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <Link to="/" className="brand-wrapper" title="Interview Tracker">
          <div className="brand-logo-mark">
            <span>IT</span>
          </div>
          <div className="brand-title-wrap">
            <span className="brand-title">InterviewTracker</span>
            <span className="brand-badge">Career AI Hub</span>
          </div>
        </Link>
        <button className="collapse-btn" onClick={toggleCollapse} aria-label="Toggle Sidebar">
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.name : ''}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-text">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile Status Pill */}
      <div className="sidebar-footer">
        <Link to="/profile" className="footer-profile-pill" title={isCollapsed ? `${userName} (Profile)` : ''}>
          <div className="footer-avatar">
            {getInitials(userName)}
          </div>
          <div className="footer-meta">
            <span className="footer-name">{userName}</span>
            <span className="footer-status">
              <span className="status-dot"></span> Active Search
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;
