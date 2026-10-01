import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, User, Briefcase, FileText, 
  CheckSquare, Settings, BookOpen, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import './Sidebar.css';

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'User Profile', icon: <User size={20} />, path: '/profile' },
    { name: 'Prep Hub', icon: <BookOpen size={20} />, path: '/prep' },
    { name: 'Job Search', icon: <Briefcase size={20} />, path: '/jobs' },
    { name: 'Resume Builder', icon: <FileText size={20} />, path: '/resume' },
    { name: 'Application Tracker', icon: <CheckSquare size={20} />, path: '/tracker' },
    { name: 'Contribute', icon: <Settings size={20} />, path: '/contribute' },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <h2 className="brand-text">{isCollapsed ? 'IT' : 'Interview Tracker'}</h2>
        <button className="collapse-btn" onClick={toggleCollapse} aria-label="Toggle Sidebar">
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
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
    </aside>
  );
}

export default Sidebar;
