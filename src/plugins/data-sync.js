'use strict'

const fp = require('fastify-plugin')

// Store connected clients for real-time data synchronization
const dataSyncClients = new Set()

// Store locked records: Map<bookId, {lockedBy: sessionId, lockedAt: timestamp, userName: string}>
const lockedRecords = new Map()

// Lock expiration time (2 minutes)
const LOCK_EXPIRATION_MS = 2 * 60 * 1000

// Clean up expired locks
function cleanExpiredLocks() {
  const now = Date.now()
  for (const [bookId, lock] of lockedRecords.entries()) {
    if (now - lock.lockedAt > LOCK_EXPIRATION_MS) {
      console.log(`🔓 Lock expired for book ${bookId}`)
      lockedRecords.delete(bookId)
      broadcastDataChange('book-unlocked', { bookId })
    }
  }
}

// Run cleanup every 30 seconds
setInterval(cleanExpiredLocks, 30000)

// Broadcast data changes to all connected clients
function broadcastDataChange(eventType, data) {
  const message = JSON.stringify({
    type: eventType,
    data: data,
    timestamp: Date.now()
  })

  console.log(`📡 Broadcasting ${eventType} to ${dataSyncClients.size} client(s):`, JSON.stringify(data))

  dataSyncClients.forEach((client) => {
    if (client.writable) {
      client.write(`data: ${message}\n\n`)
    }
  })
}

// Clear all locks (admin function)
function clearAllLocks() {
  const count = lockedRecords.size
  for (const bookId of lockedRecords.keys()) {
    broadcastDataChange('book-unlocked', { bookId })
  }
  lockedRecords.clear()
  console.log(`🔓 Cleared ${count} locks`)
  return { success: true, clearedCount: count }
}

// Lock a record
function lockRecord(bookId, sessionId, userName = 'Another user') {
  // Check for expired lock first
  if (lockedRecords.has(bookId)) {
    const lock = lockedRecords.get(bookId)
    const now = Date.now()

    // If lock is expired, remove it
    if (now - lock.lockedAt > LOCK_EXPIRATION_MS) {
      console.log(`🔓 Lock expired for book ${bookId}, allowing new lock`)
      lockedRecords.delete(bookId)
      broadcastDataChange('book-unlocked', { bookId })
    } else if (lock.lockedBy !== sessionId) {
      return { success: false, message: `Book is being edited by ${lock.userName}` }
    }
  }

  lockedRecords.set(bookId, {
    lockedBy: sessionId,
    lockedAt: Date.now(),
    userName: userName
  })

  broadcastDataChange('book-locked', { bookId, userName })
  console.log(`🔒 Book ${bookId} locked by ${userName} (${sessionId})`)

  return { success: true }
}

// Unlock a record
function unlockRecord(bookId, sessionId) {
  console.log(`🔓 Unlock attempt - bookId: ${bookId}, sessionId: ${sessionId}`)
  const lock = lockedRecords.get(bookId)

  if (!lock) {
    console.log(`🔓 Book ${bookId} was not locked, broadcasting unlock anyway`)
    broadcastDataChange('book-unlocked', { bookId })
    return { success: true } // Already unlocked
  }

  console.log(`🔓 Current lock owner: ${lock.lockedBy}`)

  if (lock.lockedBy !== sessionId) {
    console.log(`❌ Cannot unlock - owner mismatch: ${lock.lockedBy} !== ${sessionId}`)
    // Still broadcast unlock if the lock exists but owner doesn't match
    // This helps when sessionId changes between requests
    return { success: false, message: 'Cannot unlock - you are not the owner' }
  }

  lockedRecords.delete(bookId)
  broadcastDataChange('book-unlocked', { bookId })
  console.log(`🔓 Book ${bookId} unlocked successfully, broadcast sent`)

  return { success: true }
}

// Check if a record is locked by someone else
function isLockedByOther(bookId, sessionId) {
  const lock = lockedRecords.get(bookId)
  if (!lock) return false
  return lock.lockedBy !== sessionId
}

// Get lock info for a record
function getLockInfo(bookId) {
  return lockedRecords.get(bookId) || null
}

async function dataSyncPlugin(fastify, opts) {
  // SSE endpoint for data synchronization
  fastify.get('/data-sync', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('Access-Control-Allow-Origin', '*')

    // Send initial connection message
    reply.raw.write('data: {"type":"connected"}\n\n')

    // Add client to set
    dataSyncClients.add(reply.raw)

    console.log(`📲 Data sync client connected (total: ${dataSyncClients.size})`)

    // Remove client when connection closes
    request.raw.on('close', () => {
      dataSyncClients.delete(reply.raw)
      console.log(`📴 Data sync client disconnected (total: ${dataSyncClients.size})`)
    })

    // Keep connection alive
    const keepAliveInterval = setInterval(() => {
      if (reply.raw.writable) {
        reply.raw.write(': keep-alive\n\n')
      } else {
        clearInterval(keepAliveInterval)
      }
    }, 30000) // Every 30 seconds
  })

  // Admin endpoint to clear all locks
  fastify.get('/clear-locks', async (request, reply) => {
    const result = clearAllLocks()
    return reply.send({ success: true, message: `Cleared ${result.clearedCount} locks` })
  })

  // Admin endpoint to view current locks
  fastify.get('/view-locks', async (request, reply) => {
    const locks = []
    for (const [bookId, lock] of lockedRecords.entries()) {
      locks.push({
        bookId,
        lockedBy: lock.lockedBy,
        lockedAt: new Date(lock.lockedAt).toISOString(),
        userName: lock.userName,
        expiresIn: Math.max(0, LOCK_EXPIRATION_MS - (Date.now() - lock.lockedAt)) / 1000 + 's'
      })
    }
    return reply.send({ locks, count: locks.length })
  })

  // Make broadcast function available globally
  fastify.decorate('broadcastDataChange', broadcastDataChange)

  // Make lock functions available globally
  fastify.decorate('lockRecord', lockRecord)
  fastify.decorate('unlockRecord', unlockRecord)
  fastify.decorate('clearAllLocks', clearAllLocks)
  fastify.decorate('isLockedByOther', isLockedByOther)
  fastify.decorate('getLockInfo', getLockInfo)

  fastify.log.info('Data sync service enabled with record locking')

  // Clean up on server close
  fastify.addHook('onClose', async () => {
    dataSyncClients.clear()
    lockedRecords.clear()
  })
}

// Use fastify-plugin to ensure decorator is available globally
module.exports = fp(dataSyncPlugin, {
  name: 'data-sync',
  fastify: '>=5.x'
})
