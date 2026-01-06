'use strict'

const fp = require('fastify-plugin')
const path = require('path')
const chokidar = require('chokidar')

// Store connected clients
const clients = new Set()

// File watcher for Nunjucks templates
let watcher = null

async function liveReloadPlugin(fastify, opts) {
  // Only enable in development mode
  if (process.env.NODE_ENV === 'production') {
    return
  }

  // SSE endpoint for live reload
  fastify.get('/live-reload', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('Access-Control-Allow-Origin', '*')

    // Send initial connection message
    reply.raw.write('data: {"type":"connected"}\n\n')

    // Add client to set
    clients.add(reply.raw)

    // Remove client when connection closes
    request.raw.on('close', () => {
      clients.delete(reply.raw)
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

  // Initialize file watcher
  const viewsPath = path.join(__dirname, '../views')

  watcher = chokidar.watch(viewsPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
  })

  watcher.on('change', (filePath) => {
    const relativePath = path.relative(viewsPath, filePath)
    fastify.log.info(`File changed: ${relativePath}`)

    // Broadcast to all connected clients
    const message = JSON.stringify({
      type: 'reload',
      file: relativePath,
      timestamp: Date.now()
    })

    clients.forEach((client) => {
      if (client.writable) {
        client.write(`data: ${message}\n\n`)
      }
    })

    fastify.log.info(`Sent reload signal to ${clients.size} client(s)`)
  })

  fastify.log.info('Live reload enabled - watching: ' + viewsPath)

  // Clean up on server close
  fastify.addHook('onClose', async () => {
    if (watcher) {
      await watcher.close()
    }
    clients.clear()
  })
}

// Use fastify-plugin to ensure proper plugin registration
module.exports = fp(liveReloadPlugin, {
  name: 'live-reload',
  fastify: '>=5.x'
})
