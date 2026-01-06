'use strict';

const fp = require('fastify-plugin');

/**
 * Sanitize plugin - provides sanitization decorators for Fastify
 * This plugin adds sanitizeQuery and sanitizeBody decorators
 */
async function sanitizePlugin(fastify, opts) {

  // Sanitize a string by removing potentially dangerous characters
  function sanitizeString(str) {
    if (typeof str !== 'string') return str;

    // Remove script tags and common XSS patterns
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // Sanitize an object recursively
  function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];

        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  // Decorator for sanitizing query parameters
  fastify.decorate('sanitizeQuery', async function (request, reply) {
    if (request.query) {
      request.query = sanitizeObject(request.query);
    }
  });

  // Decorator for sanitizing body
  fastify.decorate('sanitizeBody', async function (request, reply) {
    if (request.body) {
      request.body = sanitizeObject(request.body);
    }
  });

  // Decorator for sanitizing params
  fastify.decorate('sanitizeParams', async function (request, reply) {
    if (request.params) {
      request.params = sanitizeObject(request.params);
    }
  });
}

module.exports = fp(sanitizePlugin, {
  name: 'sanitize-plugin'
});
