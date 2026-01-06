'use strict'

const fp = require('fastify-plugin')

// Store connected clients for real-time data synchronization
const dataSyncClients = new Set()

// Store locked records: Map<bookId, {lockedBy: sessionId, lockedAt: timestamp, userName: string}>
const lockedRecords = new Map()

// Broadcast data changes to all connected clients
function broadcastDataChange(eventType, data) {
  const message = JSON.stringify({
    type: eventType,
    data: data,
    timestamp: Date.now()
  })

  console.log(`📡 Broadcasting ${eventType} to ${dataSyncClients.size} client(s)`)

  dataSyncClients.forEach((client) => {
    if (client.writable) {
      client.write(`data: ${message}\n\n`)
    }
  })
}

// Lock a record
function lockRecord(bookId, sessionId, userName = 'Another user') {
  if (lockedRecords.has(bookId)) {
    const lock = lockedRecords.get(bookId)
    if (lock.lockedBy !== sessionId) {
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
  const lock = lockedRecords.get(bookId)

  if (!lock) {
    return { success: true } // Already unlocked
  }

  if (lock.lockedBy !== sessionId) {
    return { success: false, message: 'Cannot unlock - you are not the owner' }
  }

  lockedRecords.delete(bookId)
  broadcastDataChange('book-unlocked', { bookId })
  console.log(`🔓 Book ${bookId} unlocked`)

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

  // Make broadcast function available globally
  fastify.decorate('broadcastDataChange', broadcastDataChange)

  // Make lock functions available globally
  fastify.decorate('lockRecord', lockRecord)
  fastify.decorate('unlockRecord', unlockRecord)
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
