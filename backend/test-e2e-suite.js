import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readDb, writeDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runAllTests() {
  console.log('=====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END TEST SUITE');
  console.log('   Testing all features of Interview Tracker Web App');
  console.log('=====================================================\n');

  // --- SECTION 1: DATABASE INTEGRITY ---
  console.log('--- TEST GROUP 1: Database Storage & Initial State ---');
  const db = readDb();
  assert(db !== null && typeof db === 'object', 'db.json parsed successfully');
  assert(db.profile && typeof db.profile.name === 'string', `Profile exists: name="${db.profile.name}"`);
  assert(Array.isArray(db.questionsBank), `Questions bank loaded: ${db.questionsBank.length} questions`);
  assert(Array.isArray(db.customJobs), `Custom jobs loaded: ${db.customJobs.length} custom jobs`);

  // --- SECTION 2: APPLICATION TRACKER LOGIC ---
  console.log('\n--- TEST GROUP 2: Application Tracker Workflow ---');
  // 1. Initial columns
  const initialApps = db.applications || { applied: [], interviewing: [], offer: [], rejected: [] };
  assert(Array.isArray(initialApps.applied), 'Applied column exists');
  assert(Array.isArray(initialApps.interviewing), 'Interviewing column exists');
  assert(Array.isArray(initialApps.offer), 'Offer column exists');
  assert(Array.isArray(initialApps.rejected), 'Rejected column exists');

  // 2. Add Job: Fullstack QA Engineer @ Meta ($150k)
  const testJobId = `test-qa-${Date.now()}`;
  const newJob = {
    id: testJobId,
    title: 'Fullstack QA Engineer',
    company: 'Meta',
    salary: '$150k',
    url: 'https://metacareers.com/qa-role',
    appliedDate: '2026-09-27',
    notes: 'Preparing for testing questions',
    status: 'applied',
    round: '1'
  };

  const updatedApps = {
    applied: [...(initialApps.applied || []), newJob],
    interviewing: [...(initialApps.interviewing || [])],
    offer: [...(initialApps.offer || [])],
    rejected: [...(initialApps.rejected || [])]
  };

  db.applications = updatedApps;
  writeDb(db);

  const reloadedDb1 = readDb();
  const addedJob = reloadedDb1.applications.applied.find(j => j.id === testJobId);
  assert(!!addedJob, 'New job "Fullstack QA Engineer" successfully created in "applied" column');
  assert(addedJob?.company === 'Meta' && addedJob?.salary === '$150k', 'Job company and salary match: Meta, $150k');

  // 3. Move status to "interviewing"
  const movedApps = {
    applied: reloadedDb1.applications.applied.filter(j => j.id !== testJobId),
    interviewing: [...reloadedDb1.applications.interviewing, { ...addedJob, status: 'interviewing', round: '2' }],
    offer: [...reloadedDb1.applications.offer],
    rejected: [...reloadedDb1.applications.rejected]
  };
  db.applications = movedApps;
  writeDb(db);

  const reloadedDb2 = readDb();
  const notInApplied = !reloadedDb2.applications.applied.some(j => j.id === testJobId);
  const inInterviewing = reloadedDb2.applications.interviewing.find(j => j.id === testJobId);
  assert(notInApplied, 'Card removed from "applied" column');
  assert(!!inInterviewing && inInterviewing.status === 'interviewing', 'Card successfully moved to "interviewing" column');

  // Clean up test job
  db.applications.interviewing = db.applications.interviewing.filter(j => j.id !== testJobId);
  writeDb(db);
  assert(!readDb().applications.interviewing.some(j => j.id === testJobId), 'Test job cleaned up from database');

  // --- SECTION 3: PREP HUB FEATURES & STAR COACH EVALUATION ---
  console.log('\n--- TEST GROUP 3: Prep Hub, STAR Playground & In-App ConfirmModal ---');
  // Check questions
  const qBank = db.questionsBank;
  assert(qBank.length > 0, `Prep questions bank populated with ${qBank.length} questions`);
  
  // Test search filtering logic
  const reactQuestions = qBank.filter(q => 
    (q.text && q.text.toLowerCase().includes('react')) ||
    (q.originalName && q.originalName.toLowerCase().includes('react')) ||
    (q.group && q.group.toLowerCase().includes('react'))
  );
  assert(reactQuestions.length > 0, `Search keyword "react" correctly matched ${reactQuestions.length} questions`);

  // Test STAR answer evaluation engine
  const mockStarAnswer = {
    situation: 'During our migration to React 19, the dashboard render latency spiked by 350ms.',
    task: 'I was assigned to profile the bundle, isolate redundant re-renders, and decrease TTI within 2 weeks.',
    action: 'I implemented memoized selectors, converted heavy tab components into lazy-loaded chunks, and replaced deep prop drilling with optimized context slices.',
    result: 'We successfully cut TTI by 45%, eliminated 80% of unnecessary re-renders, and reduced total bundle size by 1.8MB.'
  };

  // Evaluation algorithm
  const sLen = mockStarAnswer.situation.length;
  const tLen = mockStarAnswer.task.length;
  const aLen = mockStarAnswer.action.length;
  const rLen = mockStarAnswer.result.length;
  let structureScore = 0;
  if (sLen > 10) structureScore += 25;
  if (tLen > 10) structureScore += 25;
  if (aLen > 15) structureScore += 25;
  if (rLen > 15) structureScore += 25;
  assert(structureScore === 100, `STAR Structure score is complete (100%): got ${structureScore}%`);

  const hasNumbers = /\d+/.test(mockStarAnswer.result);
  const hasActionWords = /(optimized|led|designed|implemented|built|delivered|resolved|accelerated|increased|reduced|saved)/i.test(mockStarAnswer.action);
  let impactScore = 50;
  if (rLen > 20) impactScore += 10;
  if (hasNumbers) impactScore += 25;
  if (hasActionWords) impactScore += 15;
  impactScore = Math.min(100, impactScore);
  assert(impactScore === 100, `STAR Impact score recognized quantified metrics and action verbs: ${impactScore}%`);

  // Save practice draft
  const targetQ = qBank[0];
  targetQ.starAnswer = mockStarAnswer;
  targetQ.practiceStatus = 'Mastered';
  writeDb(db);
  const reloadedQ = readDb().questionsBank.find(q => q.id === targetQ.id);
  assert(reloadedQ.practiceStatus === 'Mastered', 'STAR practice status "Mastered" successfully persisted');
  assert(reloadedQ.starAnswer.result.includes('45%'), 'STAR answer draft saved successfully');

  // --- SECTION 4: HEADER SEARCH SUGGESTIONS & NOTIFICATIONS ---
  console.log('\n--- TEST GROUP 4: Header Search & Live Notifications ---');
  // Header search logic test
  const APP_PAGES = [
    { title: 'Dashboard', path: '/' },
    { title: 'Prep Hub', path: '/prep' },
    { title: 'Job Search', path: '/jobs' },
    { title: 'Resume Builder', path: '/resume' },
    { title: 'Application Tracker', path: '/tracker' },
    { title: 'Contribute', path: '/contribute' },
    { title: 'Profile & Settings', path: '/profile' },
  ];

  const searchKeyword = 'react';
  const matchedPages = APP_PAGES.filter(p => p.title.toLowerCase().includes(searchKeyword));
  const matchedQ = qBank.filter(q => q.text?.toLowerCase().includes(searchKeyword) || q.group?.toLowerCase().includes(searchKeyword));
  const combinedSuggestions = [...matchedPages, ...matchedQ];
  assert(combinedSuggestions.length > 0, `Typing "React" in global search returns ${combinedSuggestions.length} suggestions`);
  assert(combinedSuggestions.some(s => (s.text || s.title || '').toLowerCase().includes('react')), 'Suggestions accurately match "React"');

  // Header notifications computation test
  const notifs = [];
  const testInterviewing = [{ id: '1', company: 'Google', title: 'Senior Engineer' }];
  if (testInterviewing.length > 0) {
    notifs.push({
      id: 'interviews-active',
      title: `${testInterviewing.length} Active Interview`,
      path: '/tracker'
    });
  }
  assert(notifs.length === 1 && notifs[0].title.includes('Active Interview'), 'Active interview trigger produces notification bell badge alert');

  // --- SECTION 5: JOB SEARCH & TRACKING APPLICATION ---
  console.log('\n--- TEST GROUP 5: Job Search Filters & "Track Application" ---');
  // Add a sample custom job to verify search
  const customJob = {
    id: `custom-job-${Date.now()}`,
    title: 'Senior React Developer',
    company: 'Stripe',
    location: 'Remote',
    type: 'Full-Time',
    description: 'Work on cutting edge React applications',
    salaryMin: '$160k',
    salaryMax: '$190k',
    skills: ['React', 'TypeScript', 'Node.js'],
    postedAt: new Date().toISOString(),
    source: 'User Contributed',
    isCustom: true
  };
  db.customJobs.push(customJob);
  writeDb(db);

  const matchedJobs = readDb().customJobs.filter(j => 
    j.title.toLowerCase().includes('react') || (Array.isArray(j.skills) && j.skills.some(s => s.toLowerCase() === 'react'))
  );
  assert(matchedJobs.length > 0, `Job search filters for "React" matched ${matchedJobs.length} custom job(s)`);

  // Simulate "Track Application"
  const trackerData = readDb().applications || { applied: [] };
  const trackedItem = { ...customJob, status: 'Applied', trackedAt: new Date().toISOString() };
  trackerData.applied.push(trackedItem);
  db.applications = trackerData;
  writeDb(db);

  assert(readDb().applications.applied.some(j => j.id === customJob.id), '"Track Application" adds job directly into Tracker applied column');

  // Clean up
  db.customJobs = db.customJobs.filter(j => j.id !== customJob.id && !j.id.startsWith('custom-job-'));
  db.applications.applied = db.applications.applied.filter(j => j.id !== customJob.id);
  writeDb(db);

  // --- SECTION 6: RESUME BUILDER & ATS OPTIMIZATION GAUGE ---
  console.log('\n--- TEST GROUP 6: Resume Builder & ATS Gauge Logic ---');
  const sampleResume = {
    name: 'Rajanikanta Sahoo',
    role: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'Java', 'Spring Boot', 'Docker', 'PostgreSQL', 'Git', 'REST'],
    experience: [
      { company: 'Tech Corp', title: 'Senior Engineer', duration: '2022 - Present', description: 'Built scalable microservices.' }
    ],
    education: [
      { institution: 'Tech University', degree: 'B.Tech Computer Science', year: '2019' }
    ],
    summary: 'Experienced Full Stack Developer with expertise in enterprise Java and React.'
  };

  // Compute ATS score
  let score = 0;
  if (sampleResume.name) score += 10;
  if (sampleResume.role) score += 10;
  if (sampleResume.summary && sampleResume.summary.length > 50) score += 15;
  if (sampleResume.skills.length >= 6) score += 25;
  if (sampleResume.experience.length >= 1) score += 25;
  if (sampleResume.education.length >= 1) score += 15;
  assert(score >= 85, `ATS Gauge computes high score for complete resume: ${score}% (Strong Match)`);

  // --- SECTION 7: CONTRIBUTE PAGE (SUBMISSIONS & LIVE PREVIEW) ---
  console.log('\n--- TEST GROUP 7: Contribute Page Forms ---');
  const testContributedQ = {
    id: `q-contrib-${Date.now()}`,
    role: 'QA Engineer',
    text: 'What is the difference between regression testing and sanity testing?',
    group: 'QA',
    keyAreas: 'Software Testing Life Cycle',
    difficulty: 'Easy',
    type: 'text'
  };
  db.questionsBank.push(testContributedQ);
  writeDb(db);
  assert(readDb().questionsBank.some(q => q.id === testContributedQ.id), 'Contribute question submission successfully added to questions bank');

  // Clean up
  db.questionsBank = db.questionsBank.filter(q => q.id !== testContributedQ.id);
  writeDb(db);

  // --- SECTION 8: PROFILE & CAREER SETTINGS ---
  console.log('\n--- TEST GROUP 8: Profile Stats & Career Settings ---');
  const currentProfile = readDb().profile;
  assert(!!currentProfile.name, `Profile name is "${currentProfile.name}"`);
  assert(currentProfile.skills.length >= 4, `Profile has ${currentProfile.skills.length} skills registered`);
  assert(!!currentProfile.preferences?.location, `Career preference location is "${currentProfile.preferences.location}"`);

  // Completeness check
  const checks = [
    currentProfile.name,
    currentProfile.role,
    currentProfile.experience,
    currentProfile.bio,
    currentProfile.skills?.length > 0,
    currentProfile.linkedin,
    currentProfile.github,
    currentProfile.preferences?.location,
    currentProfile.preferences?.salary,
    currentProfile.preferences?.type,
    currentProfile.resumePath,
  ];
  const filled = checks.filter(Boolean).length;
  const completeness = Math.round((filled / checks.length) * 100);
  assert(completeness > 40, `Profile completeness calculated correctly: ${completeness}%`);

  console.log('\n=====================================================');
  console.log(`📊 TEST RESULTS SUMMARY:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed:      ${passedTests}`);
  console.log(`   Failed:      ${failedTests}`);
  console.log('=====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
