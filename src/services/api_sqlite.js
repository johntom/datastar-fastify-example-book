"use strict";

const { getBookDb } = require('../db/sqlite-helper');
const { PatchMode } = require('@johntom/datastar-fastify');

module.exports = async function (fastify, opts) {

  // GET - Get all books or filter
  fastify.get('/:collection', async (req, reply) => {
    const { collection } = req.params;

    if (collection !== 'book') {
      return reply.status(404).send({ error: 'Collection not found' });
    }

    try {
      const { filter, orderBy, limit = 0, skip = 0, fo = false } = req.query;

      const db = getBookDb();

      const options = {
        filter: filter ? JSON.parse(filter) : {},
        orderBy: orderBy ? parseOrderBy(orderBy) : 'book_id ASC',
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10),
        findOne: fo === 'true' || fo === true
      };

      const result = db.getBooks(options);

      reply.send({ data: result });
    } catch (error) {
      console.error('Error getting books:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // GET - Get single book by ID
  fastify.get('/:collection/:id', async (req, reply) => {
    const { collection, id } = req.params;

    if (collection !== 'book') {
      return reply.status(404).send({ error: 'Collection not found' });
    }

    try {
      const db = getBookDb();
      const result = db.getBookById(parseInt(id, 10));

      if (!result) {
        return reply.status(404).send({ error: 'Book not found' });
      }

      reply.send({ data: result });
    } catch (error) {
      console.error('Error getting book:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // POST - Create a new book
  fastify.post('/:collection', async (req, reply) => {
    const { collection } = req.params;

    if (collection !== 'book') {
      return reply.status(404).send({ error: 'Collection not found' });
    }

    try {
      const insertData = req.body;

      console.log('POST SQLite book - Insert data:', insertData);

      const db = getBookDb();
      const result = db.createBook(insertData);

      console.log('Insert result:', result);

      return reply.send({
        success: true,
        insertedId: result.insertedId,
        _id: result.insertedId.toString(),
        id: result.insertedId
      });
    } catch (error) {
      console.error('Error inserting book:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // PUT - Update a book
  fastify.put('/:collection', async (req, reply) => {
    const { collection } = req.params;

    if (collection !== 'book') {
      return reply.status(404).send({ error: 'Collection not found' });
    }

    try {
      const updateData = req.body;

      console.log('PUT SQLite book - Update data:', updateData);

      if (!updateData._id && !updateData.id) {
        return reply.status(400).send({ error: '_id or id is required for update' });
      }

      const db = getBookDb();
      const id = updateData._id || updateData.id;

      const result = db.updateBook(parseInt(id, 10), updateData);

      console.log('Update result:', result);

      return reply.send({
        success: true,
        matched: result.matched,
        modified: result.modified,
        data: updateData
      });
    } catch (error) {
      console.error('Error updating book:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // DELETE - Delete a book
  fastify.delete('/:collection/:id', async (req, reply) => {
    const { collection, id } = req.params;

    if (collection !== 'book') {
      return reply.status(404).send({ error: 'Collection not found' });
    }

    try {
      console.log('Deleting SQLite book:', id);

      const db = getBookDb();
      const result = db.deleteBook(parseInt(id, 10));

      return reply.send({
        success: true,
        deleted: result.deleted
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      return reply.status(500).send({ error: error.message });
    }
  });
};

module.exports.autoPrefix = "/api_sqlite";

/**
 * Helper function to parse MongoDB-style orderBy to SQLite ORDER BY
 * Example: '{"book_id":-1}' => 'book_id DESC'
 */
function parseOrderBy(orderByStr) {
  try {
    const orderObj = JSON.parse(orderByStr);
    const entries = Object.entries(orderObj);

    if (entries.length === 0) {
      return 'book_id ASC';
    }

    const [field, direction] = entries[0];
    const dir = direction === -1 ? 'DESC' : 'ASC';

    return `${field} ${dir}`;
  } catch (error) {
    return 'book_id ASC';
  }
}
