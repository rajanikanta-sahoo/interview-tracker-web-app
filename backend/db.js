import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, 'db.json');

const defaultData = {
  profile: {
    name: '',
    role: '',
    experience: '',
    skills: [],
    preferences: { location: '', salary: '', type: '' },
    resumePath: null
  },
  questionsBank: [
    { id: 'q1', role: 'Software Engineer', text: 'Can you explain the difference between REST and GraphQL?', type: 'text' },
    { id: 'q2', role: 'Software Engineer', text: 'How do you handle state management in React?', type: 'text' }
  ],
  customJobs: [],
  resumes: [],
  coverLetters: [],
  checklists: [],
  applications: { applied: [], interviewing: [], offer: [], rejected: [] }
};

export const readDb = () => {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.checklists) parsed.checklists = [];
    if (!parsed.applications) parsed.applications = { applied: [], interviewing: [], offer: [], rejected: [] };
    return parsed;
  } catch (err) {
    console.error("Error reading db:", err);
    return defaultData;
  }
};

export const writeDb = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing db:", err);
  }
};
