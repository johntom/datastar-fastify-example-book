'use strict'

const fp = require('fastify-plugin')
const { datastar } = require('@johntom/datastar-fastify')
/**
 * This plugin registers the Datastar SDK for SSE support
 */
module.exports = fp(async function (fastify, opts) {
  fastify.register(datastar)
})
