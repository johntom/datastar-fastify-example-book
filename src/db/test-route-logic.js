const { getBookDb } = require('./sqlite-helper');

// Simulate the /sqlbook route logic
const BOOKS_PER_PAGE = 10;
const db = getBookDb();

const books = db.getBooks({
  orderBy: 'book_id ASC',
  limit: BOOKS_PER_PAGE,
  skip: 0
});

const totalBooks = db.countBooks();
const hasMore = totalBooks > BOOKS_PER_PAGE;

console.log('=== SIMULATING /sqlbook ROUTE ===\n');
console.log(`BOOKS_PER_PAGE: ${BOOKS_PER_PAGE}`);
console.log(`books.length: ${books.length}`);
console.log(`totalBooks: ${totalBooks}`);
console.log(`hasMore: ${hasMore} (${totalBooks} > ${BOOKS_PER_PAGE})`);
console.log('\nTemplate will receive:');
console.log(`  books: [${books.length} items]`);
console.log(`  totalBooks: ${totalBooks}`);
console.log(`  hasMore: ${hasMore}`);
console.log('\nNunjucks will render:');
console.log(`  data-signals:hasMore="${hasMore}"`);

db.close();
