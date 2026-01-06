'use strict';

const Database = require('better-sqlite3');
const path = require('path');

/**
 * Initialize SQLite database with books table
 */
function initDatabase(dbPath = './data/database.sqlite') {
  const db = new Database(dbPath, { verbose: console.log });

  // Create books table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER,
      mongo_id TEXT UNIQUE,
      name TEXT NOT NULL,
      author TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.exec(createTableSQL);
  console.log('✅ Books table created successfully');

  // Create indexes for better query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_books_name ON books(name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_books_mongo_id ON books(mongo_id)');

  console.log('✅ Indexes created successfully');

  db.close();
  console.log('✅ Database initialized at:', dbPath);
}

// Run if executed directly
if (require.main === module) {
  const dbPath = process.env.SQLITE_DB_PATH || './data/database.sqlite';
  console.log('Initializing SQLite database at:', dbPath);
  initDatabase(dbPath);
}

module.exports = { initDatabase };
