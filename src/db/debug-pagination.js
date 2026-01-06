const { getBookDb } = require('./sqlite-helper');

const db = getBookDb();

console.log('=== DATABASE DEBUG ===\n');

// Count total books
const totalBooks = db.countBooks();
console.log(`Total books in database: ${totalBooks}`);

// Get first 10 books
const firstPage = db.getBooks({
  orderBy: 'book_id ASC',
  limit: 10,
  skip: 0
});

console.log(`\nFirst page (limit=10, skip=0): ${firstPage.length} books`);
if (firstPage.length > 0) {
  console.log(`  First book: ID=${firstPage[0].id}, book_id=${firstPage[0].book_id}, name=${firstPage[0].name}`);
  console.log(`  Last book:  ID=${firstPage[firstPage.length-1].id}, book_id=${firstPage[firstPage.length-1].book_id}, name=${firstPage[firstPage.length-1].name}`);
}

// Check hasMore calculation
const BOOKS_PER_PAGE = 10;
const hasMore = totalBooks > BOOKS_PER_PAGE;
console.log(`\nhasMore calculation: ${totalBooks} > ${BOOKS_PER_PAGE} = ${hasMore}`);

// Get second page to verify pagination works
const secondPage = db.getBooks({
  orderBy: 'book_id ASC',
  limit: 10,
  skip: 10
});

console.log(`\nSecond page (limit=10, skip=10): ${secondPage.length} books`);
if (secondPage.length > 0) {
  console.log(`  First book: ID=${secondPage[0].id}, book_id=${secondPage[0].book_id}, name=${secondPage[0].name}`);
  console.log(`  Last book:  ID=${secondPage[secondPage.length-1].id}, book_id=${secondPage[secondPage.length-1].book_id}, name=${secondPage[secondPage.length-1].name}`);
}

db.close();
