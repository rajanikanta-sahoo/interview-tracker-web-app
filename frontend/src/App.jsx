import React from 'react';
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
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
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
