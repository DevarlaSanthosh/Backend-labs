const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to log HTTP method, URL, and response status code
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
  });
  next();
});

// Route: GET /
// Returns welcome text
app.get('/', (req, res) => {
  res.status(200).send('Welcome to the Lab 1 Express Server!');
});

// Route: GET /about
// Returns JSON with student name and section
app.get('/about', (req, res) => {
  res.status(200).json({
    name: process.env.STUDENT_NAME || 'D Santhosh',
    registrationNumber: process.env.STUDENT_REG_NO || '252U1R8015',
    section: process.env.STUDENT_SECTION || 'CSE-QE 2A'
  });
});

// Route: GET /time
// Returns current date and time using new Date()
app.get('/time', (req, res) => {
  const now = new Date();
  res.status(200).json({
    currentTime: now.toString(),
    isoString: now.toISOString(),
    timestamp: now.getTime()
  });
});

// 404 Handler for any unknown path
app.use((req, res) => {
  res.status(404).json({
    error: '404 Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. Route does not exist.`
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

