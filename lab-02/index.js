const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'books.db');

let db = null;

// Middleware
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
  });
  next();
});

// Task 3: initializeDBAndServer() async function
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Create table book if not exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `);

    // Insert 10 sample books if table is empty
    const countResult = await db.get(`SELECT COUNT(*) as count FROM book;`);
    if (countResult.count === 0) {
      await db.exec(`
        INSERT INTO book (title, author, price, pages) VALUES
        ('To Kill a Mockingbird', 'Harper Lee', 399, 281),
        ('1984', 'George Orwell', 299, 328),
        ('The Great Gatsby', 'F. Scott Fitzgerald', 250, 180),
        ('Pride and Prejudice', 'Jane Austen', 350, 279),
        ('The Hobbit', 'J.R.R. Tolkien', 499, 310),
        ('Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', 599, 309),
        ('The Catcher in the Rye', 'J.D. Salinger', 320, 234),
        ('The Alchemist', 'Paulo Coelho', 280, 208),
        ('The Lord of the Rings', 'J.R.R. Tolkien', 899, 1178),
        ('Crime and Punishment', 'Fyodor Dostoevsky', 450, 671);
      `);
      console.log('Database initialized with 10 sample books.');
    }

    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/`);
      });
    }
  } catch (e) {
    console.error(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Route: GET / (Root info)
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 2: SQLite database and CRUD routes API',
    endpoints: {
      'GET    /books/': 'Retrieve all books',
      'GET    /books/:bookId/': 'Retrieve single book by ID',
      'POST   /books/': 'Add a new book',
      'PUT    /books/:bookId/': 'Update a book by ID',
      'DELETE /books/:bookId/': 'Delete a book by ID'
    }
  });
});

// Route 1: GET /books/ (all books)
app.get('/books/', async (req, res) => {
  try {
    const getBooksQuery = `SELECT * FROM book ORDER BY id ASC;`;
    const booksArray = await db.all(getBooksQuery);
    res.status(200).json(booksArray);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 2: GET /books/:bookId/ (one book)
app.get('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Book with id ${bookId} does not exist.`
      });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 3: POST /books/ (add book)
app.post('/books/', async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Fields title, author, price, and pages are required.'
      });
    }

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [title, author, price, pages]);
    const bookId = result.lastID;

    res.status(201).json({
      bookId,
      message: 'Book Added Successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 4: PUT /books/:bookId/ (update book)
app.put('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    const existingBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Book with id ${bookId} does not exist.`
      });
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [
      title !== undefined ? title : existingBook.title,
      author !== undefined ? author : existingBook.author,
      price !== undefined ? price : existingBook.price,
      pages !== undefined ? pages : existingBook.pages,
      bookId
    ]);

    res.status(200).json({
      message: 'Book Details Updated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 5: DELETE /books/:bookId/ (remove book)
app.delete('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    const existingBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Book with id ${bookId} does not exist.`
      });
    }

    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({
      message: 'Book Deleted'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler for unknown paths
app.use((req, res) => {
  res.status(404).json({
    error: '404 Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. Route does not exist.`
  });
});

module.exports = { app, initializeDBAndServer, getDb: () => db };
