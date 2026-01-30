const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

module.exports = mongoose;