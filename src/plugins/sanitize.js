'use strict'
const fp = require('fastify-plugin')
// not in 22
function fsanitizePath(drive, wcid, type, docpath) {
  // Validate and sanitize inputs
  const sanitizedDrive = drive.replace(/[^a-zA-Z]/g, '');
  const sanitizedWcid = String(wcid).replace(/[^0-9]/g, '');
  const sanitizedType = type.replace(/[^a-zA-Z0-9_-]/g, '');

  // Construct path
  // const movefrom = `${sanitizedDrive}:\\docs\\images\\Claims\\${sanitizedWcid}\\${sanitizedType}\\`;
  let sanitizePath = `${sanitizedDrive}:${docpath}${sanitizedWcid}\\${sanitizedType}\\`;
  console.log(sanitizePath)
  return sanitizePath
}

async function fsanitizeString(str) {
  // Validate and sanitize inputs

  // const sanitizedString = String(str).replace(/[^0-9]/g, '');
  
  // return sanitizedString
const sanitizedString = String(str)
    .replace(/[<>\"'%;()&+]/g, '') // Remove potentially dangerous chars
    .trim(); // Remove leading/trailing whitespace

return sanitizedString

}

module.exports = fp(async (fastify, opts) => {


//   fastify.decorate('sanitizePath', {

//     getpath: (drive, wcid, type, docpath) => fsanitizePath(drive, wcid, type, docpath),
// getString:(str) => fsanitizeString(str)

//   });

// not in 22 after fastify.decorate('sanitize', { before field: (plainString) => {r 
  fastify.decorate('sanitize', {
  getpath: (drive, wcid, type, docpath) => fsanitizePath(drive, wcid, type, docpath),
  string:(str) => fsanitizeString(str) ,
  getString:(str) => fsanitizeString(str) ,
    field: (plainString) => {
      if (typeof plainString !== 'string') return plainString;

      return plainString
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/[<>'"]/g, (match) => {
        // .replace(/[<>'"&]/g, (match) => {
          const escapeMap = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '&': '&amp;'
          };
          return escapeMap[match];
        });
    },

    object: (obj, options = {}) => {
      const {
        allowedFields = null,
        maxDepth = 10,
        sanitizeValues = true,
        preserveNumbers = true,
        preserveBooleans = true,
        preserveDates = true
      } = options;

      if (obj === null || obj === undefined) return obj;

      if (maxDepth <= 0) return {};

      if (Array.isArray(obj)) {
        return obj.map(item =>
          typeof item === 'object' ?
            fastify.sanitize.object(item, { ...options, maxDepth: maxDepth - 1 }) :
            sanitizeValues ? fastify.sanitize.field(item) : item
        );
      }

      if (typeof obj === 'object') {
        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
          if (key.startsWith('__') || key.includes('$') || key.includes('.')) {
            continue;
          }

          if (allowedFields && !allowedFields.includes(key)) {
            continue;
          }

          const sanitizedKey = fastify.sanitize.field(key);

          if (value === null || value === undefined) {
            sanitized[sanitizedKey] = value;
          } else if (preserveNumbers && typeof value === 'number') {
            sanitized[sanitizedKey] = value;
          } else if (preserveBooleans && typeof value === 'boolean') {
            sanitized[sanitizedKey] = value;
          } else if (preserveDates && value instanceof Date) {
            sanitized[sanitizedKey] = value;
          } else if (typeof value === 'object') {
            sanitized[sanitizedKey] = fastify.sanitize.object(value, { ...options, maxDepth: maxDepth - 1 });
          } else if (sanitizeValues) {
            sanitized[sanitizedKey] = fastify.sanitize.field(String(value));
          } else {
            sanitized[sanitizedKey] = value;
          }
        }

        return sanitized;
      }

      return sanitizeValues ? fastify.sanitize.field(String(obj)) : obj;
    },

    mongoSafe: (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const sanitized = {};
      const allowedOperators = ['$set', '$unset', '$inc', '$push', '$pull'];

      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$') && !allowedOperators.includes(key)) {
          continue;
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          sanitized[key] = fastify.sanitize.mongoSafe(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    },

    firebird: {
      identifier: (name) => {
        if (typeof name !== 'string') return '';
        return name.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 128);
      },

      sqlString: (value) => {
        if (value === null || value === undefined) return null;
        if (typeof value !== 'string') value = String(value);

        return value
          .replace(/'/g, "''")
          .replace(/--/g, '')
          .replace(/\/\*.*?\*\//g, '')
          .replace(/;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC|EXECUTE)\s+/gi, '')
          .substring(0, 4000);
      },

      number: (value) => {
        if (value === null || value === undefined) return null;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      },

      validateDatabase: (dbName, allowedDatabases) => {
        if (!allowedDatabases) {
          allowedDatabases = ['bergen.fdb', 'bergendoc.fdb', 'brm', 'carisk'];
        }
        if (typeof dbName !== 'string') return null;
        const sanitized = fastify.sanitize.firebird.identifier(dbName.toLowerCase());
        return allowedDatabases.includes(sanitized) ? sanitized : null;
      },

      validateCollection: (collectionName) => {
        const sanitized = fastify.sanitize.firebird.identifier(collectionName);
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(sanitized)) {
          return null;
        }
        return sanitized;
      },

      hasDangerousPatterns: (query) => {
        if (typeof query !== 'string') return false;

        const patterns = [
          /;\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE)\s+/gi,
          /UNION\s+SELECT/gi,
          /--/g,
          /\/\*.*?\*\//g,
          /xp_cmdshell/gi,
          /sp_executesql/gi
        ];

        return patterns.some(pattern => pattern.test(query));
      },

      sanitizeParams: (params) => {
        if (!Array.isArray(params)) return [];

        return params.map(param => {
          if (typeof param === 'string') {
            return fastify.sanitize.firebird.sqlString(param);
          } else if (typeof param === 'number') {
            return fastify.sanitize.firebird.number(param);
          } else if (param instanceof Date) {
            return param;
          } else {
            return String(param);
          }
        });
      }
    }
  });

  fastify.decorate('sanitizeBody', async (request, reply) => {
    if (request.body && typeof request.body === 'object') {
      const allowedFields = [
        '_id', 'updatedAt', 'testit', 'clearfilter', 'filters',
        'updatestmt', 'filter', 'name', 'value', 'status',
        'query', 'params', 'data', 'array', 'exported',
        'response', 'reason', 'account', 'ClaimID', 'ClaimNO',
        'SupportingDocFilename', 'filetype', 'B28_Total',
        'TOTAL CHARGES', 'B24F_Charges', 'B2_PatLast', 'B2_PatFirst'
      ];

      request.body = fastify.sanitize.object(request.body, {
        allowedFields: allowedFields,
        maxDepth: 5
      });

      request.body = fastify.sanitize.mongoSafe(request.body);
    }
  });

  // fastify.decorate('sanitizeQuery', async (request, reply) => {
  //   if (request.query && typeof request.query === 'object') {
  //     for (const [key, value] of Object.entries(request.query)) {
  //       if (typeof value === 'string') {
  //         request.query[key] = fastify.sanitize.field(value);
  //       }
  //     }
  //   }
  // });
