const mongoose = require('mongoose');

// ✅ User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  age: { type: Number, default: 28 },
  location: { type: String, default: 'New Delhi' },
  visitedPlaces: { type: Array, default: [] },
  upcomingTrips: { type: Array, default: [] },
});

module.exports = mongoose.model('User', userSchema);