'use strict'

const fs = require('fs-extra')
const path = require('path')
const fastify = require('fastify')({
  logger: {
    transport: {
      target: 'pino-pretty'
    },
      bodyLimit: 1200000000,        // 1.2GB body limit
  requestTimeout: 300000        // 5 minutes timeout
  }
})
fastify.register(require('fastify-favicon'), { path: './' })

require('dotenv').config()
console.log('=======================');

console.log('process.env.drive:', process.env.drive);
console.log('=======================');
console.log('=======================');

// Register form body parser
fastify.register(require('@fastify/formbody'))
// 2. Register multipart for multipart/form-data
//1,000,000,000,000

// Register multipart for multipart/form-data (FIXED)
// fastify.register(require('@fastify/multipart'), {
//     limits: {
//         fileSize: 1200000000,  // 1.2GB
//         files: 1,
//         fields: 10,
//         parts: 1000,           // Add this
//         headerPairs: 2000
//     },
//     throwFileSizeLimit: false,
//     attachFieldsToBody: false
// });

//1 200 000 000
fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 1200000000,  // 1.2GB to handle your 955MB file
    files: 1,
    // fieldSize: 1000000,    // 1MB for form fields
     headerPairs: 2000      // Increase header pairs limit
  },
  // attachFieldsToBody: true  // This helps with form processing
});

console.log(' @fastify/multipart ')


// Register cookie and session support
fastify.register(require('@fastify/cookie'))
fastify.register(require('@fastify/session'), {
  cookieName: 'sessionId',
  secret: 'a-secret-key-that-should-be-changed-in-production',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
})
fastify.addHook('preHandler', async (request, reply) => {
  if (request.isMultipart()) {
    console.log('Multipart request detected')
    console.log('Content-Type:', request.headers['content-type'])
  }
})
// Register static file serving
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/'
})

fastify.register(require('@fastify/cors'), {
  // origin: true, // Allow yall origins in development
  origin: [
    'https://bergenrisk.com',
    'https://www.bergenrisk.com',
    'http://10.1.215.214',
    'http://10.1.215.214:80',
    'http://localhost:3000', // for development
  ],
credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});
// fastify.addHook('onRequest', async (request, reply) => {
//   console.log('Request headers:', request.headers);
//   console.log('Request origin:', request.headers.origin);
// });
// fastify.addHook('onRequest', async (request, reply) => {
//   if (request.url.includes('/upload/videos') && request.method === 'POST') {

//       console.log('=== HTMX POST REQUEST ===');
//       console.log('Content-Type:', request.headers['content-type']);
//       console.log('Content-Length:', request.headers['content-length']);
//       console.log('User-Agent:', request.headers['user-agent']);
//       console.log('HX-Request:', request.headers['hx-request']);
//       console.log('===========================');

//   }
// });




console.log('root', path.join(__dirname, 'public'))
const j_root = path.join(__dirname, `/public/json/translate.json`)// buildPath);//'public'),
const jsonxlate = JSON.parse(fs.readFileSync(j_root, 'utf8'));


fastify.decorate('jsonxlate', jsonxlate);// make global
// Setup view engine
fastify.register(require('@fastify/view'), {
  engine: {
    nunjucks: require('nunjucks')
  },
  root: path.join(__dirname, 'views'),
  options: {
    // Configure Nunjucks
    autoescape: true,
    noCache: process.env.NODE_ENV === 'development',
    throwOnUndefined: false
  }
})

// Register plugins first (MongoDB, Chilkat, Sanitize, etc.)
const AutoLoad = require('@fastify/autoload')
fastify.register(AutoLoad, {

  dir: path.join(__dirname, 'plugins'),
  options: Object.assign({})
});

// Register services (API routes, etc.)
fastify.register(AutoLoad, {

  dir: path.join(__dirname, 'services')
  //  ,    options: Object.assign({}, opts)
});


fastify.register(require('./routes/index'));// must keep for default  as if changes all other routes break= /
// fastify.register(require('./routes/form')) 

// Add security headers - Uncomment and use this version
// Add security headers - Uncomment and use this version
fastify.addHook('onSend', async (request, reply, payload) => {
  // Set security headers for SEO and security
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'SAMEORIGIN')  // Changed from DENY to SAMEORIGIN for your site
  reply.header('X-XSS-Protection', '1; mode=block')
  
  // More permissive CSP for your UIKit, Bootstrap,  and external resources
  reply.header('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "font-src 'self' https://cdnjs.cloudflare.com",
    "img-src 'self' data:",
    "connect-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "form-action 'self'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '))
 // Optional: Add HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  // Privacy headers
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  return payload
})




const start = async () => {
  try {
    const port = process.env.PORT || process.env.port || 3000;
    const host = process.env.HOST || process.env.host || '0.0.0.0';

    await fastify.listen({ port, host })

    console.log(`Server is running on ${fastify.server.address().port}/form`)
    console.log(`see views/form.njk   extends "layout.njk `)
    console.log(`launcg ndoe with npm start  `)

  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
