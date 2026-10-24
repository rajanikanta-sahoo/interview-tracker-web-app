// Experience level definitions and comprehensive interview preparation checklist templates

export const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher', minYears: 0, maxYears: 1, subtitle: '0–1 years (Campus / Entry Level)' },
  { id: 'junior', label: 'Junior', minYears: 1, maxYears: 3, subtitle: '1–3 years (Early Career)' },
  { id: 'mid', label: 'Mid-Level', minYears: 3, maxYears: 6, subtitle: '3–6 years (Core Contributor)' },
  { id: 'senior', label: 'Senior', minYears: 6, maxYears: 10, subtitle: '6–10 years (Technical Lead / Senior)' },
  { id: 'lead', label: 'Lead / Principal', minYears: 10, maxYears: 99, subtitle: '10+ years (Staff / Architect / Director)' }
];

export function resolveExperienceLevel(years) {
  const numYears = Number(years) || 0;
  return EXPERIENCE_LEVELS.find(l => numYears >= l.minYears && numYears < l.maxYears)
    || EXPERIENCE_LEVELS[EXPERIENCE_LEVELS.length - 1];
}

export const LEVEL_EXPECTATIONS = {
  fresher: {
    title: 'Fresher / Entry-Level Expectations',
    summary: 'Focus is on computer science fundamentals, eagerness to learn, project depth, and clear communication.',
    keyPoints: [
      'Strong grasp of Data Structures & basic Algorithms (Arrays, HashMaps, Trees, Sorting)',
      'Deep understanding of college/personal projects (architecture, why tech was chosen, challenges)',
      'Clear, humble communication with curiosity and passion for engineering',
      'Solid programming syntax and ability to write bug-free code for straightforward tasks'
    ]
  },
  junior: {
    title: 'Junior Engineer Expectations',
    summary: 'Focus is on writing clean, production-ready code, understanding APIs, debugging, and team collaboration.',
    keyPoints: [
      'Comfortable solving LeetCode Mediums across classic patterns (Two Pointers, Sliding Window, BFS/DFS)',
      'Hands-on experience with REST APIs, database queries, and unit/integration testing',
      'Demonstrated ownership of feature delivery and ability to troubleshoot production issues',
      'Articulating past work with the STAR method (Situation, Task, Action, Result)'
    ]
  },
  mid: {
    title: 'Mid-Level Engineer Expectations',
    summary: 'Focus is on system design, technical trade-offs, code maintainability, and initial mentoring.',
    keyPoints: [
      'Proficiency in High-Level System Design (caching, load balancers, DB sharding, rate limiting)',
      'Proven ability to drive features independently from design doc to monitoring in production',
      'Mentoring junior team members and improving team code quality and CI/CD workflows',
      'Clear trade-off discussions: SQL vs NoSQL, Monolith vs Microservices, Consistency vs Availability'
    ]
  },
  senior: {
    title: 'Senior Engineer Expectations',
    summary: 'Focus is on distributed systems, technical vision, cross-functional leadership, and organizational impact.',
    keyPoints: [
      'Mastery of distributed architecture, resilience, scalability, and observability (SLOs/SLAs)',
      'Influencing technical direction without formal authority and driving multi-quarter projects',
      'High bar for code design patterns, performance profiling, and failure-mode analysis',
      'Handling ambiguous problems, mentoring mid-levels, and conducting technical interviews'
    ]
  },
  lead: {
    title: 'Staff / Principal / Lead Expectations',
    summary: 'Focus is on multi-team architecture, organizational strategy, culture building, and executive communication.',
    keyPoints: [
      'Enterprise architecture spanning multiple business units and legacy-to-modern transitions',
      'Strategic build vs. buy evaluations with budget and ROI considerations',
      'Building high-performing engineering cultures, succession planning, and senior talent coaching',
      'Translating complex technical roadmaps for C-level executives and stakeholders'
    ]
  }
};

