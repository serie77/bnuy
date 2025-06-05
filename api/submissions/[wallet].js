const mongoose = require('mongoose');

// Connect to MongoDB (connection is cached between serverless function calls)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI).then(mongoose => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

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

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

async function handler(req, res) {
  await dbConnect();
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  const { wallet } = req.query;

  if (req.method === 'GET') {
    try {
      const count = await Submission.countDocuments({
        walletAddress: wallet
      });
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get submission count' });
    }
  } else if (req.method === 'POST') {
    try {
      const count = await Submission.countDocuments({
        walletAddress: wallet
      });

      if (count >= 2) {
        return res.status(400).json({ error: 'Maximum submissions reached' });
      }

      // Send Discord notification
      const formData = new FormData();
      const payload = {
        content: `🐰 **NEW BUNNY SUBMISSION** 🐰\n\n` +
                 `**Entry #${count + 1}/2**\n` +
                 `**Wallet:** \`${wallet}\`\n` +
                 `**Tokens:** ${req.body.tokenBalance.toLocaleString()}\n` +
                 `**File:** ${req.body.fileName} (${(req.body.fileSize / 1024 / 1024).toFixed(2)}MB)\n` +
                 `**Type:** ${req.body.fileType}\n` +
                 `**Time:** ${new Date().toLocaleString()}`
      };
      
      formData.append('payload_json', JSON.stringify(payload));
      
      await fetch(process.env.DISCORD_WEBHOOK, {
        method: 'POST',
        body: formData
      });

      const submission = new Submission(req.body);
      await submission.save();
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save submission' });
    }
  } else if (req.method === 'OPTIONS') {
    res.status(200).end();
  }
}

module.exports = handler;