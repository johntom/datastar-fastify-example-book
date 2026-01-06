'use strict'

const fp = require('fastify-plugin')

// Store connected clients for real-time data synchronization
const dataSyncClients = new Set()

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

  fastify.log.info('Data sync service enabled')

  // Clean up on server close
  fastify.addHook('onClose', async () => {
    dataSyncClients.clear()
  })
}

// Use fastify-plugin to ensure decorator is available globally
module.exports = fp(dataSyncPlugin, {
  name: 'data-sync',
  fastify: '>=5.x'
})
