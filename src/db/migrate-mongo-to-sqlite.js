'use strict';

const { MongoClient } = require('mongodb');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./init-sqlite');

/**
 * Migrate book data from MongoDB to SQLite
 */
async function migrateBooks() {
  console.log('\n=== Starting MongoDB to SQLite Migration ===\n');

  // MongoDB connection URL from user's request
  const MONGODB_URL = process.env.MONGODB_URLtodo ||
    'mongodb://admin@SG-gtz-nano2-52001.servers.mongodirector.com:27017/admin?ssl=true&retryWrites=false&loadBalanced=false&connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-1&3t.uriVersion=3&3t.connection.name=SG-gtz-nano2-1-user%3Dpwjrt%40gtz.com-scDog-server&3t.databases=admin&3t.alwaysShowAuthDB=true&3t.alwaysShowDBFromUserRole=true&3t.sslTlsVersion=TLS';

  const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './data/database.sqlite';

  let mongoClient;
  let sqliteDb;

  try {
    // 1. Initialize SQLite database
    console.log('📦 Initializing SQLite database...');
    initDatabase(SQLITE_DB_PATH);

    // 2. Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    console.log('   URL:', MONGODB_URL.replace(/\/\/[^@]+@/, '//***:***@')); // Hide credentials in log

    mongoClient = new MongoClient(MONGODB_URL, {
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });

    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');

    // 3. Get the todo database and book collection
    const db = mongoClient.db('todo');
    const booksCollection = db.collection('book');

    // 4. Count documents
    const count = await booksCollection.countDocuments();
    console.log(`📚 Found ${count} books in MongoDB\n`);

    if (count === 0) {
      console.log('⚠️  No books to migrate');
      return;
    }

    // 5. Fetch all books
    console.log('📖 Fetching books from MongoDB...');
    const books = await booksCollection.find({}).toArray();
    console.log(`✅ Fetched ${books.length} books\n`);

    // 6. Open SQLite database
    sqliteDb = new Database(SQLITE_DB_PATH);

    // 7. Prepare insert statement
    const insertStmt = sqliteDb.prepare(`
      INSERT INTO books (book_id, mongo_id, name, author, created_at, updated_at)
      VALUES (@book_id, @mongo_id, @name, @author, @created_at, @updated_at)
      ON CONFLICT(mongo_id) DO UPDATE SET
        name = excluded.name,
        author = excluded.author,
        updated_at = excluded.updated_at
    `);

    // 8. Insert books in a transaction
    console.log('💾 Inserting books into SQLite...');
    const insertMany = sqliteDb.transaction((booksList) => {
      let inserted = 0;
      let updated = 0;

      for (const book of booksList) {
        try {
          // Convert id to integer (handle both string and number types)
          let bookId = null;
          if (book.id !== undefined && book.id !== null) {
            bookId = typeof book.id === 'string' ? parseInt(book.id, 10) : book.id;
          }

          // Convert dates to ISO strings (handle Date objects)
          const createdAt = book.createdAt
            ? (book.createdAt instanceof Date ? book.createdAt.toISOString() : book.createdAt)
            : new Date().toISOString();

          const updatedAt = book.updatedAt
            ? (book.updatedAt instanceof Date ? book.updatedAt.toISOString() : book.updatedAt)
            : new Date().toISOString();

          const result = insertStmt.run({
            book_id: bookId,
            mongo_id: book._id.toString(),
            name: book.name || '',
            author: book.author || '',
            created_at: createdAt,
            updated_at: updatedAt
          });

          if (result.changes > 0) {
            inserted++;
          }
        } catch (error) {
          console.error(`   ❌ Error inserting book ${book._id}:`, error.message);
          console.error(`       Book data:`, JSON.stringify(book, null, 2));
          updated++;
        }
      }

      return { inserted, updated };
    });

    const result = insertMany(books);
    console.log(`✅ Migration complete!`);
    console.log(`   📊 Inserted: ${result.inserted} books`);
    console.log(`   📊 Updated: ${result.updated} books\n`);

    // 9. Verify the data
    const sqliteCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM books').get();
    console.log(`✅ Verification: SQLite now has ${sqliteCount.count} books\n`);

    // 10. Show sample data
    console.log('📋 Sample books from SQLite:');
    const sampleBooks = sqliteDb.prepare('SELECT * FROM books LIMIT 5').all();
    console.table(sampleBooks);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    // Cleanup
    if (sqliteDb) {
      sqliteDb.close();
      console.log('\n🔒 SQLite connection closed');
    }
    if (mongoClient) {
      await mongoClient.close();
      console.log('🔒 MongoDB connection closed');
    }
  }

  console.log('\n=== Migration Complete ===\n');
}

// Run if executed directly
if (require.main === module) {
  migrateBooks()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateBooks };
