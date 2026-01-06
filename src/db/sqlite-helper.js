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
      INSERT INTO books (book_id, name, author, createdAt, updatedAt)
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
      SET name = ?, author = ?, updatedAt = datetime('now')
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

/**
 * SQLite Database Helper for Todos
 */
class TodoDatabase {
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
      // Ensure todos table has completed column
      this.ensureCompletedColumn();
    }
    return this.db;
  }

  /**
   * Ensure the completed column exists in todos table
   */
  ensureCompletedColumn() {
    try {
      // Check if completed column exists
      const tableInfo = this.db.prepare("PRAGMA table_info(todos)").all();
      const hasCompleted = tableInfo.some(col => col.name === 'completed');

      if (!hasCompleted) {
        this.db.exec('ALTER TABLE todos ADD COLUMN completed INTEGER DEFAULT 0');
        console.log('✅ Added completed column to todos table');
      }
    } catch (error) {
      console.log('Note: Could not check/add completed column:', error.message);
    }
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
   * Get all todos with optional filter
   */
  getTodos(options = {}) {
    this.open();

    const {
      filter = 'all',
      orderBy = 'id DESC',
      limit = 0,
      skip = 0
    } = options;

    let query = 'SELECT * FROM todos WHERE 1=1';
    const params = [];

    // Apply filter
    if (filter === 'active') {
      query += ' AND (completed = 0 OR completed IS NULL)';
    } else if (filter === 'completed') {
      query += ' AND completed = 1';
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

    const rows = this.db.prepare(query).all(...params);

    // Map to expected format
    return rows.map(row => ({
      id: row.id.toString(),
      text: row.title || '',
      priority: row.priority,
      completed: row.completed === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  /**
   * Get a single todo by ID
   */
  getTodoById(id) {
    this.open();
    const row = this.db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

    if (!row) return null;

    return {
      id: row.id.toString(),
      text: row.title || '',
      priority: row.priority,
      completed: row.completed === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  /**
   * Create a new todo
   */
  createTodo(todoData) {
    this.open();

    const { text, notes = '', priority = null, completed = false } = todoData;

    const stmt = this.db.prepare(`
      INSERT INTO todos (title, text, priority, completed, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = stmt.run(text, notes, priority, completed ? 1 : 0);

    return {
      success: true,
      id: result.lastInsertRowid.toString(),
      todo: {
        id: result.lastInsertRowid.toString(),
        text,
        priority,
        completed,
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * Update a todo
   */
  updateTodo(id, todoData) {
    this.open();

    const { text, notes, priority, completed } = todoData;

    const stmt = this.db.prepare(`
      UPDATE todos
      SET title = COALESCE(?, title),
          text = COALESCE(?, text),
          priority = COALESCE(?, priority),
          completed = COALESCE(?, completed),
          updatedAt = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(
      text !== undefined ? text : null,
      notes !== undefined ? notes : null,
      priority !== undefined ? priority : null,
      completed !== undefined ? (completed ? 1 : 0) : null,
      id
    );

    return {
      success: true,
      matched: result.changes,
      modified: result.changes
    };
  }

  /**
   * Toggle todo completion
   */
  toggleTodo(id) {
    this.open();

    const stmt = this.db.prepare(`
      UPDATE todos
      SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END,
          updatedAt = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(id);

    // Get updated todo
    const todo = this.getTodoById(id);

    return {
      success: true,
      modified: result.changes,
      todo
    };
  }

  /**
   * Delete a todo
   */
  deleteTodo(id) {
    this.open();

    const stmt = this.db.prepare('DELETE FROM todos WHERE id = ?');
    const result = stmt.run(id);

    return {
      success: true,
      deleted: result.changes
    };
  }

  /**
   * Clear completed todos
   */
  clearCompleted() {
    this.open();

    const stmt = this.db.prepare('DELETE FROM todos WHERE completed = 1');
    const result = stmt.run();

    return {
      success: true,
      deleted: result.changes
    };
  }

  /**
   * Count todos
   */
  countTodos(filter = 'all') {
    this.open();

    let query = 'SELECT COUNT(*) as count FROM todos';

    if (filter === 'active') {
      query += ' WHERE (completed = 0 OR completed IS NULL)';
    } else if (filter === 'completed') {
      query += ' WHERE completed = 1';
    }

    const result = this.db.prepare(query).get();
    return result.count;
  }

  /**
   * Get todo stats
   */
  getStats() {
    this.open();

    const total = this.countTodos('all');
    const active = this.countTodos('active');
    const completed = total - active;

    return { total, active, completed };
  }
}

// Create singleton instances
let todoDbInstance = null;

function getTodoDb() {
  if (!todoDbInstance) {
    todoDbInstance = new TodoDatabase();
  }
  return todoDbInstance;
}

module.exports = {
  BookDatabase,
  getBookDb,
  TodoDatabase,
  getTodoDb
};
