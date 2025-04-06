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
  cookie: { maxAge: 3600000 }
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
    return [];
  }
};

// Function to write users data
const saveUsersData = (users) => {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  fs.writeFileSync(
    path.join(dataDir, 'users.json'),
    JSON.stringify(users, null, 2)
  );
};

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes for each page (now served from 'public' folder)
const pages = [
  { route: '/', file: 'index.html' },
  { route: '/tours', file: 'tours.html' },
  { route: '/reviews', file: 'reviews.html' },
  { route: '/map', file: 'map.html' },
  { route: '/contact', file: 'contact.html' },
  { route: '/booknow', file: 'booknow.html' }
];

pages.forEach(page => {
  app.get(page.route, (req, res) => {
    const filePath = path.join(__dirname, 'public', page.file);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
      res.status(404).send(`Page ${page.route} not found`);
    }
  });

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
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Signup route
app.get('/signup', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Login form submission
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const users = getUsersData();
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
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

  return res.status(401).json({ success: false, message: 'Invalid email or password' });
});

// Signup form submission
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const users = getUsersData();

  if (users.some(user => user.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered. Please use a different email or login.'
    });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    age: 28,
    location: 'New Delhi',
    visitedPlaces: [],
    upcomingTrips: []
  };

  users.push(newUser);
  saveUsersData(users);

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

// Dashboard route
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', {
    user: req.session.user,
    title: 'User Dashboard - EduVentures'
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Contact form
app.post('/contact', (req, res) => {
  console.log('Contact form submission:', req.body);
  res.redirect('/contact?success=true');
});

// Booking form
app.post('/book', (req, res) => {
  console.log('Booking form submission:', req.body);
  res.redirect('/?booking=success');
});

// 404 Page
app.use((req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).send(`
    <html>
      <head>
        <title>404 - Page Not Found | EduVentures</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            height: 100%;
            width: 100%;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(to bottom right, #eaf6ff, #d6e6ff);
            display: flex;
            justify-content: center;
            align-items: center;
            color: #333;
          }

          .wrapper {
            text-align: center;
            background: #ffffff;
            padding: 60px 40px;
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 90%;
            animation: fadeIn 0.7s ease;
          }

          h1 {
            font-size: 60px;
            color: #0d6efd;
            margin-bottom: 20px;
          }

          p {
            font-size: 18px;
            color: #666;
            margin-bottom: 30px;
          }

          .btn {
            display: inline-block;
            background-color: #0d6efd;
            color: white;
            padding: 12px 28px;
            font-size: 16px;
            text-decoration: none;
            border-radius: 8px;
            transition: background 0.3s ease, transform 0.2s ease;
          }

          .btn:hover {
            background-color: #0b5ed7;
            transform: translateY(-2px);
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }

          @media (max-width: 480px) {
            h1 {
              font-size: 42px;
            }
            .wrapper {
              padding: 40px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <h1>404</h1>
          <p>Oops! The page you’re looking for doesn’t exist.</p>
          <a href="/" class="btn">Back to Home</a>
        </div>
      </body>
    </html>
  `);
});

// General error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke! Please try again later.');
});

// Server start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

console.log('Express server configured with the following routes:');
pages.forEach(page => console.log(`- ${page.route}`));
console.log('- /login');
console.log('- /signup');
console.log('- /dashboard (protected)');
console.log('- /logout');

// Create initial users.json if not exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const usersFilePath = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFilePath)) {
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
