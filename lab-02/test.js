const http = require('http');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'books.db');
// If db already exists, remove it before running test to ensure clean deterministic run
if (fs.existsSync(dbPath)) {
  try { fs.unlinkSync(dbPath); } catch (e) {}
}

const { app, initializeDBAndServer } = require('./index.js');
let server;

function makeRequest(method, urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('=== Lab 2: SQLite database and CRUD routes Test Suite ===\n');

  // Start server on 3000
  server = app.listen(3000);
  await new Promise(r => setTimeout(r, 600));

  // 1. GET /books/
  console.log('1. Testing GET /books/ (Retrieve all books)');
  const resAll = await makeRequest('GET', '/books/');
  assert(resAll.status === 200, `Expected status 200, got ${resAll.status}`);
  assert(Array.isArray(resAll.data), `Response is an array`);
  assert(resAll.data.length >= 10, `Initial 10 books found (count: ${resAll.data.length})`);

  // 2. GET /books/:bookId/
  console.log('\n2. Testing GET /books/1/ (Retrieve single book by ID)');
  const resOne = await makeRequest('GET', '/books/1/');
  assert(resOne.status === 200, `Expected status 200, got ${resOne.status}`);
  assert(resOne.data.id === 1, `Book id matches 1`);
  assert(resOne.data.title === 'To Kill a Mockingbird', `Title is "To Kill a Mockingbird"`);

  // 3. POST /books/
  console.log('\n3. Testing POST /books/ (Add new book)');
  const newBook = {
    title: 'Atomic Habits',
    author: 'James Clear',
    price: 499,
    pages: 320
  };
  const resPost = await makeRequest('POST', '/books/', newBook);
  assert(resPost.status === 201, `Expected status 201, got ${resPost.status}`);
  assert(resPost.data.bookId !== undefined, `Returned new bookId: ${resPost.data.bookId}`);
  const createdId = resPost.data.bookId;

  // Verify created book
  const resVerifyPost = await makeRequest('GET', `/books/${createdId}/`);
  assert(resVerifyPost.status === 200, `Retrieved newly added book`);
  assert(resVerifyPost.data.title === 'Atomic Habits', `Title matches "Atomic Habits"`);

  // 4. PUT /books/:bookId/
  console.log(`\n4. Testing PUT /books/${createdId}/ (Update book)`);
  const updatedData = {
    title: 'Atomic Habits (Updated Edition)',
    author: 'James Clear',
    price: 550,
    pages: 330
  };
  const resPut = await makeRequest('PUT', `/books/${createdId}/`, updatedData);
  assert(resPut.status === 200, `Expected status 200, got ${resPut.status}`);

  // Verify updated book
  const resVerifyPut = await makeRequest('GET', `/books/${createdId}/`);
  assert(resVerifyPut.data.price === 550, `Price successfully updated to 550`);
  assert(resVerifyPut.data.title === 'Atomic Habits (Updated Edition)', `Title updated`);

  // 5. DELETE /books/:bookId/
  console.log(`\n5. Testing DELETE /books/${createdId}/ (Delete book)`);
  const resDelete = await makeRequest('DELETE', `/books/${createdId}/`);
  assert(resDelete.status === 200, `Expected status 200, got ${resDelete.status}`);

  // Verify deletion
  const resVerifyDelete = await makeRequest('GET', `/books/${createdId}/`);
  assert(resVerifyDelete.status === 404, `Deleted book returns 404 Not Found`);

  // 6. Unknown route fallback
  console.log('\n6. Testing unknown route (404 Fallback)');
  const res404 = await makeRequest('GET', '/non-existent-route');
  assert(res404.status === 404, `Unknown route returns 404 Not Found`);

  console.log('\n🎉 All Lab 2 tests executed successfully!\n');
  server.close(() => process.exit(process.exitCode || 0));
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  if (server) server.close();
  process.exit(1);
});
