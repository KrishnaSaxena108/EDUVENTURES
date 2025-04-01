const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware
app.use(session({
  secret: 'eduventures-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Function to read users data
const getUsersData = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
};

// Function to write users data
const saveUsersData = (users) => {
  // Ensure data directory exists
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  fs.writeFileSync(
    path.join(__dirname, 'data', 'users.json'),
    JSON.stringify(users, null, 2)
  );
};

// Serve static files from the root directory
app.use(express.static(__dirname));

// Routes for each page - supporting both with and without .html extension
const pages = [
  { route: '/', file: 'index.html' },
  { route: '/tours', file: 'tours.html' },
  { route: '/reviews', file: 'reviews.html' },
  { route: '/map', file: 'map.html' },
  { route: '/contact', file: 'contact.html' },
  { route: '/booknow', file: 'booknow.html' }
];

// Create routes for each page
pages.forEach(page => {
  // Route without .html extension
  app.get(page.route, (req, res) => {
    const filePath = path.join(__dirname, page.file);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
      res.status(404).send(`Page ${page.route} not found`);
    }
  });

  // Also support routes with .html extension for backward compatibility
  if (page.route !== '/') {
    app.get(`${page.route}.html`, (req, res) => {
      res.redirect(page.route);
    });
  }
});

// Login route
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Signup route
app.get('/signup', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'signup.html'));
});

// Login form submission
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Get users from JSON file
  const users = getUsersData();

  // Find user with matching email and password
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    // Set user in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age || 28,
      location: user.location || 'New Delhi',
      visitedPlaces: user.visitedPlaces || [
        {
          name: 'Taj Mahal',
          location: 'Agra, Uttar Pradesh',
          date: '2023-05-15',
          image: './assets/images/popular-6.jpeg'
        },
        {
          name: 'Golden Temple',
          location: 'Amritsar, Punjab',
          date: '2023-07-22',
          image: './assets/images/popular-9.jpg'
        }
      ],
      upcomingTrips: user.upcomingTrips || [
        {
          name: 'Amer Fort',
          location: 'Jaipur, Rajasthan',
          date: '2024-01-15',
          image: './assets/images/popular-2.jpg'
        }
      ]
    };

    return res.json({ success: true, redirect: '/dashboard' });
  }

  // If login fails
  return res.status(401).json({ success: false, message: 'Invalid email or password' });
});

// Signup form submission
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Get users from JSON file
  const users = getUsersData();

  // Check if email already exists
  if (users.some(user => user.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered. Please use a different email or login.'
    });
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    age: 28, // Default age
    location: 'New Delhi', // Default location
    visitedPlaces: [],
    upcomingTrips: []
  };

  // Add user to array and save to file
  users.push(newUser);
  saveUsersData(users);

  // Set user in session
  req.session.user = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    age: newUser.age,
    location: newUser.location,
    visitedPlaces: newUser.visitedPlaces,
    upcomingTrips: newUser.upcomingTrips
  };

  return res.json({ success: true, redirect: '/dashboard' });
});

// Dashboard route - protected by authentication
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', {
    user: req.session.user,
    title: 'User Dashboard - EduVentures'
  });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Handle form submissions from contact page
app.post('/contact', (req, res) => {
  console.log('Contact form submission:', req.body);
  // In a real app, you would process the form data here
  // For now, just redirect back to the contact page
  res.redirect('/contact?success=true');
});

// Handle booking form submissions
app.post('/book', (req, res) => {
  console.log('Booking form submission:', req.body);
  // In a real app, you would process the booking here
  // For now, just redirect to a thank you page or home
  res.redirect('/?booking=success');
});

// Handle 404 errors
app.use((req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).send(`
    <html>
      <head>
        <title>Page Not Found - EduVentures</title>
        <style>
          body {
            font-family: 'Poppins', sans-serif;
            text-align: center;
            padding: 50px;
            background: #f8f9fa;
          }
          h1 {
            color: #0d6efd;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .btn {
            display: inline-block;
            background: #0d6efd;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Page Not Found</h1>
          <p>We're sorry, but the page you were looking for doesn't exist.</p>
          <a href="/" class="btn">Return to Home</a>
        </div>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke! Please try again later.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

console.log('Express server configured with the following routes:');
pages.forEach(page => {
  console.log(`- ${page.route}`);
});
console.log('- /login');
console.log('- /signup');
console.log('- /dashboard (protected)');
console.log('- /logout');

// Create initial users.json file if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const usersFilePath = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFilePath)) {
  // Create initial users file with a demo user
  const initialUsers = [
    {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'password123',
      age: 28,
      location: 'New Delhi',
      visitedPlaces: [
        {
          name: 'Taj Mahal',
          location: 'Agra, Uttar Pradesh',
          date: '2023-05-15',
          image: './assets/images/popular-6.jpeg'
        },
        {
          name: 'Golden Temple',
          location: 'Amritsar, Punjab',
          date: '2023-07-22',
          image: './assets/images/popular-9.jpg'
        }
      ],
      upcomingTrips: [
        {
          name: 'Amer Fort',
          location: 'Jaipur, Rajasthan',
          date: '2024-01-15',
          image: './assets/images/popular-2.jpg'
        }
      ]
    }
  ];

  fs.writeFileSync(usersFilePath, JSON.stringify(initialUsers, null, 2));
  console.log('Created initial users.json file with demo user');
}