'use strict';

const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

/**
 * SQLite Database Helper for Books
 */
class BookDatabase {
  constructor(dbPath = null) {
    this.dbPath = dbPath || process.env.SQLITE_DB_PATH || './data/database.sqlite';
    this.db = null;
  }

  /**
   * Open database connection
   */
  open() {
    if (!this.db) {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get all books with optional filter, order, limit, skip
   */
  getBooks(options = {}) {
    this.open();

    const {
      filter = {},
      orderBy = 'book_id ASC',
      limit = 0,
      skip = 0,
      findOne = false
    } = options;

    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    // Apply filters
    if (filter.name) {
      query += ' AND name LIKE ?';
      params.push(`%${filter.name}%`);
    }
    if (filter.author) {
      query += ' AND author LIKE ?';
      params.push(`%${filter.author}%`);
    }
    if (filter.id) {
      query += ' AND id = ?';
      params.push(filter.id);
    }
    if (filter.mongo_id) {
      query += ' AND mongo_id = ?';
      params.push(filter.mongo_id);
    }

    // Add ordering
    query += ` ORDER BY ${orderBy}`;

    // Add limit and skip
    if (limit > 0) {
      query += ' LIMIT ?';
      params.push(limit);

      if (skip > 0) {
        query += ' OFFSET ?';
        params.push(skip);
      }
    }

    if (findOne) {
      return this.db.prepare(query).get(...params);
    }

    return this.db.prepare(query).all(...params);
  }

  /**
   * Get a single book by ID
   */
  getBookById(id) {
    this.open();
    return this.db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  }

  /**
   * Get a single book by MongoDB ID
   */
  getBookByMongoId(mongoId) {
    this.open();
    return this.db.prepare('SELECT * FROM books WHERE mongo_id = ?').get(mongoId);
  }

  /**
   * Create a new book
   */
  createBook(bookData) {
    this.open();

    const { book_id, name, author } = bookData;

    const stmt = this.db.prepare(`
      INSERT INTO books (book_id, name, author, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = stmt.run(book_id, name || '', author || '');

    return {
      success: true,
      insertedId: result.lastInsertRowid,
      id: result.lastInsertRowid
    };
  }

  /**
   * Update a book
   */
  updateBook(id, bookData) {
    this.open();

    const { name, author } = bookData;

    const stmt = this.db.prepare(`
      UPDATE books
      SET name = ?, author = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(name, author, id);

    return {
      success: true,
      matched: result.changes,
      modified: result.changes
    };
  }

  /**
   * Delete a book
   */
  deleteBook(id) {
    this.open();

    const stmt = this.db.prepare('DELETE FROM books WHERE id = ?');
    const result = stmt.run(id);

    return {
      success: true,
      deleted: result.changes
    };
  }

  /**
   * Get the highest book_id
   */
  getHighestBookId() {
    this.open();
    const result = this.db.prepare('SELECT MAX(book_id) as max_id FROM books').get();
    return result.max_id || 0;
  }

  /**
   * Count books
   */
  countBooks(filter = {}) {
    this.open();

    let query = 'SELECT COUNT(*) as count FROM books WHERE 1=1';
    const params = [];

    if (filter.name) {
      query += ' AND name LIKE ?';
      params.push(`%${filter.name}%`);
    }
    if (filter.author) {
      query += ' AND author LIKE ?';
      params.push(`%${filter.author}%`);
    }

    const result = this.db.prepare(query).get(...params);
    return result.count;
  }
}

// Create a singleton instance
let dbInstance = null;

function getBookDb() {
  if (!dbInstance) {
    dbInstance = new BookDatabase();
  }
  return dbInstance;
}

module.exports = {
  BookDatabase,
  getBookDb
};
