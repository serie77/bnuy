import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// More detailed CORS configuration
app.use(cors({
  origin: [
    'https://bnuy.fun', // your production frontend
    'https://bnuy.onrender.com', // your Render backend URL (optional, for testing)
    'http://localhost:5173', // local dev
    'http://localhost:3000'  // local dev
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Submission Schema
const submissionSchema = new mongoose.Schema({
  walletAddress: String,
  timestamp: { type: Date, default: Date.now },
  fileName: String,
  fileSize: Number,
  fileType: String,
  tokenBalance: Number,
  imageUrl: String
});

const Submission = mongoose.model('Submission', submissionSchema);

// Get submission count for a wallet
app.get('/api/submissions/:walletAddress', async (req, res) => {
  try {
    const count = await Submission.countDocuments({
      walletAddress: req.params.walletAddress
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get submission count' });
  }
});

// Save new submission
app.post('/api/submissions', async (req, res) => {
  try {
    const count = await Submission.countDocuments({
      walletAddress: req.body.walletAddress
    });

    if (count >= 2) {
      return res.status(400).json({ error: 'Maximum submissions reached' });
    }

    const submission = new Submission(req.body);
    await submission.save();
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

// Add a test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 