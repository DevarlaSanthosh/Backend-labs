// Task 3: Plain HTTP server using Node.js built-in 'http' module
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello');
});

// If run directly from terminal
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Plain HTTP server running at http://localhost:${PORT}/`);
  });
}

module.exports = server;
