// FIXED SERVER CODE: src/services/uploadformdata.js
const fs = require('fs-extra');
const path = require('path');
const { pipeline } = require('stream');
const util = require('util');
const pump = util.promisify(pipeline);
const drive = process.env.drive || 'c';
// const multipart = require('@fastify/multipart');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async function (fastify, opts) {
  
    fastify.get('/test', async (request, reply) => {
        const data = {
            title: 'Upload Test',
            formAction: 'upload',
            csrfToken: generateCsrfToken(request)
        };
        reply.send({ data });
    });
   
    fastify.post('/videos', {}, async (request, reply) => {
        console.log('/upload/videos:');
        generateCsrfToken(request) 
          
        try {
            const data = await request.file();
          
             const dirpath = `${drive}:/Docs/Images/account/14`;
            const writepath = `${dirpath}/${data.filename}`;
            
            // Ensure directory exists
            await fs.ensureDir(dirpath);
            
            // Stream file to disk
            await pump(data.file, fs.createWriteStream(writepath));
            
            // Verify upload
            const uploaded = await fs.exists(writepath);
            
            reply.send({ 
                success: uploaded,
                filename: data.filename,
                path: writepath 
            });
            
        } catch (error) {
            console.log('Upload error:', error);
            reply.status(500).send({ error: 'Upload failed' });
        }
    });

    fastify.get('/videos', {}, async (request, reply) => {
        console.log('/upload/videos:');
        generateCsrfToken(request) 
          
        try {
            const data = await request.file();
          
             const dirpath = `${drive}:/Docs/Images/account/14`;
            const writepath = `${dirpath}/${data.filename}`;
            
            // Ensure directory exists
            await fs.ensureDir(dirpath);
            
            // Stream file to disk
            await pump(data.file, fs.createWriteStream(writepath));
            
            // Verify upload
            const uploaded = await fs.exists(writepath);
            
            reply.send({ 
                success: uploaded,
                filename: data.filename,
                path: writepath 
            });
            
        } catch (error) {
            console.log('Upload error:', error);
            reply.status(500).send({ error: 'Upload failed' });
        }
    });
   
    // Helper functions
    function generateCsrfToken(request) {
        const token = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        if (!request.session) {
            request.session = {};
        }

        request.session.csrfToken = token;
        return token;
    }

    function validateCsrfToken(request) {
        if (!request.session || !request.session.csrfToken) {
            return false;
        }
        return request.body.csrfToken === request.session.csrfToken;
    }
};

// Set the route prefix
module.exports.autoPrefix = '/upload';
