'use strict';

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './data/database.sqlite';
const CSV_PATH = process.argv[2] || 'C:\\Devel\\_Datastar\\_publishOnGitHub\\todo.csv';

/**
 * Parse CSV with quoted fields (handles multiline content in quotes)
 */
function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        // End of row
        if (char === '\r') i++; // Skip \n in \r\n
        currentRow.push(currentField);
        if (currentRow.some(f => f.trim())) { // Skip empty rows
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }

  // Don't forget the last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f.trim())) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Create todos table
 */
function createTodosTable(db) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT UNIQUE,
      title TEXT NOT NULL,
      notes TEXT,
      priority INTEGER,
      version TEXT,
      created_at DATETIME,
      updated_at DATETIME
    )
  `;

  db.exec(createTableSQL);
  console.log('✅ Todos table created successfully');

  // Create indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_todos_mongo_id ON todos(mongo_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)');
  console.log('✅ Indexes created successfully');
}

/**
 * Migrate CSV todos to SQLite
 */
function migrateTodos() {
  console.log('\n=== Starting CSV to SQLite Migration ===\n');
  console.log('📂 CSV Path:', CSV_PATH);
  console.log('📦 SQLite Path:', SQLITE_DB_PATH);

  // Check if CSV file exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ CSV file not found:', CSV_PATH);
    process.exit(1);
  }

  // Read CSV file
  console.log('\n📖 Reading CSV file...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(csvContent);

  if (rows.length < 2) {
    console.error('❌ CSV file is empty or has only header');
    process.exit(1);
  }

  // Extract header and data
  const header = rows[0];
  const dataRows = rows.slice(1);

  console.log('📋 CSV Header:', header);
  console.log(`📊 Found ${dataRows.length} todo items\n`);

  // Map header to column indices
  const colIndex = {};
  header.forEach((col, idx) => {
    colIndex[col.trim().replace(/^"/, '').replace(/"$/, '')] = idx;
  });

  console.log('📋 Column mapping:', colIndex);

  // Open SQLite database
  const db = new Database(SQLITE_DB_PATH);

  try {
    // Create table
    createTodosTable(db);

    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT INTO todos (mongo_id, title, notes, priority, version, created_at, updated_at)
      VALUES (@mongo_id, @title, @notes, @priority, @version, @created_at, @updated_at)
      ON CONFLICT(mongo_id) DO UPDATE SET
        title = excluded.title,
        notes = excluded.notes,
        priority = excluded.priority,
        version = excluded.version,
        updated_at = excluded.updated_at
    `);

    // Insert todos in a transaction
    console.log('\n💾 Inserting todos into SQLite...');
    let inserted = 0;
    let errors = 0;

    const insertMany = db.transaction((todos) => {
      for (const row of todos) {
        try {
          const mongoId = row[colIndex['_id']] || '';
          const title = row[colIndex['title']] || '';
          const notes = row[colIndex['notes']] || '';
          const priorityStr = row[colIndex['priority']] || '';
          const version = row[colIndex['version']] || '';
          const createdAt = row[colIndex['createdAt']] || null;
          const updatedAt = row[colIndex['updatedAt']] || null;

          // Parse priority as integer
          const priority = priorityStr ? parseInt(priorityStr, 10) : null;

          if (!mongoId) {
            console.log('   ⚠️ Skipping row with empty _id');
            continue;
          }

          insertStmt.run({
            mongo_id: mongoId,
            title: title,
            notes: notes,
            priority: isNaN(priority) ? null : priority,
            version: version,
            created_at: createdAt || null,
            updated_at: updatedAt || null
          });

          inserted++;
          console.log(`   ✅ Inserted: ${mongoId.substring(0, 12)}... - ${title.substring(0, 50)}...`);
        } catch (error) {
          errors++;
          console.error(`   ❌ Error inserting row:`, error.message);
        }
      }
    });

    insertMany(dataRows);

    console.log(`\n✅ Migration complete!`);
    console.log(`   📊 Inserted/Updated: ${inserted} todos`);
    console.log(`   ❌ Errors: ${errors}\n`);

    // Verify the data
    const sqliteCount = db.prepare('SELECT COUNT(*) as count FROM todos').get();
    console.log(`✅ Verification: SQLite now has ${sqliteCount.count} todos\n`);

    // Show sample data
    console.log('📋 Sample todos from SQLite:');
    const sampleTodos = db.prepare('SELECT id, mongo_id, substr(title, 1, 50) as title, priority FROM todos LIMIT 5').all();
    console.table(sampleTodos);

  } finally {
    db.close();
    console.log('\n🔒 SQLite connection closed');
  }

  console.log('\n=== Migration Complete ===\n');
}

// Run
migrateTodos();
