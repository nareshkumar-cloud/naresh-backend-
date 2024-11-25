const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

// Dummy users database
const users = [
  { id: 1, username: 'naresh', password: 'mypassword', role: 'admin' },
  { id: 2, username: 'kumar', password: 'mypassword', role: 'user' },
];

// Middleware for verifying tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).send('Access Token Required');

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid Token');
    req.user = user;
    next();
  });
};

// Middleware for Authorization
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).send('Access Denied');
    }
    next();
  };
};

// Login Route (Authentication)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) return res.status(401).send('Invalid Credentials');

  // Generate Access Token
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  res.json({ accessToken });
});

// Protected Route (Authorization)
app.get('/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
  res.send('Welcome Admin! You have full access.');
});

app.listen(3000, () => console.log('Server is running on port 3000'));
