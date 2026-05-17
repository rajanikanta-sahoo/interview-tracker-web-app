import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

let userProfile = {
  name: '',
  role: '',
  experience: '',
  skills: [],
  preferences: { location: '', salary: '', type: '' },
  resumePath: null
};

// Configure Multer for Resume upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'resume-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET /api/profile
router.get('/', (req, res) => {
  res.json(userProfile);
});

// POST /api/profile/update
router.post('/update', (req, res) => {
  const data = req.body;
  userProfile = { ...userProfile, ...data };
  res.json({ message: 'Profile updated', profile: userProfile });
});

// POST /api/profile/upload-resume
router.post('/upload-resume', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  userProfile.resumePath = `/uploads/${req.file.filename}`;
  res.json({ message: 'Resume uploaded successfully', resumePath: userProfile.resumePath });
});

export default router;