fastify.decorate('sanitizeQuery', async (request, reply) => {
  if (request.query && typeof request.query === 'object') {
    const sanitizedQuery = {};
    
    for (const [key, value] of Object.entries(request.query)) {
      // Block prototype pollution keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype' || 
          key.startsWith('__') || key.includes('$')) {
        continue; // Skip dangerous keys
      }
      
      // Validate key format
      if (!/^[a-zA-Z0-9_-]+$/.test(key) || key.length > 50) {
        continue; // Skip invalid keys
      }
      
      if (typeof value === 'string') {
        sanitizedQuery[key] = fastify.sanitize.field(value);
      } else {
        sanitizedQuery[key] = value;
      }
    }
    
    request.query = sanitizedQuery;
  }
});
  fastify.decorate('createFlexibleSanitizeBody', (options = {}) => {
    const {
      database,
      collection,
      allowedFields,
      maxDepth = 5,
      strictMode = true // Set to false for more permissive sanitization
    } = options;

    return async (request, reply) => {
      if (request.body && typeof request.body === 'object') {
        let fieldsToUse = allowedFields;

        if (!fieldsToUse) {
          const db = database || request.params?.database;
          const coll = collection || request.params?.collection;
          fieldsToUse = fastify.sanitize.getAllowedFields(db, coll);
        }

        // In non-strict mode, allow additional fields for complex nested objects
        const sanitizeOptions = {
          allowedFields: strictMode ? fieldsToUse : null,
          maxDepth: maxDepth,
          preserveNumbers: true,
          preserveBooleans: true,
          preserveDates: true
        };

        // If we're updating an existing record, be more permissive
        if (request.method === 'PUT' && request.params?.id) {
          sanitizeOptions.allowedFields = null; // Allow all fields for updates
        }

        request.body = fastify.sanitize.object(request.body, sanitizeOptions);
        request.body = fastify.sanitize.mongoSafe(request.body);
      }
    };
  });



})