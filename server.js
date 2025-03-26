const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(__dirname));

const pages = [
    { route: '/', file: 'index.html' },
    { route: '/tours', file: 'tours.html' },
    { route: '/reviews', file: 'reviews.html' },
    { route: '/map', file: 'map.html' },
    { route: '/contact', file: 'contact.html' },
    { route: '/login', file: 'login.html' },
    { route: '/booknow', file: 'booknow.html' }
];
pages.forEach(page => {
    app.get(page.route, (req, res) => {
        const filePath = path.join(__dirname, page.file);
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
app.post('/contact', (req, res) => {
    console.log('Contact form submission:', req.body);
    res.redirect('/contact?success=true');
});
app.post('/book', (req, res) => {
    console.log('Booking form submission:', req.body);
    res.redirect('/?booking=success');
});

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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Please try again later.');
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

console.log('Express server configured with the following routes:');
pages.forEach(page => {
    console.log(`- ${page.route}`);
});