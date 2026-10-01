import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Preparation from './pages/Preparation';
import JobSearch from './pages/JobSearch';
import ResumeBuilder from './pages/ResumeBuilder';
import Tracker from './pages/Tracker';
import Contribute from './pages/Contribute';

function App() {
  useEffect(() => {
    window.scrollTo(0, 0);

    const cleanupInjections = () => {
      // Remove rogue extension DOM elements injected outside #root
      Array.from(document.body.children).forEach(el => {
        if (el.id !== 'root' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
          el.remove();
        }
      });

      // Remove specific extension containers that pollutes job discovery
      const targets = document.querySelectorAll(
        '[id*="careerflow" i], [class*="careerflow" i], [id*="copilot" i], [class*="copilot" i]'
      );
      targets.forEach(el => el.remove());

      document.querySelectorAll('div, section, aside, p').forEach(el => {
        if (el.textContent && (el.textContent.includes('Careerflow Extension') || el.textContent.includes('iAmYourCareerCopilot'))) {
          el.remove();
        }
      });
    };

    cleanupInjections();
    const observer = new MutationObserver(cleanupInjections);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/prep" element={<Preparation />} />
          <Route path="/jobs" element={<JobSearch />} />
          <Route path="/resume" element={<ResumeBuilder />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/contribute" element={<Contribute />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