export const CHECKLIST_TEMPLATES = {
  fresher: {
    categories: [
      {
        id: 'fundamentals',
        title: '🧠 Technical Fundamentals',
        description: 'Core CS and language basics — the foundation of every technical interview',
        items: [
          { id: 'f-ds', text: 'Review core data structures (Arrays, Linked Lists, Trees, Stacks, Queues, Hash Maps)', priority: 'critical', linkTo: '/prep' },
          { id: 'f-algo', text: 'Practice 15+ LeetCode Easy & Basic Sorting/Searching algorithms', priority: 'critical', linkTo: '/prep' },
          { id: 'f-lang', text: 'Solidify primary language concepts (OOP, memory, scope, error handling)', priority: 'critical' },
          { id: 'f-complexity', text: 'Master Big-O notation — practice analyzing time and space complexity on the fly', priority: 'important' },
          { id: 'f-sql', text: 'Review relational database basics & SQL (SELECT, JOIN, GROUP BY, indexes)', priority: 'important' },
          { id: 'f-git', text: 'Understand Git basics (branching, commits, PR review flow)', priority: 'helpful' }
        ]
      },
      {
        id: 'projects',
        title: '🛠️ Academic & Personal Projects',
        description: 'Your projects ARE your experience — be ready to walk through them end-to-end',
        items: [
          { id: 'f-proj-list', text: 'Select 2 best projects and write out the problem, architecture, and tech choices', priority: 'critical' },
          { id: 'f-proj-tech', text: 'Be ready to defend why you chose specific libraries, databases, or frameworks', priority: 'critical' },
          { id: 'f-proj-challenges', text: 'Prepare 1-2 major bugs or hurdles faced and how you overcame them', priority: 'important' },
          { id: 'f-proj-demo', text: 'Ensure live demo links or clean GitHub repositories are accessible and documented', priority: 'helpful' },
          { id: 'f-proj-learnings', text: 'Identify what you would re-architect if building the project again today', priority: 'helpful' }
        ]
      },
      {
        id: 'behavioral',
        title: '🗣️ Behavioral & Communication',
        description: 'Interviewers look for enthusiasm, learnability, and good team dynamics',
        items: [
          { id: 'f-intro', text: 'Prepare a 60-second elevator pitch ("Tell me about yourself")', priority: 'critical', linkTo: '/prep' },
          { id: 'f-why', text: 'Prepare compelling answers for "Why this company?" and "Why this role?"', priority: 'critical' },
          { id: 'f-teamwork', text: 'Prepare a STAR story about teamwork (college project, hackathon, or internship)', priority: 'important', linkTo: '/prep' },
          { id: 'f-failure', text: 'Prepare a story about a mistake or setback and the lesson you learned', priority: 'important', linkTo: '/prep' },
          { id: 'f-questions', text: 'Prepare 3-5 thoughtful questions to ask the interviewer about their team and tech', priority: 'important' }
        ]
      },
      {
        id: 'resume_prep',
        title: '📄 Resume Readiness',
        description: 'Ensure your resume represents your technical skills accurately',
        items: [
          { id: 'f-res-1page', text: 'Format resume into a crisp 1-page document with zero typos', priority: 'critical', linkTo: '/resume' },
          { id: 'f-res-ats', text: 'Run ATS keyword scan against the target job description', priority: 'important', linkTo: '/resume' },
          { id: 'f-res-skills', text: 'Ensure every skill listed on the resume is one you can comfortably answer questions on', priority: 'critical' },
          { id: 'f-res-links', text: 'Verify LinkedIn, GitHub, and Portfolio URLs work and are up to date', priority: 'helpful', linkTo: '/profile' }
        ]
      },
      {
        id: 'logistics',
        title: '📋 Interview Day Logistics',
        description: 'Smooth setup ensures you stay calm and focused',
        items: [
          { id: 'f-company-research', text: 'Research company core products, target audience, and recent announcements', priority: 'critical' },
          { id: 'f-tech-setup', text: 'Test camera, microphone, internet connection, and quiet space 30 mins before', priority: 'important' },
          { id: 'f-coding-env', text: 'Ensure local IDE or browser sandbox (JSFiddle/CodeSandbox) is ready', priority: 'important' },
          { id: 'f-join-early', text: 'Join the meeting 3–5 minutes ahead of schedule', priority: 'helpful' }
        ]
      }
    ]
  },

  junior: {
    categories: [
      {
        id: 'coding_depth',
        title: '💻 Practical Coding & Problem Solving',
        description: 'Interviewers look for clean code, edge-case coverage, and solid DSA patterns',
        items: [
          { id: 'j-patterns', text: 'Master core patterns: Sliding Window, Two Pointers, Fast/Slow, Binary Search, BFS/DFS', priority: 'critical', linkTo: '/prep' },
          { id: 'j-leetcode-med', text: 'Solve 20+ LeetCode Medium questions under a 25-minute timer', priority: 'critical', linkTo: '/prep' },
          { id: 'j-api-design', text: 'Review RESTful API design rules, HTTP status codes, headers, and payload structures', priority: 'important' },
          { id: 'j-testing-basics', text: 'Prepare to discuss unit testing, mocking, and code coverage on your stack', priority: 'important' },
          { id: 'j-db-queries', text: 'Review database indexing, query optimization, and normalization vs denormalization', priority: 'important' }
        ]
      },
      {
        id: 'work_stories',
        title: '💼 Production Experience & STAR Stories',
        description: 'Prove you can ship reliable code into production environments',
        items: [
          { id: 'j-impact-story', text: 'Prepare 2 stories quantifying the impact of features you shipped (latency, revenue, users)', priority: 'critical', linkTo: '/prep' },
          { id: 'j-bug-incident', text: 'Prepare a production incident story: how you diagnosed, hotfixed, and prevented recurrence', priority: 'critical', linkTo: '/prep' },
          { id: 'j-collab-story', text: 'Prepare a cross-functional story working with Product Managers and Designers', priority: 'important', linkTo: '/prep' },
          { id: 'j-tech-debt', text: 'Have an example of refactoring messy code or eliminating technical debt', priority: 'helpful' }
        ]
      },
      {
        id: 'sys_basics',
        title: '🏗️ Basic System Architecture',
        description: 'Early architecture awareness gives you an edge',
        items: [
          { id: 'j-arch-flow', text: 'Be able to trace a web request from browser DNS lookup to DB query and back', priority: 'critical' },
          { id: 'j-caching', text: 'Understand Redis/Memcached use-cases, TTLs, and cache invalidation strategies', priority: 'important' },
          { id: 'j-auth', text: 'Explain JWT vs session cookies, OAuth2 flows, and HTTPS/TLS handshakes', priority: 'important' },
          { id: 'j-async-queues', text: 'Understand background jobs and message queues (RabbitMQ, Kafka, SQS)', priority: 'helpful' }
        ]
      },
      {
        id: 'behavioral',
        title: '🗣️ Behavioral & Career Narrative',
        description: 'Demonstrate maturity, collaboration, and clear motivation',
        items: [
          { id: 'j-why-leaving', text: 'Prepare a positive, growth-oriented framing for why you are exploring new roles', priority: 'critical' },
          { id: 'j-conflict', text: 'Prepare a story about resolving a technical disagreement with a teammate', priority: 'important', linkTo: '/prep' },
          { id: 'j-feedback', text: 'Have an example of critical feedback you received and how you acted on it', priority: 'important' },
          { id: 'j-questions-team', text: 'Prepare 4 targeted questions regarding sprint rhythm, on-call burden, and mentorship', priority: 'important' }
        ]
      },
      {
        id: 'resume_logistics',
        title: '📄 Resume & Company Research',
        description: 'Target your application specifically to the employer',
        items: [
          { id: 'j-res-tailor', text: 'Tailor resume bullets to match JD technologies and quantify every accomplishment', priority: 'critical', linkTo: '/resume' },
          { id: 'j-ats-check', text: 'Achieve at least 70% ATS score on the target job in Resume Builder', priority: 'important', linkTo: '/resume' },
          { id: 'j-company-tech', text: 'Read the company’s engineering blog and recent GitHub open-source contributions', priority: 'important' },
          { id: 'j-salary-research', text: 'Check Levels.fyi and Glassdoor for compensation bands for this role and location', priority: 'helpful' }
        ]
      }
    ]
  },

  mid: {
    categories: [
      {
        id: 'system_design',
        title: '🏗️ System Design & Distributed Systems',
        description: 'Mid-level interviews emphasize architecture, scalability, and technical trade-offs',
        items: [
          { id: 'm-sd-blocks', text: 'Master system design blocks: Load Balancers, Reverse Proxies, CDNs, DB replicas, Sharding', priority: 'critical', linkTo: '/prep' },
          { id: 'm-sd-practice', text: 'Practice 5 classic designs: URL Shortener, Chat System, Rate Limiter, News Feed, Payment Webhook', priority: 'critical', linkTo: '/prep' },
          { id: 'm-sd-tradeoffs', text: 'Articulate trade-offs: Consistency vs Availability (CAP), SQL vs NoSQL, Polling vs WebSockets', priority: 'critical' },
          { id: 'm-sd-scale', text: 'Walk through scaling from 1K to 1M daily active users (caching, horizontal scaling, read replicas)', priority: 'important' },
          { id: 'm-sd-resilience', text: 'Understand circuit breakers, retries with exponential backoff, and dead-letter queues', priority: 'important' }
        ]
      },
      {
        id: 'coding_excellence',
        title: '💻 Coding, Algorithms & Quality',
        description: 'Demonstrate fast problem solving with robust edge-case handling',
        items: [
          { id: 'm-dsa-advanced', text: 'Practice LeetCode Medium/Hard problems across Graphs, Dynamic Programming, and Heaps', priority: 'critical', linkTo: '/prep' },
          { id: 'm-clean-code', text: 'Apply clean code principles: modularity, meaningful naming, separation of concerns, DRY', priority: 'critical' },
          { id: 'm-concurrency', text: 'Understand multithreading, concurrency pitfalls (race conditions, deadlocks), and async I/O', priority: 'important' },
          { id: 'm-code-reviews', text: 'Prepare examples of thorough code reviews you conducted that caught architectural flaws', priority: 'helpful' }
        ]
      },
      {
        id: 'leadership_delivery',
        title: '👥 Technical Leadership & Project Delivery',
        description: 'Mid-level engineers are expected to mentor others and drive feature delivery',
        items: [
          { id: 'm-mentor-story', text: 'Prepare a detailed story about mentoring a junior engineer to self-sufficiency', priority: 'critical', linkTo: '/prep' },
          { id: 'm-ambiguity', text: 'Prepare a story about taking an ambiguous product requirement and delivering it successfully', priority: 'critical', linkTo: '/prep' },
          { id: 'm-cross-team', text: 'Prepare an example of resolving blockers with external teams or third-party vendors', priority: 'important' },
          { id: 'm-estimates', text: 'Be ready to discuss your estimation process and how you manage scope creep', priority: 'important' }
        ]
      },
      {
        id: 'behavioral_deep',
        title: '🗣️ Behavioral Deep Dive',
        description: 'Show emotional intelligence, accountability, and maturity under pressure',
        items: [
          { id: 'm-high-pressure', text: 'Prepare a high-stakes incident response story under tight SLAs', priority: 'critical', linkTo: '/prep' },
          { id: 'm-pushback', text: 'Prepare a story of professionally pushing back against unrealistic timelines or poor design', priority: 'important', linkTo: '/prep' },
          { id: 'm-failure-pivot', text: 'Prepare a significant project failure story, root cause analysis, and how you adapted', priority: 'important', linkTo: '/prep' },
          { id: 'm-strategic-qs', text: 'Prepare 5 deep questions about product roadmap, engineering culture, and technical debt', priority: 'important' }
        ]
      },
      {
        id: 'resume_prep',
        title: '📄 Resume & Market Positioning',
        description: 'Highlight measurable business outcomes rather than just responsibilities',
        items: [
          { id: 'm-res-progression', text: 'Ensure resume displays clear career progression and increasing scope of responsibility', priority: 'critical', linkTo: '/resume' },
          { id: 'm-res-numbers', text: 'Ensure every role has metrics: % latency reduced, $ server costs saved, # DAU supported', priority: 'critical', linkTo: '/resume' },
          { id: 'm-ats-target', text: 'Hit 75%+ ATS match score on the target role with highlighted keywords', priority: 'important', linkTo: '/resume' },
          { id: 'm-salary-negotiation', text: 'Formulate your target compensation package (base, bonus, equity) with market data', priority: 'important' }
        ]
      }
    ]
  },

  senior: {
    categories: [
      {
        id: 'distributed_systems',
        title: '🏗️ Distributed Systems & Architecture',
        description: 'Senior engineers are evaluated heavily on large-scale architectural wisdom',
        items: [
          { id: 's-sd-distributed', text: 'Master distributed primitives: Consensus (Raft/Paxos), Event Sourcing, CQRS, Saga Pattern', priority: 'critical', linkTo: '/prep' },
          { id: 's-sd-real-scale', text: 'Be prepared to design systems supporting 10M+ users with multi-region active-active deployments', priority: 'critical', linkTo: '/prep' },
          { id: 's-sd-data-modeling', text: 'Demonstrate deep data modeling: partitioning keys, hot spots, write amplification, B-Tree vs LSM-Tree', priority: 'critical' },
          { id: 's-sd-observability', text: 'Explain telemetry: distributed tracing (OpenTelemetry), APM, error budgeting, and MTTR reduction', priority: 'important' },
          { id: 's-sd-security', text: 'Cover security architecture: zero trust, OAuth/mTLS, rate limiting against DDoS, data encryption at rest/transit', priority: 'important' }
        ]
      },
      {
        id: 'technical_leadership',
        title: '🎯 Technical Vision & Strategy',
        description: 'Demonstrate how you elevate the entire engineering organization',
        items: [
          { id: 's-vision-story', text: 'Prepare a case study of defining and driving an architecture overhaul or tech migration', priority: 'critical', linkTo: '/prep' },
          { id: 's-influence-wo-auth', text: 'Have 2 solid examples of influencing peer teams or senior stakeholders without authority', priority: 'critical', linkTo: '/prep' },
          { id: 's-balancing-debt', text: 'Discuss your framework for balancing feature velocity versus technical debt paydown', priority: 'important' },
          { id: 's-engineering-standards', text: 'Explain how you set coding guidelines, architecture review boards, and deployment safety bars', priority: 'important' },
          { id: 's-hiring-bar', text: 'Discuss your experience conducting technical interviews, calibrating candidates, and training interviewers', priority: 'helpful' }
        ]
      },
      {
        id: 'coding_system',
        title: '💻 High-Level Coding & System Components',
        description: 'Write robust, maintainable components with clean interfaces',
        items: [
          { id: 's-ood-design', text: 'Practice Object-Oriented/Component Design: LRU Cache, Concurrency-safe queue, Pub-Sub Broker', priority: 'critical', linkTo: '/prep' },
          { id: 's-perf-profiling', text: 'Be ready to discuss memory leak hunting, garbage collection tuning, and flame graph analysis', priority: 'important' },
          { id: 's-code-review-standards', text: 'Prepare to evaluate pull requests live with an eye on security, scalability, and testability', priority: 'important' }
        ]
      },
      {
        id: 'behavioral_leadership',
        title: '🗣️ Leadership Behavioral & Culture',
        description: 'Demonstrate resilience, empathy, and high-impact stakeholder management',
        items: [
          { id: 's-difficult-convo', text: 'Prepare a story about delivering critical constructive feedback or resolving team dysfunction', priority: 'critical', linkTo: '/prep' },
          { id: 's-disagree-commit', text: 'Prepare a strong "Disagree and Commit" story where you executed fully on an alternative path', priority: 'critical', linkTo: '/prep' },
          { id: 's-org-impact', text: 'Highlight a technical contribution that drove measurable business impact across multiple teams', priority: 'important', linkTo: '/prep' },
          { id: 's-executive-questions', text: 'Prepare 5 executive-level questions on business sustainability, runway, and org scaling hurdles', priority: 'important' }
        ]
      },
      {
        id: 'resume_negotiation',
        title: '📄 Executive Resume & Total Compensation',
        description: 'Position yourself as an indispensable technical partner',
        items: [
          { id: 's-res-leadership-focus', text: 'Structure resume emphasizing systems scale, team multipliers, and company-level revenue impacts', priority: 'critical', linkTo: '/resume' },
          { id: 's-ats-match-senior', text: 'Achieve 80%+ ATS match score targeting Staff/Senior requirements', priority: 'important', linkTo: '/resume' },
          { id: 's-comp-negotiation', text: 'Research equity structures (RSUs vs options, vesting cliffs, refreshers) for negotiation leverage', priority: 'important' },
          { id: 's-references-prep', text: 'Brief 3 senior/director-level references on the specifics of this opportunity', priority: 'helpful' }
        ]
      }
    ]
  },

  lead: {
    categories: [
      {
        id: 'enterprise_architecture',
        title: '🏗️ Enterprise & Multi-Org Architecture',
        description: 'Shape architectural standards spanning global engineering teams',
        items: [
          { id: 'l-multi-org-arch', text: 'Design platform systems across autonomous engineering orgs (shared platforms, data meshes)', priority: 'critical', linkTo: '/prep' },
          { id: 'l-monolith-migration', text: 'Prepare a comprehensive migration playbook for decoupling large monolithic legacy systems safely', priority: 'critical', linkTo: '/prep' },
          { id: 'l-cost-scale', text: 'Detail cloud infrastructure cost governance (FinOps), reserved instances, and workload right-sizing', priority: 'critical' },
          { id: 'l-disaster-recovery', text: 'Explain enterprise Business Continuity & Disaster Recovery (RTO/RPO, Chaos Engineering)', priority: 'important' },
          { id: 'l-compliance', text: 'Address SOC2, ISO 27001, GDPR, HIPAA compliance implications on system architecture', priority: 'important' }
        ]
      },
      {
        id: 'strategic_vision',
        title: '🎯 Technical Strategy & Roadmap Execution',
        description: 'Align long-term technical investments with business growth vectors',
        items: [
          { id: 'l-multi-year-roadmap', text: 'Present frameworks for 2-3 year technical roadmaps aligned to company revenue targets', priority: 'critical', linkTo: '/prep' },
          { id: 'l-build-vs-buy', text: 'Present a real build vs. buy financial and operational analysis with vendor evaluation', priority: 'critical' },
          { id: 'l-emerging-tech', text: 'Discuss pragmatic adoption of emerging technology (AI/ML integration, vector search, edge computing)', priority: 'important' },
          { id: 'l-tech-governance', text: 'Explain RFC/ADR (Architecture Decision Record) processes that foster velocity without fragmentation', priority: 'important' }
        ]
      },
      {
        id: 'org_culture',
        title: '👥 Organizational Leadership & Talent Development',
        description: 'Build organizations, retain talent, and foster an environment of engineering excellence',
        items: [
          { id: 'l-org-scaling', text: 'Prepare case studies on growing engineering teams from 20 to 100+ engineers', priority: 'critical', linkTo: '/prep' },
          { id: 'l-senior-mentorship', text: 'Discuss coaching senior engineers into Staff/Principal roles and career pathing frameworks', priority: 'critical', linkTo: '/prep' },
          { id: 'l-blameless-culture', text: 'Explain incident management frameworks, root-cause blameless postmortems, and learning rituals', priority: 'important' },
          { id: 'l-dora-metrics', text: 'Discuss engineering health metrics (DORA: deployment frequency, lead time, CFR, MTTR)', priority: 'important' }
        ]
      },
      {
        id: 'c_level_influence',
        title: '📊 Executive Stakeholder Alignment',
        description: 'Bridge engineering complexity with executive and board-level strategy',
        items: [
          { id: 'l-exec-presentation', text: 'Demonstrate translating architectural trade-offs into business risk and EBITDA impact', priority: 'critical', linkTo: '/prep' },
          { id: 'l-crisis-management', text: 'Prepare an executive briefing example during a major security breach or critical outage', priority: 'important' },
          { id: 'l-board-interaction', text: 'Prepare for questions regarding tech durability, key person risk, and platform defensibility', priority: 'important' }
        ]
      },
      {
        id: 'executive_resume_pkg',
        title: '📄 Executive Portfolio & Package',
        description: 'Position yourself for transformative leadership roles',
        items: [
          { id: 'l-exec-narrative', text: 'Format resume into an executive dossier emphasizing organizational scale, budget managed, and revenue unlocked', priority: 'critical', linkTo: '/resume' },
          { id: 'l-thought-leadership', text: 'Highlight keynotes, open-source advisory, patents, or published whitepapers', priority: 'important', linkTo: '/profile' },
          { id: 'l-exec-equity', text: 'Analyze executive compensation packages (accelerated vesting, severance covenants, equity strike price)', priority: 'important' }
        ]
      }
    ]
  }
};
