const API_BASE_URL = 'http://localhost:5001/api';

export const api = {
  fetchJobs: async (role = '', location = '', remote = false) => {
    const query = new URLSearchParams({ role, location, remote: remote ? 'true' : 'false' });
    const res = await fetch(`${API_BASE_URL}/jobs?${query}`);
    return res.json();
  },

  addCustomJob: async (jobData) => {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    return res.json();
  },

  fetchQuestions: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.group) query.append('group', params.group);
    if (params.difficulty) query.append('difficulty', params.difficulty);
    
    const res = await fetch(`${API_BASE_URL}/questions?${query}`);
    return res.json();
  },

  addQuestionText: async (questionData) => {
    const res = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData)
    });
    return res.json();
  },

  uploadQuestionFile: async (questionData, file) => {
    const formData = new FormData();
    Object.keys(questionData).forEach(key => formData.append(key, questionData[key]));
    formData.append('file', file);
    
    const res = await fetch(`${API_BASE_URL}/questions/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  deleteQuestion: async (id) => {
    const res = await fetch(`${API_BASE_URL}/questions/${id}`, { method: 'DELETE' });
    return res.json();
  },

  deleteAllQuestions: async () => {
    const res = await fetch(`${API_BASE_URL}/questions/all`, { method: 'DELETE' });
    return res.json();
  },

  fetchProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/profile`);
    return res.json();
  },

  updateProfile: async (data) => {
    const res = await fetch(`${API_BASE_URL}/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const res = await fetch(`${API_BASE_URL}/profile/upload-resume`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // --- Resumes & Cover Letters ---
  getResumes: async () => {
    const res = await fetch(`${API_BASE_URL}/resume`);
    return res.json();
  },
  
  saveResume: async (data) => {
    const res = await fetch(`${API_BASE_URL}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteResume: async (id) => {
    const res = await fetch(`${API_BASE_URL}/resume/${id}`, { method: 'DELETE' });
    return res.json();
  },

  getCoverLetters: async () => {
    const res = await fetch(`${API_BASE_URL}/resume/cover-letters`);
    return res.json();
  },
  
  saveCoverLetter: async (data) => {
    const res = await fetch(`${API_BASE_URL}/resume/cover-letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteCoverLetter: async (id) => {
    const res = await fetch(`${API_BASE_URL}/resume/cover-letters/${id}`, { method: 'DELETE' });
    return res.json();
  },

  generateSuggestions: async (role, profileSkills) => {
    const res = await fetch(`${API_BASE_URL}/resume/generate-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, profileSkills })
    });
    return res.json();
  },

  generateCoverLetter: async (role, profileName, companyName) => {
    const res = await fetch(`${API_BASE_URL}/resume/generate-cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, profileName, companyName })
    });
    return res.json();
  }
};
