export const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher', minYears: 0, maxYears: 1, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', desc: '0–1 yrs' },
  { id: 'junior', label: 'Junior', minYears: 1, maxYears: 3, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', desc: '1–3 yrs' },
  { id: 'mid', label: 'Mid-Level', minYears: 3, maxYears: 6, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)', desc: '3–6 yrs' },
  { id: 'senior', label: 'Senior', minYears: 6, maxYears: 10, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', desc: '6–10 yrs' },
  { id: 'lead', label: 'Lead / Principal', minYears: 10, maxYears: 99, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)', desc: '10+ yrs' }
];

export function resolveLevelFromYears(years) {
  const num = Number(years) || 0;
  return EXPERIENCE_LEVELS.find(l => num >= l.minYears && num < l.maxYears) || EXPERIENCE_LEVELS[EXPERIENCE_LEVELS.length - 1];
}

export const LEVEL_EXPECTATIONS_SUMMARY = {
  fresher: {
    focus: 'Data Structures, Algorithms, Project Deep-Dive & Enthusiasm',
    expectations: [
      'Problem-solving with arrays, hash maps, strings, and trees (LeetCode Easy)',
      'Clear explanation of tech stack choices and code architecture in college/hobby projects',
      'Curiosity, humble learning mindset, and high communication clarity'
    ]
  },
  junior: {
    focus: 'Production Code Quality, APIs, Debugging & STAR Delivery',
    expectations: [
      'Clean coding with classic patterns (Sliding Window, Two Pointers, BFS/DFS)',
      'Hands-on experience with REST APIs, SQL indexing, and unit testing',
      'Articulating past work with Situation, Task, Action, and Quantified Results'
    ]
  },
  mid: {
    focus: 'System Architecture, Scalability, Trade-offs & Mentorship',
    expectations: [
      'High-Level System Design (load balancing, caching, DB sharding, rate limiting)',
      'Defending trade-offs (SQL vs NoSQL, Monolith vs Microservices, CAP theorem)',
      'Mentoring juniors, improving code review velocity, and owning features end-to-end'
    ]
  },
  senior: {
    focus: 'Distributed Systems, Technical Vision, Organizational Impact',
    expectations: [
      'Multi-region scalability, event-driven systems, observability, and SLOs/SLAs',
      'Influencing cross-team technical strategy and handling ambiguous business mandates',
      'Mentoring mid-level engineers and establishing rigorous engineering health bars'
    ]
  },
  lead: {
    focus: 'Enterprise Platform Strategy, Culture, FinOps & Executive Alignment',
    expectations: [
      'Multi-team platform architecture, large legacy-to-cloud migrations, and FinOps',
      'Build vs. buy ROI analysis, engineering org culture, and succession planning',
      'Translating complex technical roadmaps into executive business risk/reward terms'
    ]
  }
};
