import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Briefcase, FileText, CheckSquare, Settings, BookOpen } from 'lucide-react';
import './Sidebar.css';

function Sidebar() {
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
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Interview Tracker</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
