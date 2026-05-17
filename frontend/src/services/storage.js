export const storage = {
  getTrackerJobs: () => {
    const data = localStorage.getItem('tracker_jobs');
    return data ? JSON.parse(data) : { applied: [], interviewing: [], offer: [], rejected: [] };
  },
  
  saveTrackerJobs: (jobs) => {
    localStorage.setItem('tracker_jobs', JSON.stringify(jobs));
  },

  getEvaluations: () => {
    const data = localStorage.getItem('evaluations');
    return data ? JSON.parse(data) : [];
  },

  saveEvaluation: (evaluation) => {
    const evals = storage.getEvaluations();
    evals.push(evaluation);
    localStorage.setItem('evaluations', JSON.stringify(evals));
  },

  exportData: () => {
    const data = {
      tracker: storage.getTrackerJobs(),
      evaluations: storage.getEvaluations()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: (file, onComplete) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.tracker) storage.saveTrackerJobs(data.tracker);
        if (data.evaluations) localStorage.setItem('evaluations', JSON.stringify(data.evaluations));
        if (onComplete) onComplete();
      } catch (err) {
        console.error("Failed to parse JSON file", err);
        alert("Invalid file format.");
      }
    };
    reader.readAsText(file);
  }
};
