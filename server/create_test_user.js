const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config();

const email = process.argv[2] || 'test@example.com';
const password = process.argv[3] || 'password123';

console.log(`Attempting to create user: ${email}`);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/password_reset_app')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password });
      await user.save();
      console.log(`SUCCESS: User created!`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    } else {
      console.log(`INFO: User already exists with this email.`);
    }

    process.exit();
  })
  .catch(err => {
    console.error('ERROR: Could not connect to MongoDB.');
    console.error('Please make sure MongoDB is running on localhost:27017 or update MONGO_URI in .env');
    console.error('Error details:', err.message);
    process.exit(1);
  });
