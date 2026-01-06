'use strict'
const messages = [
  "Stop overcomplicating it.",
  "Backend controls state.",
  "Props down, Events up.",
  "Flamegraphs don't care about your feelings.",
  "Practice yourself, for heaven's sake, in little things; and thence proceed to greater",
  "Freedom is the only worthy goal in life. It is won by disregarding things that lie beyond our control.",
  "Be the change you want to see.",
  "https://data-star.dev/ 🚀",
];

const getRandomMessage = () => messages[Math.floor(Math.random() * messages.length)];

// Helper functions for rendering todos
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function renderTodoItem(todo) {
  return `
    <li id="todo-${todo.id}" class="todo-item ${todo.completed ? 'completed' : ''}">
      <input
        type="checkbox"
        ${todo.completed ? 'checked' : ''}
        data-on:change="@post('/api/todosapp/${todo.id}/toggle')"
      />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <button
        class="delete-btn"
        data-on:click="@delete('/api/todosapp/${todo.id}')"
      >×</button>
    </li>
  `;
}

function renderTodoList(todos, filter = 'all') {
  let filtered = Array.from(todos.values());

  if (filter === 'active') {
    filtered = filtered.filter(t => !t.completed);
  } else if (filter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  if (filtered.length === 0) {
    return '<li id="empty-state" class="empty">No todos yet!</li>';
  }

  return filtered.map(renderTodoItem).join('');
}

function renderFooter(todos, activeFilter) {
  const total = todos.size;
  const active = Array.from(todos.values()).filter(t => !t.completed).length;
  const completed = total - active;

  return `
    <footer id="todo-footer" class="footer">
      <span class="count">${active} item${active !== 1 ? 's' : ''} left</span>
      <div class="filters">
        <button
          class="${activeFilter === 'all' ? 'active' : ''}"
          data-on:click="@post('/api/todosapp/filter/all')"
        >All</button>
        <button
          class="${activeFilter === 'active' ? 'active' : ''}"
          data-on:click="@post('/api/todosapp/filter/active')"
        >Active</button>
        <button
          class="${activeFilter === 'completed' ? 'active' : ''}"
          data-on:click="@post('/api/todosapp/filter/completed')"
        >Completed</button>
      </div>
      ${completed > 0 ? `
        <button
          class="clear-completed"
          data-on:click="@post('/api/todosapp/clear-completed')"
        >Clear completed (${completed})</button>
      ` : ''}
    </footer>
  `;
}

module.exports = async function (fastify, opts) {
  // Minify HTML output
  const minifyHtml = (payload) => {
    if (typeof payload === 'string') {
      return htmlMinifier.minify(payload, {
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true
      })
    }
    return payload
  }
 fastify.get('/toast', async (request, reply) => {
    const data = {
      title: 'toast Form',
      formAction: 'toast',
      csrfToken: generateCsrfToken(request)
    }
    const csrfToken = data.csrfToken
    //   co
 await reply.view('./toast/toast.njk', data)

  })
// const messages = [
   fastify.get('/helloworld', async (request, reply) => {
     const data = {
       title: 'helloworld example',
       formAction: 'helloworld',
       csrfToken: generateCsrfToken(request)
     }
     const csrfToken = data.csrfToken
//     //   co
  await reply.view('./helloworld/helloworld.njk', data)

  })

  fastify.get('/basic', async (request, reply) => {
    try {
      // Fetch tasks from the API
      let tasksResponse = await fastify.inject({
        method: 'get',
        url: `/api/tasks`
      }).then((res) => res.json());

      const tasksHtml = tasksResponse.tasksHtml || '';

      const data = {
        title: 'Basic Examples',
        formAction: 'basic',
        csrfToken: generateCsrfToken(request),
        initialTasksHtml: tasksHtml
      }

      await reply.view('./basic/basic.njk', data)
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to load basic examples' });
    }
  })

  fastify.get('/todo', async (request, reply) => {
    try {
      // Fetch todos from the API
      let todosResponse = await fastify.inject({
        method: 'get',
        url: `/api/todosapp`
      }).then((res) => res.json());

      const todosArray = todosResponse.todos || [];

      // Convert array to Map for rendering functions
      const todosMap = new Map();
      todosArray.forEach(todo => {
        todosMap.set(todo.id, todo);
      });

      // Render initial HTML
      const initialTodoList = renderTodoList(todosMap, 'all');
      const initialFooter = renderFooter(todosMap, 'all');

      const data = {
        title: 'Todo App',
        formAction: 'todo',
        csrfToken: generateCsrfToken(request),
        initialTodoList: initialTodoList,
        initialFooter: initialFooter
      }

      await reply.view('./todo/todo.njk', data)
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to load todos' });
    }
  })




//   fastify.get('/froi', async (request, reply) => {
//     const data = {
//       title: 'Froi Form',
//       formAction: 'froi',
//       csrfToken: generateCsrfToken(request)
//     }
//     const csrfToken = data.csrfToken
//     //   co
//  await reply.view('./froi/froi.njk', data)

//   })







//   fastify.get('/uploader', async (request, reply) => {
//     const data = {
//       title: 'Froi Form',
//       formAction: 'froi',
//       csrfToken: generateCsrfToken(request)
//     }
//     const csrfToken = data.csrfToken
//     //   co
//  await reply.view('./uploader/uploader.njk', data)

//   })


  fastify.post("/submitbook", async (request, reply) => {
    console.log('in /submitbook', request.body);
    //.a1_Employer_Name.value)
    const book = {
      author: request.body.author,
      title: request.body.title,
      name: request.body.name
    };
    console.log(book.author, book.title, book.name)
    // console.log(book.addr)

  })
    fastify.post("/foo", async (request, reply) => {
      console.log('in /foo', request.body);
      reply.send( '' ) 
    })
 


   
    fastify.post('/validate-email', async (request, reply) => {
      const { email } = request.body

      // Basic validation - if empty, don't show error yet
      if (!email || email.trim() === '') {
        return ''
      }

      // Validate email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      const isValid = emailRegex.test(email)

      if (!isValid) {
        return '<div class="validation-message invalid">Please enter a valid email address</div>'
      }

      return '<div class="validation-message valid">Email looks good!</div>'
    })

 
// Simple CSRF protection
function generateCsrfToken(request) {
  const token = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)

  if (!request.session) {
    request.session = {}
  }

  request.session.csrfToken = token
  return token
}

function validateCsrfToken(request) {
  if (!request.session || !request.session.csrfToken) {
    return false
  }

  return request.body.csrfToken === request.session.csrfToken
}

  // Test endpoint to verify Datastar SSE is working
  fastify.get('/test-sse', async (req, reply) => {
    try {
      console.log('Test SSE endpoint hit');
      const testHtml = '<div class="alert alert-success">SSE is working!</div>';

      await reply.datastar(async (sse) => {
        console.log('Inside test SSE handler');
        sse.patchElements(testHtml, {
          selector: "#book-list",
          mode: "prepend"
        });
        console.log('Test SSE patchElements called');
      });

      console.log('Test SSE response sent');
    } catch (error) {
      console.error('Error in test-sse:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // Book view route - based on htmx-medium reference
  let books = []; // In-memory books array for this session
  const BOOKS_PER_PAGE = 10; // Number of books to load per page

 fastify.get('/book', async (request, reply) => {
    try {
      // Fetch books from the API
      let booksResponse = await fastify.inject({
        method: 'get',
        url: `/api/todo/book`
      }).then((res) => res.json());

      books = booksResponse.data || [];
      const newbooks = books;

      // Create additional data for the view
      const arry = [];
      arry.push({ "val": 'test1' });
      arry.push({ "val": 'test2' });

      const title = 'Book Recommendations ';
      const starcounter = 9;

      // return reply.view('mongobook\mongobook.njk', {
      await reply.view('./mongobook/mainbook.njk', {
        title: title,
        hello: 'Datastar/Fastify/Mongodon/Nunjucks in action',
        books: books,
        starcounter: starcounter,
        arry: arry,
        newbooks: newbooks
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to load books' });
    }
  });
  fastify.get('/book_infinate', async (request, reply) => {
    try {
      // Fetch initial books from the API (first page only)
      let booksResponse = await fastify.inject({
        method: 'get',
        url: `/api/todo/book?limit=${BOOKS_PER_PAGE}`
      }).then((res) => res.json());

      books = booksResponse.data || [];
      const newbooks = books.slice(0, BOOKS_PER_PAGE); // Only show first page initially

      // Create additional data for the view
      const arry = [];
      arry.push({ "val": 'test1' });
      arry.push({ "val": 'test2' });

      const title = 'Book Recommendations v124';
      const starcounter = 9;

      // Calculate if there are more books to load
      const totalBooksResponse = await fastify.inject({
        method: 'get',
        url: `/api/todo/book`
      }).then((res) => res.json());

      const totalBooks = totalBooksResponse.data?.length || 0;
      const hasMoreBooks = totalBooks > BOOKS_PER_PAGE;

    await reply.view('./mongobook/mainbook_infinite.njk', {
        title: title,
        hello: 'Htmx/Fastify/Mongodon/Nunjucks in action - Not tested Infinite Scroll Enabled',
        books: newbooks, // Only first page
        starcounter: starcounter,
        arry: arry,
        newbooks: newbooks,
        hasMoreBooks: hasMoreBooks,
        totalBooks: totalBooks
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to load books' });
    }
  });

  // Load more books for infinite scroll
  fastify.get('/load-more-books', async (request, reply) => {
    try {
      const page = parseInt(request.query.page) || 1;
      const nextPage = page + 1;

      console.log(`Loading more books - page ${nextPage}`);

      // Fetch the next page of books
      let booksResponse = await fastify.inject({
        method: 'get',
        url: `/api/todo/book?limit=${BOOKS_PER_PAGE}&skip=${page * BOOKS_PER_PAGE}`
      }).then((res) => res.json());

      const newBooks = booksResponse.data || [];
      const hasMore = newBooks.length === BOOKS_PER_PAGE;

      console.log(`Loaded ${newBooks.length} books, hasMore: ${hasMore}`);

      // Generate HTML for new book rows
      const bookRows = newBooks.map(book => `
        <tr id="book-${book._id}" data-book-id="${book._id}">
          <td>${book._id}</td>
          <td>${book.id}</td>
          <td>${book.name}</td>
          <td>${book.author}</td>
          <td>
            <button
              class="btn btn-primary btn-sm"
              data-on:click="
                if($editingId && $editingId !== '${book._id}'){
                  if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                    @get('/api_view/cancel-edit/' + $editingId);
                    $editingId = '${book._id}';
                    @get('/api_view/get-edit-form/${book._id}');
                  }
                }else{
                  $editingId = '${book._id}';
                  @get('/api_view/get-edit-form/${book._id}');
                }
              ">
              Edit
            </button>
            <button
              class="btn btn-info btn-sm"
              data-bs-toggle="modal"
              data-bs-target="#editBookModal"
              data-on:click="@get('/api_view/load-edit-modal/${book._id}')">
              Edit Popup
            </button>
            <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view/delete/${book._id}')}">Delete</button>
          </td>
        </tr>
      `).join('');

      // Use Datastar SSE to append books and update signals
      await reply.datastar(async (sse) => {
        if (newBooks.length > 0) {
          sse.patchElements(bookRows, {
            selector: "#book-list",
            mode: "append"
          });
        }

        sse.patchSignals({
          page: nextPage,
          hasMore: hasMore,
          loading: false
        });

        console.log(`Updated page to ${nextPage}, hasMore: ${hasMore}`);
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
  fastify.post("/submit", async (req, reply) => {
    try {
      console.log('=== SUBMIT NEW BOOK CALLED ===');
      console.log('Submit request body:', JSON.stringify(req.body, null, 2));

      // Handle all variations of field names from Datastar
      const title = req.body.title || req.body.newtitle || req.body.newTitle;
      const author = req.body.author || req.body.newauthor || req.body.newAuthor;

      console.log('✅ Extracted values:');
      console.log('   title:', title);
      console.log('   author:', author);

      const book = {
        name: title,
        author: author,
      };

      if (!book.name || book.name === '') {
        console.error('❌ Book name is required');
        return reply.status(400).send({ error: 'Book name is required' });
      }

      let highrec = await fastify.inject({
        method: 'get',
        url: `/api/todo/book?orderBy={"_id":-1}&limit=1`
      }).then((res) => res.json());

      console.log('Highest record:', highrec);

      if (!highrec || !highrec.data || !highrec.data[0]) {
        // No books exist yet, start with id 1
        book.id = 1;
      } else {
        highrec = highrec.data[0];
        let newid = (highrec.id * 1) + 1;
        book.id = newid * 1;
      }

      let headobj = { 'Content-Type': `application/json` };

      await fastify.inject({
        method: 'post',
        headers: headobj,
        payload: book,
        url: `/api/todo/book`
      }).then(async (x) => {
        let aa = JSON.parse(x.payload);
        let _id = aa._id;

        book._id = _id;
        books.push(book);

        console.log('Book created:', book);

        const bookRow = `<tr id="book-${book._id}" data-book-id="${book._id}">
<td>${book._id}</td>
<td>${book.id}</td>
<td>${book.name}</td>
<td>${book.author}</td>
<td>
    <button
        class="btn btn-primary btn-sm"
        data-on:click="
            if($editingId && $editingId !== '${book._id}'){
                if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                    @get('/api_view/cancel-edit/' + $editingId);
                    $editingId = '${book._id}';
                    @get('/api_view/get-edit-form/${book._id}');
                }
            }else{
                $editingId = '${book._id}';
                @get('/api_view/get-edit-form/${book._id}');
            }
        ">
        Edit
    </button>
    <button
        class="btn btn-info btn-sm"
        data-bs-toggle="modal"
        data-bs-target="#editBookModal"
        data-on:click="@get('/api_view/load-edit-modal/${book._id}')">
        Edit Popup
    </button>
    <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view/delete/${book._id}')}">Delete</button>
</td>
</tr>`;

        await reply.datastar(async (sse) => {
          console.log('📤 Sending SSE response with new book row');
          sse.patchElements(bookRow, {
            selector: "#book-list",
            mode: "append"
          });
          // Execute script to close modal and reset signals
          sse.executeScript(`
            console.log('✅ Book added successfully, closing modal...');
            $newTitle = '';
            $newAuthor = '';
            const modalEl = document.getElementById('addBookModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if(modal) modal.hide();
          `);
          console.log('✅ SSE response sent successfully');
        });
      });
    } catch (error) {
      console.error('Error in submit:', error);
      return reply.status(500).send({ error: 'Failed to create book' });
    }
  });

  // Get edit form for a book - Datastar version
  fastify.get('/get-edit-form/:id', async (req, reply) => {
    const { id } = req.params;
    console.log('=== GET-EDIT-FORM CALLED ===');
    console.log('Request ID:', id);
    console.log('Request headers:', req.headers);

    try {
      let response = await fastify.inject({
        method: 'get',
        url: `/api/todo/book/${id}`
      }).then((res) => res.json());

      console.log('Book API response:', JSON.stringify(response, null, 2));

      if (!response || !response.data) {
        console.error('❌ Book not found:', id);
        return reply.status(404).send({ error: 'Book not found' });
      }

      const book = response.data;
      console.log('✅ Book found:', book);

      // Escape values and wrap in quotes for JavaScript string literals
      // data-signals expects JavaScript expressions, so "data-signals:x='value'" becomes invalid JS
      // Instead use: data-signals:x="'value'" which evaluates to the string 'value'
      const editTitle = (book.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const editAuthor = (book.author || '').replace(/'/g, "\\'");

      const editForm = `<tr id="book-${book._id}" class="editing" data-signals:editTitle="'${editTitle}'" data-signals:editAuthor="'${editAuthor}'">
    <td>${book._id}</td>
    <td>${book.id}</td>
    <td><input name="title" data-bind:editTitle class="form-control"/></td>
    <td><input name="author" data-bind:editAuthor class="form-control"/></td>
    <td>
      <button class="btn btn-danger btn-sm" data-on:click="$editingId = ''; @get('/api_view/cancel-edit/${book._id}')">
        Cancel
      </button>
      <button class="btn btn-success btn-sm" data-on:click="console.log('Saving book with:', $editTitle, $editAuthor); @put('/api_view/update/${book._id}/${book.id}', {editTitle: $editTitle, editAuthor: $editAuthor})">
        Save
      </button>
    </td>
  </tr>`;

      console.log('📝 Selector:', `#book-${book._id}`);
      console.log('📝 Edit form HTML length:', editForm.length);
      console.log('📝 First 300 chars:', editForm.substring(0, 300));
      console.log('📝 Check data-signals (should be wrapped in quotes):', editForm.match(/data-signals:[^>]+/g));
      console.log('📝 editTitle value:', `'${editTitle}'`);
      console.log('📝 editAuthor value:', `'${editAuthor}'`);

      await reply.datastar(async (sse) => {
        console.log('🔄 Inside datastar SSE handler');
        console.log('🎯 Attempting to patch selector:', `#book-${book._id}`);

        // Use "outer" mode (not "outerHTML") - replaces the entire element
        sse.patchElements(editForm, {
          selector: `#book-${book._id}`,
          mode: "outer"
        });
        console.log('✅ patchElements called with "outer" mode (replaces outerHTML)');
      });

      console.log('✅ Edit form SSE response sent successfully');
    } catch (error) {
      console.error('❌ Error in get-edit-form:', error);
      console.error('Error stack:', error.stack);
      return reply.status(500).send({ error: 'Failed to load book for editing' });
    }
  });

  // Cancel edit - Datastar version
  fastify.get('/cancel-edit/:id', async (req, reply) => {
    const { id } = req.params;

    try {
      let response = await fastify.inject({
        method: 'get',
        url: `/api/todo/book/${id}`
      }).then((res) => res.json());

      console.log('cancel-edit response:', response);

      if (!response || !response.data) {
        console.error('Book not found:', id);
        return reply.status(404).send({ error: 'Book not found' });
      }

      const book = response.data;

      const bookRow = `<tr id="book-${book._id}" data-book-id="${book._id}">
        <td>${book._id}</td>
        <td>${book.id}</td>
        <td>${book.name}</td>
        <td>${book.author}</td>
        <td>
          <button class="btn btn-primary btn-sm"
            data-on:click="
                if($editingId && $editingId !== '${book._id}'){
                    if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                        @get('/api_view/cancel-edit/' + $editingId);
                        $editingId = '${book._id}';
                        @get('/api_view/get-edit-form/${book._id}');
                    }
                }else{
                    $editingId = '${book._id}';
                    @get('/api_view/get-edit-form/${book._id}');
                }
            ">
            Edit
          </button>
          <button class="btn btn-info btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#editBookModal"
            data-on:click="@get('/api_view/load-edit-modal/${book._id}')">
            Edit Popup
          </button>
          <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view/delete/${book._id}')}">Delete</button>
        </td>
      </tr>`;

      await reply.datastar(async (sse) => {
        sse.patchElements(bookRow, {
          selector: `#book-${book._id}`,
          mode: "outer"
        });
      });
    } catch (error) {
      console.error('Error in cancel-edit:', error);
      return reply.status(500).send({ error: 'Failed to cancel edit' });
    }
  });

  // Update book - Datastar version
  fastify.put('/update/:id/:bookid', async (req, reply) => {
    const { id, bookid } = req.params;

    try {
      console.log('=== UPDATE BOOK CALLED ===');
      console.log('Update request body:', JSON.stringify(req.body, null, 2));
      console.log('Request headers:', req.headers['content-type']);

      // Datastar sends field names in lowercase! Check all variations
      const title = req.body.editTitle || req.body.edittitle || req.body.title;
      const author = req.body.editAuthor || req.body.editauthor || req.body.author;

      console.log('✅ Extracted values:');
      console.log('   title:', title);
      console.log('   author:', author);

      if (!title || !author) {
        console.error('❌ Missing title or author:', { title, author });
      }

      let book = {
        _id: id,
        id: bookid,
        name: title,
        author: author,
      };

      console.log('Updating book with values:', book);

      await fastify.inject({
        method: 'put',
        body: book,
        url: `/api/todo/book`
      }).then((x) => {
        let uprec = JSON.parse(x.payload);
        console.log('Update response:', uprec);
      });

      console.log('📝 Creating bookRow HTML with:');
      console.log('   book.name:', book.name, '(type:', typeof book.name, ')');
      console.log('   book.author:', book.author, '(type:', typeof book.author, ')');

      // If values are undefined, fetch fresh data from DB
      if (!book.name || !book.author) {
        console.log('⚠️ Values are missing! Fetching fresh data from DB...');
        const freshData = await fastify.inject({
          method: 'get',
          url: `/api/todo/book/${id}`
        }).then((res) => res.json());

        if (freshData && freshData.data) {
          book.name = freshData.data.name;
          book.author = freshData.data.author;
          console.log('✅ Fetched fresh values:', book.name, book.author);
        }
      }

      const bookRow = `<tr id="book-${book._id}" data-book-id="${book._id}">
        <td>${book._id}</td>
        <td>${book.id}</td>
        <td>${book.name || 'N/A'}</td>
        <td>${book.author || 'N/A'}</td>
        <td>
          <button class="btn btn-primary btn-sm"
            data-on:click="
                if($editingId && $editingId !== '${book._id}'){
                    if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                        @get('/api_view/cancel-edit/' + $editingId);
                        $editingId = '${book._id}';
                        @get('/api_view/get-edit-form/${book._id}');
                    }
                }else{
                    $editingId = '${book._id}';
                    @get('/api_view/get-edit-form/${book._id}');
                }
            ">
            Edit
          </button>
          <button class="btn btn-info btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#editBookModal"
            data-on:click="@get('/api_view/load-edit-modal/${book._id}')">
            Edit Popup
          </button>
          <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view/delete/${book._id}')}">Delete</button>
        </td>
      </tr>`;

      console.log('📤 Sending bookRow HTML (first 200 chars):', bookRow.substring(0, 200));

      await reply.datastar(async (sse) => {
        sse.patchElements(bookRow, {
          selector: `#book-${book._id}`,
          mode: "outer"
        });
        // Reset editing state
        sse.patchSignals({ editingId: '' });
      });

      console.log('✅ Update complete!');
    } catch (error) {
      console.error('Error in update:', error);
      return reply.status(500).send({ error: 'Failed to update book' });
    }
  });

  // Load book data into edit modal - Datastar version
  fastify.get('/load-edit-modal/:id', async (req, reply) => {
    const { id } = req.params;
    console.log('=== LOAD-EDIT-MODAL CALLED ===');
    console.log('Book ID:', id);

    try {
      let response = await fastify.inject({
        method: 'get',
        url: `/api/todo/book/${id}`
      }).then((res) => res.json());

      console.log('Book API response:', JSON.stringify(response, null, 2));

      if (!response || !response.data) {
        console.error('❌ Book not found:', id);
        return reply.status(404).send({ error: 'Book not found' });
      }

      const book = response.data;
      console.log('✅ Book found for modal:', book);

      await reply.datastar(async (sse) => {
        console.log('📤 Setting modal signals and opening modal');
        console.log('Book data:', { _id: book._id, id: book.id, name: book.name, author: book.author });

        // Escape values for HTML
        const escapedTitleHTML = (book.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const escapedAuthorHTML = (book.author || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        sse.patchSignals({
          editModalId: book._id,
          editModalBookId: book.id,
          editModalTitle: book.name || '',
          editModalAuthor: book.author || ''
        });

        // Patch the form with pre-filled values using patchElements
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

        console.log('✅ Form patched with values - Bootstrap will handle modal opening');
      });
    } catch (error) {
      console.error('❌ Error in load-edit-modal:', error);
      console.error('Error stack:', error.stack);
      return reply.status(500).send({ error: 'Failed to load book for editing' });
    }
  });

  // Update book from modal - Datastar version
  fastify.put('/update-modal/:id/:bookid', async (req, reply) => {
    const { id, bookid } = req.params;

    try {
      console.log('=== UPDATE-MODAL BOOK CALLED ===');
      console.log('Update request body:', JSON.stringify(req.body, null, 2));
      console.log('Request headers:', req.headers['content-type']);

      const title = req.body.editTitle || req.body.editModalTitle || req.body.edittitle || req.body.title;
      const author = req.body.editAuthor || req.body.editModalAuthor || req.body.editauthor || req.body.author;

      console.log('✅ Extracted values:');
      console.log('   title:', title);
      console.log('   author:', author);

      if (!title || !author) {
        console.error('❌ Missing title or author:', { title, author });
        return reply.status(400).send({ error: 'Title and author are required' });
      }

      let book = {
        _id: id,
        id: bookid,
        name: title,
        author: author,
      };

      console.log('Updating book with values:', book);

      await fastify.inject({
        method: 'put',
        body: book,
        url: `/api/todo/book`
      }).then((x) => {
        let uprec = JSON.parse(x.payload);
        console.log('Update response:', uprec);
      });

      const bookRow = `<tr id="book-${book._id}" data-book-id="${book._id}">
        <td>${book._id}</td>
        <td>${book.id}</td>
        <td>${book.name}</td>
        <td>${book.author}</td>
        <td>
          <button class="btn btn-primary btn-sm"
            data-on:click="
                if($editingId && $editingId !== '${book._id}'){
                    if(confirm('Already editing another row. Cancel that edit and edit this row?')){
                        @get('/api_view/cancel-edit/' + $editingId);
                        $editingId = '${book._id}';
                        @get('/api_view/get-edit-form/${book._id}');
                    }
                }else{
                    $editingId = '${book._id}';
                    @get('/api_view/get-edit-form/${book._id}');
                }
            ">
            Edit
          </button>
          <button class="btn btn-info btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#editBookModal"
            data-on:click="@get('/api_view/load-edit-modal/${book._id}')">
            Edit Popup
          </button>
          <button class="btn btn-danger btn-sm" data-on:click="if(confirm('Are you sure you wish to delete this book?')){@delete('/api_view/delete/${book._id}')}">Delete</button>
        </td>
      </tr>`;

      await reply.datastar(async (sse) => {
        sse.patchElements(bookRow, {
          selector: `#book-${book._id}`,
          mode: "outer"
        });
        // Close the modal
        sse.executeScript(`
          const modalEl = document.getElementById('editBookModal');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if(modal) modal.hide();
        `);
      });

      console.log('✅ Update complete!');
    } catch (error) {
      console.error('Error in update-modal:', error);
      return reply.status(500).send({ error: 'Failed to update book' });
    }
  });

  // Delete book - Datastar version
  fastify.delete('/delete/:id', async (req, reply) => {
    const { id } = req.params;

    try {
      console.log('Deleting book:', id);

      await fastify.inject({
        method: 'delete',
        url: `/api/todo/book/${id}`
      }).then((res) => res.json());

      var index = books.map((el) => el._id).indexOf(id);
      if (index > -1) {
        books.splice(index, 1);
      }

      await reply.datastar(async (sse) => {
        sse.removeElements(`#book-${id}`);
      });
    } catch (error) {
      console.error('Error in delete:', error);
      return reply.status(500).send({ error: 'Failed to delete book' });
    }
  });

}
  module.exports.autoPrefix = '/api_view';  

 