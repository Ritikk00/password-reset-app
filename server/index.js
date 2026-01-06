const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const router = require('./routes');

// Load env vars
dotenv.config();

const app = express();

// Render automatically assigns a PORT, if not, use 5000 for local
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
// process.env.MONGO_URI Render ke Dashboard se aayega
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/password_reset_app';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB successfully'))
  .catch((err) => {
    console.error('❌ Could not connect to MongoDB:', err.message);
    process.exit(1); // Error aane par server stop ho jaye
  });

// CORS Configuration
// Agar aap frontend deploy kar dein, to '*' ki jagah frontend URL daal sakte hain
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('Server is running perfectly on Render!');
});

// API Routes
app.use('/api', router);

// Render ke liye '0.0.0.0' par bind karna zaruri hai
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
