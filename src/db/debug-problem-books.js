'use strict';

const { MongoClient } = require('mongodb');
require('dotenv').config();

/**
 * Debug problematic book records
 */
async function debugProblemBooks() {
  const MONGODB_URL = process.env.MONGODB_URLtodo;
  const problemIds = [
    '632fa917bf632c5b8a2551bf',
    '632fa931bf632c5b8a2551c0',
    '6420801f6a95671e53c86a49',
    '632fa93bbf632c5b8a2551c1',
    '632fa945bf632c5b8a2551c2',
    '642077ba6b09716cd4bce429',
    '642081993976eb685ab54c55',
    '642081d43976eb685ab54c56',
    '6483970079bd537734d91da1'
  ];

  let mongoClient;

  try {
    mongoClient = new MongoClient(MONGODB_URL, {
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 30000
    });

    await mongoClient.connect();
    const db = mongoClient.db('todo');
    const booksCollection = db.collection('book');

    console.log('Inspecting problem books:\n');

    for (const id of problemIds) {
      const { ObjectId } = require('mongodb');
      const book = await booksCollection.findOne({ _id: new ObjectId(id) });

      if (book) {
        console.log(`Book ${id}:`);
        console.log('  Full object:', JSON.stringify(book, null, 2));
        console.log('  id field type:', typeof book.id);
        console.log('  id field value:', book.id);
        console.log('  createdAt type:', typeof book.createdAt);
        console.log('  createdAt value:', book.createdAt);
        console.log('  updatedAt type:', typeof book.updatedAt);
        console.log('  updatedAt value:', book.updatedAt);
        console.log('---\n');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

debugProblemBooks();
