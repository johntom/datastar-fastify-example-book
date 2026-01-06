'use strict';

const Database = require('better-sqlite3');
require('dotenv').config();

/**
 * Query and display SQLite database contents
 */
function queryBooks() {
  const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './data/database.sqlite';
  const db = new Database(SQLITE_DB_PATH, { readonly: true });

  console.log('\n=== SQLite Books Database ===\n');

  // Get total count
  const countResult = db.prepare('SELECT COUNT(*) as count FROM books').get();
  console.log(`Total books: ${countResult.count}\n`);

  // Get all books
  console.log('All books:');
  const allBooks = db.prepare('SELECT * FROM books ORDER BY book_id').all();
  console.table(allBooks);

  // Get books by author
  console.log('\nBooks grouped by author:');
  const byAuthor = db.prepare(`
    SELECT author, COUNT(*) as count
    FROM books
    GROUP BY author
    ORDER BY count DESC
  `).all();
  console.table(byAuthor);

  db.close();
  console.log('\n✅ Query complete\n');
}

// Run if executed directly
if (require.main === module) {
  queryBooks();
}

module.exports = { queryBooks };
