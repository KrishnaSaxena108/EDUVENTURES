const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongo = require('./config/mongo');
const User = require('./models/user');
const Booking = require('./models/booking');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Authentication Middleware
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization'];
  if (!token) return res.redirect('/login');

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.clearCookie('token'); // clear expired/invalid cookie
      return res.redirect('/login');
    }
    req.user = decoded; // contains user id & email
    next();
  });
};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Public routes
const pages = [
  { route: '/', file: 'index.html' },
  { route: '/tours', file: 'tours.html' },
  { route: '/reviews', file: 'reviews.html' },
  { route: '/map', file: 'map.html' },
  { route: '/contact', file: 'contact.html' }
];
pages.forEach(page => {
  app.get(page.route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', page.file));
  });
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// ✅ Signup
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();

  const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '1h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  res.json({ success: true, redirect: '/dashboard' });
});

// ✅ Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  res.json({ success: true, redirect: '/dashboard' });
});

// ✅ Dashboard (protected)
app.get('/dashboard', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  const bookings = await Booking.find({ email: user.email }).sort({ bookingDate: -1 }).lean();
  res.render('dashboard', {
    user,
    bookings,
    title: 'User Dashboard - EduVentures'
  });
});

// ✅ Book Now (protected GET page)
app.get('/booknow', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'booknow.html'));
});

// ✅ Save booking (protected POST)
app.post('/booknow', isAuthenticated, async (req, res) => {
  try {
    const bookingData = req.body;

    // Validation
    if (!bookingData.firstName || !bookingData.lastName || !bookingData.phone ||
      !bookingData.startDate || !bookingData.endDate || !bookingData.destination || !bookingData.destinationName ||
      !bookingData.numPeople || !bookingData.dailyRate || !bookingData.paymentMethod) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    // Calculate number of days
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const numDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Secure price calculation
    const calculatedTotal = bookingData.dailyRate * bookingData.numPeople * numDays;

    // Save booking
    const booking = new Booking({
      ...bookingData,
      numDays,
      totalPrice: calculatedTotal,
      email: req.user.email // ensure linked to logged-in user
    });

    await booking.save();

    return res.json({
      success: true,
      message: `Booking successful! ${bookingData.destinationName} for ${bookingData.numPeople} people × ${numDays} days. Total: ₹${calculatedTotal}`,
      redirect: '/dashboard'
    });

  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ✅ Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// Contact form
app.post('/contact', (req, res) => {
  console.log('Contact form submission:', req.body);
  res.redirect('/contact?success=true');
});

// 404 page
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke! Please try again later.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});