const path = require('path');
const drive = process.env.drive;//${drive}

const buildPaths = {
   // D:\fastify\mongodonBRMwithFB\build.html
   buildPathHtml: path.resolve('./build.html'),
   // buildPathPdf: path.resolve('./build.pdf')
   // buildPathPdf: path.resolve(`${drive}:/PDF/froi.pdf`)
   buildPathPdf: path.resolve(`${drive}:/Safety/safety.pdf`)


   
   // buildPathPdf: path.resolve('E:/PDF/froi')
};
module.exports = buildPaths;

//node ./app/services/createPdf/createTable.js