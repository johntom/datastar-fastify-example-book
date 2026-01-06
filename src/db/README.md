# Book Database Migration: MongoDB to SQLite

This directory contains scripts for managing the SQLite book database and migrating data from MongoDB.

## Overview

Successfully migrated **50 books** from MongoDB (`todo` database, `book` collection) to SQLite.

## Database Schema

### SQLite Books Table

```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER,
  mongo_id TEXT UNIQUE,
  name TEXT NOT NULL,
  author TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Fields:**
- `id`: Auto-incrementing primary key (SQLite internal)
- `book_id`: Original book ID from MongoDB
- `mongo_id`: MongoDB ObjectId (for reference and deduplication)
- `name`: Book title
- `author`: Book author
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Indexes:**
- `idx_books_name`: Index on book name
- `idx_books_author`: Index on author
- `idx_books_mongo_id`: Index on MongoDB ID

## Available Scripts

### 1. Initialize Database
Creates the SQLite database with the books table and indexes.

```bash
node src/db/init-sqlite.js
```

### 2. Migrate from MongoDB
Migrates all books from MongoDB to SQLite. Handles:
- String and numeric ID conversion
- Date object to ISO string conversion
- Duplicate detection (using `mongo_id`)

```bash
node src/db/migrate-mongo-to-sqlite.js
```

**Features:**
- Connects to MongoDB using URL from `.env` file (`MONGODB_URLtodo`)
- Creates/initializes SQLite database
- Migrates all books in a single transaction
- Handles data type conversions (string IDs, Date objects)
- Provides detailed progress logging
- Verifies migration success

### 3. Query Database
Displays all books and statistics from the SQLite database.

```bash
node src/db/query-sqlite.js
```

**Output:**
- Total book count
- All books (sorted by book_id)
- Books grouped by author

### 4. Debug Problem Records
Inspects specific book records from MongoDB (used during migration debugging).

```bash
node src/db/debug-problem-books.js
```

## Migration Results

```
MongoDB Source: 50 books
SQLite Target: 50 books
Success Rate: 100%
```

### Book Distribution by Author:
- jj: 32 books
- john tomaselli: 6 books
- J.R.R. Tolkien: 4 books
- Others: 8 books

## Configuration

Database paths are configured in `.env`:

```env
SQLITE_DB_PATH=./data/database.sqlite
MONGODB_URLtodo=mongodb://...
```

## Database Location

The SQLite database is stored at:
```
./data/database.sqlite
```

## Migration Details

The migration script handles edge cases:
1. **String IDs**: Converts string IDs (e.g., "1", "10") to integers
2. **Date Objects**: Converts MongoDB Date objects to ISO string format
3. **Missing Fields**: Uses `null` for missing book_id values
4. **Duplicates**: Uses `ON CONFLICT` to update existing records

## Re-running Migration

To re-run the migration (will recreate database):

```bash
rm -f data/database.sqlite
node src/db/migrate-mongo-to-sqlite.js
```

## Dependencies

- `better-sqlite3`: SQLite database driver
- `mongodb`: MongoDB client
- `dotenv`: Environment variable management

All dependencies are already installed via `npm install`.

## Sample Data

```
┌────┬─────────┬────────────────────────────┬─────────────────────────────┬──────────────────┐
│ id │ book_id │ mongo_id                   │ name                        │ author           │
├────┼─────────┼────────────────────────────┼─────────────────────────────┼──────────────────┤
│ 1  │ 1       │ 632fa917bf632c5b8a2551bf   │ Dune1112                    │ Frank Herbert1   │
│ 2  │ 2       │ 632fa931bf632c5b8a2551c0   │ Dune Messiah                │ Frank Herbert2   │
│ 3  │ 5       │ 632fa94ebf632c5b8a2551c3   │ The Fellowship of the Ring  │ J.R.R. Tolkien   │
│ 4  │ 6       │ 632fa957bf632c5b8a2551c4   │ The Two Towers              │ J.R.R. Tolkien   │
│ 5  │ 7       │ 632fa95fbf632c5b8a2551c5   │ The Return of the King      │ J.R.R. Tolkien   │
└────┴─────────┴────────────────────────────┴─────────────────────────────┴──────────────────┘
```

## Next Steps

To use SQLite in your Fastify application:

1. Update route handlers to query SQLite instead of MongoDB
2. Use `better-sqlite3` for synchronous queries
3. Or use `fastify-sqlite` plugin for integration
4. Consider creating API endpoints for SQLite data access

## Notes

- MongoDB connection URL credentials are hidden in logs for security
- Migration uses transactions for data integrity
- All 50 books migrated successfully with proper type conversions
- The `mongo_id` field allows tracking back to original MongoDB documents
