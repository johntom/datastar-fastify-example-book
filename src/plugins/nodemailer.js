'use strict'

const fp = require('fastify-plugin');
module.exports = fp(async (fastify, opts) => {

    // fastify.register(require('fastify-nodemailer'), {
      
    //      host:'acrisure-com.mail.protection.outlook.com',
    //      port:25
 
    // })
// 
// });
fastify.register(require('fastify-nodemailer'), {
    pool: true,
   host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use TLS
  
   auth: {
       user: "jrt@gtz.com",
       pass: "goGreenport@77"
     
   }
})
});


