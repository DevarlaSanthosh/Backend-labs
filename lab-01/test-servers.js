const http = require('http');

async function testHttpServer() {
  console.log('=== 1. Testing Plain Node.js HTTP Server (http-server.js) ===');
  const server = require('./http-server');
  await new Promise(r => server.listen(3001, r));
  console.log('Plain HTTP server listening on port 3001');

  await new Promise((resolve, reject) => {
    http.get('http://localhost:3001/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`GET / -> Status: ${res.statusCode}, Body: "${data}"`);
        server.close(resolve);
      });
    }).on('error', reject);
  });
}

async function testExpressServer() {
  console.log('\n=== 2. Testing Express Server (index.js) ===');
  require('./index.js');
  await new Promise(r => setTimeout(r, 600));

  const routes = [
    { path: '/', expectedStatus: 200, label: 'GET / (Welcome text)' },
    { path: '/about', expectedStatus: 200, label: 'GET /about (Student JSON)' },
    { path: '/time', expectedStatus: 200, label: 'GET /time (Current timestamp)' },
    { path: '/random-not-found', expectedStatus: 404, label: 'GET /random-not-found (404 Fallback)' }
  ];

  for (const route of routes) {
    await new Promise((resolve, reject) => {
      http.get(`http://localhost:3000${route.path}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`\nRoute: ${route.label}`);
          console.log(`Status Code: ${res.statusCode}`);
          console.log(`Response: ${data}`);
          resolve();
        });
      }).on('error', reject);
    });
  }
}

async function main() {
  try {
    await testHttpServer();
    await testExpressServer();
    console.log('\n✅ All tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

main();
