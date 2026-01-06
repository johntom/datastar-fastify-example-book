'use strict'

// const htmlMinifier = require('html-minifier')

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

  // Home route
  fastify.get('/', async (request, reply) => {
    const data = {
      title: 'Welcome',
      message: 'Welcome to our Fastify app!'
    }

    // const html = await reply.view('index.njk', data)
    // return minifyHtml(html)
   return reply.view('./index.njk', data)

  })
}