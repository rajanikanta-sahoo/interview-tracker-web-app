export const SERVER_BASE_URL = 'http://localhost:5001';
export const API_BASE_URL = `${SERVER_BASE_URL}/api`;

export const api = {
  fetchJobs: async (role = '', location = '', remote = false, skills = '', experience = '') => {
    const params = { role, location, remote: remote ? 'true' : 'false' };
    if (skills) params.skills = skills;
    if (experience) params.experience = experience;
    const query = new URLSearchParams(params);
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

  deleteCustomJob: async (id) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  getApplications: async () => {
    const res = await fetch(`${API_BASE_URL}/applications`);
    return res.json();
  },

  saveApplications: async (applicationsData) => {
    const res = await fetch(`${API_BASE_URL}/applications`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationsData)
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

  savePracticeAnswer: async (id, starAnswer, practiceStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/questions/${id}/practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starAnswer, practiceStatus })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend save failed, falling back to localStorage", e);
    }
    // Client-side fallback persistence
    const key = `practice_question_${id}`;
    const data = { id, starAnswer, practiceStatus };
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  },

  getAICoachFeedback: async (id, starAnswer) => {
    try {
      const res = await fetch(`${API_BASE_URL}/questions/${id}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(starAnswer)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend coach failed, falling back to client-side heuristic evaluation", e);
    }
    // Client-side local evaluation engine fallback
    return evaluateSTARAnswerLocally(starAnswer);
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

  uploadResumeAndParse: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const res = await fetch(`${API_BASE_URL}/resume/upload`, {
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

function evaluateSTARAnswerLocally(starAnswer) {
  const { situation, task, action, result } = starAnswer || {};
  const sLength = (situation || '').trim().length;
  const tLength = (task || '').trim().length;
  const aLength = (action || '').trim().length;
  const rLength = (result || '').trim().length;

  if (sLength === 0 && tLength === 0 && aLength === 0 && rLength === 0) {
    return {
      score: 0,
      structureScore: 0,
      clarityScore: 0,
      impactScore: 0,
      summary: "You haven't written anything yet! Please write your STAR response to receive AI coaching feedback.",
      strengths: [],
      improvements: ["Fill out all four STAR components to get structured guidance."]
    };
  }

  let structureScore = 0;
  if (sLength > 10) structureScore += 25;
  if (tLength > 10) structureScore += 25;
  if (aLength > 15) structureScore += 25;
  if (rLength > 15) structureScore += 25;

  let clarityScore = Math.min(100, Math.round(
    (Math.min(100, sLength) + Math.min(100, tLength) + Math.min(150, aLength) + Math.min(150, rLength)) / 500 * 100
  ));
  if (clarityScore < 40) clarityScore = 40;

  const hasNumbers = /\d+/.test(result || '');
  const hasActionWords = /(optimized|led|designed|implemented|built|delivered|resolved|accelerated|increased|reduced|saved)/i.test(action || '');
  
  let impactScore = 50;
  if (rLength > 20) impactScore += 10;
  if (hasNumbers) impactScore += 25;
  if (hasActionWords) impactScore += 15;
  impactScore = Math.min(100, impactScore);

  const overallScore = Math.round((structureScore + clarityScore + impactScore) / 3);

  const strengths = [];
  const improvements = [];

  if (sLength > 40) {
    strengths.push("Excellent context setting. You described the situation and background very clearly.");
  } else if (sLength > 0) {
    improvements.push("Elaborate on the 'Situation': provide more context on the team size, project scale, or codebase stack.");
  } else {
    improvements.push("The 'Situation' block is completely empty. Start by describing the team environment and problem scope.");
  }

  if (tLength > 30) {
    strengths.push("Good challenge description. The core objective and task constraints are well-defined.");
  } else if (tLength > 0) {
    improvements.push("Add detail to the 'Task': what were the specific deadlines, blockers, or KPIs you were responsible for solving?");
  } else {
    improvements.push("The 'Task' block is empty. State the core goal or obstacle you were assigned to tackle.");
  }

  if (aLength > 60) {
    strengths.push("Fantastic action deep-dive! You explained exactly *how* you solved it, highlighting your personal ownership.");
  } else if (aLength > 0) {
    improvements.push("Expand on the 'Action' block: elaborate on the specific tech choices (e.g. React custom hooks, Redux toolkit) and teamwork strategies you used.");
  } else {
    improvements.push("The 'Action' block is missing. This is the most crucial part—explain your active role and technical decisions step-by-step.");
  }

  if (hasNumbers && rLength > 30) {
    strengths.push("Highly impactful 'Result'! Using concrete quantitative metrics (e.g., speedups, decrease in load times) immediately proves your value.");
  } else if (rLength > 0) {
    if (!hasNumbers) {
      improvements.push("Quantify your 'Result': use numbers, percentages, or times (e.g., 'reduced render lag by 40%', 'saved 10 engineering hours per week') to make it credible.");
    } else {
      improvements.push("Elaborate on the 'Result': describe the feedback from stakeholders or subsequent milestones after your changes were deployed.");
    }
  } else {
    improvements.push("The 'Result' block is empty. A STAR answer must conclude with a strong, successful outcome!");
  }

  if (hasActionWords) {
    strengths.push("Strong active voice. Words like 'optimized' or 'implemented' paint you as a proactive leader.");
  }

  let summary;
  if (overallScore >= 85) {
    summary = "Outstanding STAR response! This answer is highly structured, quantitative, and ready for senior-level tech interviews. Maintain this exact format.";
  } else if (overallScore >= 65) {
    summary = "Solid draft with a good foundation. To make it truly standout, focus on adding quantitative results and explicit details of your technical actions.";
  } else {
    summary = "Beginning draft. You have started the process, but the response needs to be expanded across all STAR blocks, especially action steps and outcomes.";
  }

  return {
    score: overallScore,
    structureScore,
    clarityScore,
    impactScore,
    summary,
    strengths,
    improvements
  };
}
