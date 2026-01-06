'use strict';

const { getBookDb } = require('../db/sqlite-helper');
const { PatchMode } = require('@johntom/datastar-fastify');

module.exports = async function (fastify, opts) {

  // SQLite Book view route
  const BOOKS_PER_PAGE = 10;

  fastify.get('/sqlbook', async (request, reply) => {
    try {
      // Fetch only first page of books from SQLite
      const db = getBookDb();
      const books = db.getBooks({
        orderBy: 'book_id ASC',
        limit: BOOKS_PER_PAGE,
        skip: 0
      });

      const totalBooks = db.countBooks();
      const hasMore = totalBooks > BOOKS_PER_PAGE;

      console.log('=== /sqlbook DEBUG ===');
      console.log(`BOOKS_PER_PAGE: ${BOOKS_PER_PAGE}`);
      console.log(`books.length: ${books.length}`);
      console.log(`totalBooks: ${totalBooks}`);
      console.log(`hasMore calculation: ${totalBooks} > ${BOOKS_PER_PAGE} = ${hasMore}`);
      console.log(`hasMore type: ${typeof hasMore}`);
      console.log(`Loaded ${books.length} of ${totalBooks} books from SQLite (page 1)`);

      const title = 'Datastar/Fastify/SQLite Book Manager v1.0';
      const starcounter = 9;

      return reply.view('sqlbook/_mainsqlbook.njk', {
        title: title,
        hello: 'Infinite Scroll,Live Data sync and lock for CHROME',
        books: books,
        starcounter: starcounter,
        totalBooks: totalBooks,
        hasMore: hasMore
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to load books from SQLite' });
    }
  });

  // Load more books for infinite scroll
  fastify.get('/load-more-sqlbooks', async (request, reply) => {
    try {
      console.log('=== LOAD MORE BOOKS CALLED ===');
      const page = parseInt(request.query.page, 10) || 2;
      const skip = (page - 1) * BOOKS_PER_PAGE;

      console.log(`📖 Loading more books - page ${page}, skip ${skip}`);

      const db = getBookDb();
      const books = db.getBooks({
        orderBy: 'book_id ASC',
        limit: BOOKS_PER_PAGE,
        skip: skip
      });

      const totalBooks = db.countBooks();
      const hasMore = (skip + books.length) < totalBooks;

      console.log(`📚 Loaded ${books.length} books`);
      console.log(`📊 Total books: ${totalBooks}, skip: ${skip}, hasMore: ${hasMore}`);

      // Generate HTML for new book rows
      const bookRows = books.map(book => `<tr id="book-${book.id}" data-book-id="${book.id}">
        <td>${book.id}</td>
        <td>${book.book_id}</td>
        <td>${book.name}</td>
        <td>${book.author}</td>
        <td>
          <button
              class="btn btn-primary btn-sm"
              data-on:click="
                  if($editingId && $editingId !== '${book.id}'){
                      if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                          @get('/api_view_sqlite/cancel-edit-sqlbook/' + $editingId);
                          $editingId = '${book.id}';
                          @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
                      }
                  }else{
                      $editingId = '${book.id}';
                      @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
                  }
              ">
              Edit
          </button>
          <button
              class="btn btn-info btn-sm"
              data-bs-toggle="modal"
              data-bs-target="#editBookModal"
              data-on:click="@get('/api_view_sqlite/load-edit-modal-sqlbook/${book.id}')">
              Edit Popup
          </button>
          <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view_sqlite/delete-sqlbook/${book.id}')}">Delete</button>
        </td>
      </tr>`).join('');

      // Use Datastar SSE to append books and update signals
      console.log('📡 Sending SSE response...');
      await reply.datastar(async (sse) => {
        if (books.length > 0) {
          console.log(`➕ Appending ${books.length} book rows to #book-list`);
          sse.patchElements(bookRows, {
            selector: "#book-list",
            mode: "append"
          });
        }

        console.log(`🔄 Updating signals: page=${page}, hasMore=${hasMore}, loading=false`);
        sse.patchSignals({
          page: page,
          hasMore: hasMore,
          loading: false
        });

        console.log(`✅ SSE response complete! Updated page to ${page}, hasMore: ${hasMore}`);
      });
    } catch (error) {
      fastify.log.error('Error loading more books:', error);
      await reply.datastar(async (sse) => {
        sse.patchSignals({ loading: false });
      });
      return reply.status(500).send({ error: 'Failed to load more books' });
    }
  });

  // Submit new book - Datastar version
  fastify.post("/submit-sqlbook", async (req, reply) => {
    try {
      console.log('=== SUBMIT NEW SQLITE BOOK CALLED ===');
      console.log('Submit request body:', JSON.stringify(req.body, null, 2));

      const title = req.body.title || req.body.newtitle || req.body.newTitle;
      const author = req.body.author || req.body.newauthor || req.body.newAuthor;

      console.log('✅ Extracted values:');
      console.log('   title:', title);
      console.log('   author:', author);

      if (!title || title === '') {
        console.error('❌ Book name is required');
        return reply.status(400).send({ error: 'Book name is required' });
      }

      const db = getBookDb();
      const highestId = db.getHighestBookId();
      const newBookId = highestId + 1;

      const book = {
        book_id: newBookId,
        name: title,
        author: author || ''
      };

      const result = db.createBook(book);
      book.id = result.insertedId;
      book._id = result.insertedId;

      console.log('Book created:', book);

      const bookRow = `<tr id="book-${book.id}" data-book-id="${book.id}">
<td>${book.id}</td>
<td>${book.book_id}</td>
<td>${book.name}</td>
<td>${book.author}</td>
<td>
    <button
        class="btn btn-primary btn-sm"
        data-on:click="
            if($editingId && $editingId !== '${book.id}'){
                if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                    @get('/api_view_sqlite/cancel-edit-sqlbook/${book.id}');
                    $editingId = '${book.id}';
                    @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
                }
            }else{
                $editingId = '${book.id}';
                @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
            }
        ">
        Edit
    </button>
    <button
        class="btn btn-info btn-sm"
        data-bs-toggle="modal"
        data-bs-target="#editBookModal"
        data-on:click="@get('/api_view_sqlite/load-edit-modal-sqlbook/${book.id}')">
        Edit Popup
    </button>
    <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view_sqlite/delete-sqlbook/${book.id}')}">Delete</button>
</td>
</tr>`;

      await reply.datastar(async (sse) => {
        console.log('📤 Sending SSE response with new book row');
        sse.patchElements(bookRow, {
          selector: "#book-list",
          mode: "append"
        });
        sse.executeScript(`
          console.log('✅ Book added successfully, closing modal...');
          $newTitle = '';
          $newAuthor = '';
          (() => {
            const modalEl = document.getElementById('addBookModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if(modal) modal.hide();
          })();
        `);
        console.log('✅ SSE response sent successfully');
      });

      // Broadcast to all other connected clients
      if (fastify.broadcastDataChange) {
        fastify.broadcastDataChange('book-added', {
          bookId: book.id,
          bookRow: bookRow
        });
      }
    } catch (error) {
      console.error('Error in submit-sqlbook:', error);
      return reply.status(500).send({ error: 'Failed to create book' });
    }
  });

  // Get edit form for a book
  fastify.get('/get-edit-form-sqlbook/:id', async (req, reply) => {
    const { id } = req.params;
    console.log('=== GET-EDIT-FORM-SQLBOOK CALLED ===');
    console.log('Request ID:', id);

    try {
      // Read signals to get clientId from Datastar
      const result = await req.readSignals();
      const signals = result.signals || {};

      // Get clientId from signals, or create a new one
      let clientId = signals.clientId;
      const isNew = !clientId;
      if (!clientId) {
        clientId = 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
      console.log('Client ID:', clientId, isNew ? '(NEW)' : '(EXISTING)');

      const lockResult = fastify.lockRecord(id, clientId, 'User');
      if (!lockResult.success) {
        console.log(`❌ Cannot edit - ${lockResult.message}`);
        await reply.datastar(async (sse) => {
          sse.executeScript(`alert('${lockResult.message}. Please wait until they finish editing.');`);
        });
        return;
      }

      const db = getBookDb();
      const book = db.getBookById(parseInt(id, 10));

      console.log('Book found:', book);

      if (!book) {
        console.error('❌ Book not found:', id);
        return reply.status(404).send({ error: 'Book not found' });
      }

      const editTitle = (book.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const editAuthor = (book.author || '').replace(/'/g, "\\'");

      const editForm = `<tr id="book-${book.id}" class="editing" data-signals:editTitle="'${editTitle}'" data-signals:editAuthor="'${editAuthor}'">
    <td>${book.id}</td>
    <td>${book.book_id}</td>
    <td><input name="title" data-bind:editTitle class="form-control"/></td>
    <td><input name="author" data-bind:editAuthor class="form-control"/></td>
    <td>
      <button class="btn btn-danger btn-sm" data-on:click="$editingId = ''; @get('/api_view_sqlite/cancel-edit-sqlbook/${book.id}')">
        Cancel
      </button>
      <button class="btn btn-success btn-sm" data-on:click="console.log('Saving book with:', $editTitle, $editAuthor); @put('/api_view_sqlite/update-sqlbook/${book.id}/${book.book_id}', {editTitle: $editTitle, editAuthor: $editAuthor})">
        Save
      </button>
    </td>
  </tr>`;

      await reply.datastar(async (sse) => {
        sse.patchElements(editForm, {
          selector: `#book-${book.id}`,
          mode: "outer"
        });
        // Send clientId back to client so it persists in Datastar signals
        sse.patchSignals({ clientId: clientId });
        console.log('✅ Edit form SSE response sent, clientId:', clientId);
      });
    } catch (error) {
      console.error('❌ Error in get-edit-form-sqlbook:', error);
      return reply.status(500).send({ error: 'Failed to load book for editing' });
    }
  });

  // Cancel edit
  fastify.get('/cancel-edit-sqlbook/:id', async (req, reply) => {
    const { id } = req.params;

    try {
      // Read clientId from signals
      const result = await req.readSignals();
      const clientId = result.signals?.clientId;
      console.log('Cancel edit - clientId:', clientId);
      if (clientId) fastify.unlockRecord(id, clientId);

      const db = getBookDb();
      const book = db.getBookById(parseInt(id, 10));

      if (!book) {
        console.error('Book not found:', id);
        return reply.status(404).send({ error: 'Book not found' });
      }

      const bookRow = `<tr id="book-${book.id}" data-book-id="${book.id}">
        <td>${book.id}</td>
        <td>${book.book_id}</td>
        <td>${book.name}</td>
        <td>${book.author}</td>
        <td>
          <button class="btn btn-primary btn-sm"
            data-on:click="
                if($editingId && $editingId !== '${book.id}'){
                    if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                        @get('/api_view_sqlite/cancel-edit-sqlbook/' + $editingId);
                        $editingId = '${book.id}';
                        @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
                    }
                }else{
                    $editingId = '${book.id}';
                    @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
                }
            ">
            Edit
          </button>
          <button class="btn btn-info btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#editBookModal"
            data-on:click="@get('/api_view_sqlite/load-edit-modal-sqlbook/${book.id}')">
            Edit Popup
          </button>
          <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view_sqlite/delete-sqlbook/${book.id}')}">Delete</button>
        </td>
      </tr>`;

      await reply.datastar(async (sse) => {
        sse.patchElements(bookRow, {
          selector: `#book-${book.id}`,
          mode: "outer"
        });
      });
    } catch (error) {
      console.error('Error in cancel-edit-sqlbook:', error);
      return reply.status(500).send({ error: 'Failed to cancel edit' });
    }
  });

  // Update book
  fastify.put('/update-sqlbook/:id/:bookid', async (req, reply) => {
    const { id, bookid } = req.params;

    try {
      console.log('=== UPDATE SQLITE BOOK CALLED ===');
      console.log('Update request body:', JSON.stringify(req.body, null, 2));

      // Read signals from Datastar request
      const result = await req.readSignals();
      console.log('Signals:', JSON.stringify(result.signals, null, 2));

      // Try signals first, then body
      const signals = result.signals || {};
      const title = signals.editTitle || req.body?.editTitle || req.body?.edittitle || req.body?.title;
      const author = signals.editAuthor || req.body?.editAuthor || req.body?.editauthor || req.body?.author;

      console.log('✅ Extracted values:');
      console.log('   title:', title);
      console.log('   author:', author);

      if (!title || !author) {
        console.error('❌ Missing title or author:', { title, author });
      }

      const db = getBookDb();
      db.updateBook(parseInt(id, 10), { name: title, author: author });

      // Unlock using clientId from signals
      const clientId = signals.clientId;
      console.log('=== INLINE UPDATE UNLOCK ===');
      console.log('Book ID:', id);
      console.log('Client ID from signals:', clientId);
      if (clientId) {
        const unlockResult = fastify.unlockRecord(id, clientId);
        console.log('Unlock result:', JSON.stringify(unlockResult));
      } else {
        console.log('⚠️ No clientId found in signals, cannot unlock!');
      }

      // Fetch fresh data
      const book = db.getBookById(parseInt(id, 10));

      const bookRow = `<tr id="book-${book.id}" data-book-id="${book.id}">
        <td>${book.id}</td>
        <td>${book.book_id}</td>
        <td>${book.name || 'N/A'}</td>
        <td>${book.author || 'N/A'}</td>
        <td>
          <button class="btn btn-primary btn-sm"
            data-on:click="
                if($editingId && $editingId !== '${book.id}'){
                    if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                        @get('/api_view_sqlite/cancel-edit-sqlbook/' + $editingId);
                        $editingId = '${book.id}';
                        @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
                    }
                }else{
                    $editingId = '${book.id}';
                    @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
                }
            ">
            Edit
          </button>
          <button class="btn btn-info btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#editBookModal"
            data-on:click="@get('/api_view_sqlite/load-edit-modal-sqlbook/${book.id}')">
            Edit Popup
          </button>
          <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view_sqlite/delete-sqlbook/${book.id}')}">Delete</button>
        </td>
      </tr>`;

      await reply.datastar(async (sse) => {
        sse.patchElements(bookRow, {
          selector: `#book-${book.id}`,
          mode: "outer"
        });
        sse.patchSignals({ editingId: '' });
      });

      // Broadcast to all other connected clients
      if (fastify.broadcastDataChange) {
        fastify.broadcastDataChange('book-updated', {
          bookId: book.id,
          bookRow: bookRow
        });
      }

      console.log('✅ Update complete!');
    } catch (error) {
      console.error('Error in update-sqlbook:', error);
      return reply.status(500).send({ error: 'Failed to update book' });
    }
  });

  // Load book data into edit modal
  fastify.get('/load-edit-modal-sqlbook/:id', async (req, reply) => {
    const { id } = req.params;
    console.log('=== LOAD-EDIT-MODAL-SQLBOOK CALLED ===');
    console.log('Book ID:', id);

    try {
      // Read signals to get clientId from Datastar
      const result = await req.readSignals();
      const signals = result.signals || {};

      // Get clientId from signals, or create a new one
      let clientId = signals.clientId;
      const isNew = !clientId;
      if (!clientId) {
        clientId = 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
      console.log('Client ID:', clientId, isNew ? '(NEW)' : '(EXISTING)');

      const lockResult = fastify.lockRecord(id, clientId, 'User');
      if (!lockResult.success) {
          console.log(`❌ Cannot edit - ${lockResult.message}`);
          await reply.datastar(async (sse) => {
            sse.executeScript(`
              (() => {
                alert('${lockResult.message}. Please wait until they finish editing.');
                const modalEl = document.getElementById('editBookModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if(modal) modal.hide();
              })();
            `);
          });
          return;
        }

      const db = getBookDb();
      const book = db.getBookById(parseInt(id, 10));

      console.log('Book found for modal:', book);

      if (!book) {
        console.error('❌ Book not found:', id);
        return reply.status(404).send({ error: 'Book not found' });
      }

      await reply.datastar(async (sse) => {
        const escapedTitleHTML = (book.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const escapedAuthorHTML = (book.author || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        // Send clientId back to client so it persists in Datastar signals
        sse.patchSignals({
          editModalId: book.id,
          editModalBookId: book.book_id,
          editModalTitle: book.name || '',
          editModalAuthor: book.author || '',
          clientId: clientId
        });
        console.log('✅ Modal loaded, clientId:', clientId);

        const formHtml = `<form id="editBookForm">
            <div class="mb-3">
              <label for="editBookTitle" class="form-label">Book Title <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                id="editBookTitle"
                name="title"
                placeholder="Enter book title"
                value="${escapedTitleHTML}"
                data-on:input="$editModalTitle = el.value"
                required
              />
            </div>
            <div class="mb-3">
              <label for="editBookAuthor" class="form-label">Author <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                id="editBookAuthor"
                name="author"
                placeholder="Enter author name"
                value="${escapedAuthorHTML}"
                data-on:input="$editModalAuthor = el.value"
                required
              />
            </div>
          </form>`;

        sse.patchElements(formHtml, {
          selector: '#editBookForm',
          mode: 'outer'
        });

        console.log('✅ Form patched with values');
      });
    } catch (error) {
      console.error('❌ Error in load-edit-modal-sqlbook:', error);
      return reply.status(500).send({ error: 'Failed to load book for editing' });
    }
  });

  // Update book from modal
  fastify.put('/update-modal-sqlbook/:id/:bookid', async (req, reply) => {
    const { id, bookid } = req.params;

    try {
      console.log('=== UPDATE-MODAL SQLITE BOOK CALLED ===');
      console.log('Update request body:', JSON.stringify(req.body, null, 2));

      // Read signals from Datastar request
      const result = await req.readSignals();
      console.log('Signals:', JSON.stringify(result.signals, null, 2));

      // Try signals first, then body
      const signals = result.signals || {};
      const title = signals.editTitle || signals.editModalTitle || req.body?.editTitle || req.body?.editModalTitle || req.body?.edittitle || req.body?.title;
      const author = signals.editAuthor || signals.editModalAuthor || req.body?.editAuthor || req.body?.editModalAuthor || req.body?.editauthor || req.body?.author;

      console.log('✅ Extracted values:');
      console.log('   title:', title);
      console.log('   author:', author);

      if (!title || !author) {
        console.error('❌ Missing title or author:', { title, author });
        return reply.status(400).send({ error: 'Title and author are required' });
      }

      const db = getBookDb();
      db.updateBook(parseInt(id, 10), { name: title, author: author });

      // Unlock using clientId from signals
      const clientId = signals.clientId;
      console.log('=== MODAL UPDATE UNLOCK ===');
      console.log('Book ID:', id);
      console.log('Client ID from signals:', clientId);
      if (clientId) {
        const unlockResult = fastify.unlockRecord(id, clientId);
        console.log('Unlock result:', JSON.stringify(unlockResult));
      } else {
        console.log('⚠️ No clientId found in signals, cannot unlock!');
      }

      const book = db.getBookById(parseInt(id, 10));

      const bookRow = `<tr id="book-${book.id}" data-book-id="${book.id}">
        <td>${book.id}</td>
        <td>${book.book_id}</td>
        <td>${book.name}</td>
        <td>${book.author}</td>
        <td>
          <button class="btn btn-primary btn-sm"
            data-on:click="
                if($editingId && $editingId !== '${book.id}'){
                    if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                        @get('/api_view_sqlite/cancel-edit-sqlbook/' + $editingId);
                        $editingId = '${book.id}';
                        @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
                    }
                }else{
                    $editingId = '${book.id}';
                    @get('/api_view_sqlite/get-edit-form-sqlbook/${book.id}');
                }
            ">
            Edit
          </button>
          <button class="btn btn-info btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#editBookModal"
            data-on:click="@get('/api_view_sqlite/load-edit-modal-sqlbook/${book.id}')">
            Edit Popup
          </button>
          <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view_sqlite/delete-sqlbook/${book.id}')}">Delete</button>
        </td>
      </tr>`;

      await reply.datastar(async (sse) => {
        sse.patchElements(bookRow, {
          selector: `#book-${book.id}`,
          mode: "outer"
        });
        // Reset modal signals so next edit popup works
        sse.patchSignals({
          editModalId: '',
          editModalBookId: '',
          editModalTitle: '',
          editModalAuthor: '',
          editingId: ''
        });
        sse.executeScript(`
          (() => {
            const modalEl = document.getElementById('editBookModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if(modal) modal.hide();
            // Clear the form inputs
            const form = document.getElementById('editBookForm');
            if(form) form.reset();
          })();
        `);
      });

      // Broadcast to all other connected clients
      if (fastify.broadcastDataChange) {
        fastify.broadcastDataChange('book-updated', {
          bookId: book.id,
          bookRow: bookRow
        });
      }

      console.log('✅ Update complete!');
    } catch (error) {
      console.error('Error in update-modal-sqlbook:', error);
      return reply.status(500).send({ error: 'Failed to update book' });
    }
  });

  // Unlock book (for modal cancel)
  fastify.post('/unlock-sqlbook/:id', async (req, reply) => {
    const { id } = req.params;
    console.log('Unlock called for book:', id);

    // Read clientId from signals
    const result = await req.readSignals();
    const clientId = result.signals?.clientId;
    console.log('Unlock - clientId:', clientId);
    if (clientId) fastify.unlockRecord(id, clientId);

    await reply.datastar(async (sse) => {
      sse.patchSignals({ unlockSuccess: true })
    });
  });

  // Delete book
  fastify.delete('/delete-sqlbook/:id', async (req, reply) => {
    const { id } = req.params;

    try {
      console.log('Deleting SQLite book:', id);

      const db = getBookDb();
      db.deleteBook(parseInt(id, 10));

      await reply.datastar(async (sse) => {
        sse.removeElements(`#book-${id}`);
      });

      // Broadcast to all other connected clients
      if (fastify.broadcastDataChange) {
        fastify.broadcastDataChange('book-deleted', {
          bookId: id
        });
      }
    } catch (error) {
      console.error('Error in delete-sqlbook:', error);
      return reply.status(500).send({ error: 'Failed to delete book' });
    }
  });

};

module.exports.autoPrefix = '/api_view_sqlite';
