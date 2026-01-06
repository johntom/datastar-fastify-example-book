"use strict";

module.exports = async function (fastify, opts) {
  console.log("Data service started...\\apinoauth");

  const fs = require("fs-extra");
  const io = fastify.io; // socketio
  const drive = process.env.drive;
  const userdrive = process.env.userdrive;
  const sharp = require("sharp");
  const path = require("path");
  const puppeteer = require("puppeteer");
  let dayjs = require("dayjs");
  const utc = require("dayjs/plugin/utc"); // ES 2015
  dayjs.extend(utc);
  //  val = dayjs.utc(val.toLocaleString()).format('MM/DD/YYYY')
  const regex = /[\\\/:*"?<>|]/g;

  const translate = require("@iamtraction/google-translate");
  // const myDBtools = require('../../services/_shared/myDBtools');

  const { ObjectId } = require("@fastify/mongodb");

  const { buildPathHtml, buildPathPdf } = require("./buildPaths");
  // Enhanced sanitization functions for path security
  const pathSanitizer = {
    // Sanitize filename - removes dangerous characters and path traversal
    sanitizeFilename: (filename) => {
      if (!filename || typeof filename !== "string") {
        throw new Error("Invalid filename provided");
      }

      return filename
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // Remove invalid filename chars
        .replace(/^\.+/, "") // Remove leading dots
        .replace(/\.+$/, "") // Remove trailing dots
        .replace(/\s+/g, "_") // Replace spaces with underscore
        .trim()
        .substring(0, 255); // Limit length
    },

    // Sanitize directory name - similar to filename but allows some path chars
    sanitizeDirectory: (dirname) => {
      if (!dirname || typeof dirname !== "string") {
        throw new Error("Invalid directory name provided");
      }

      return dirname
        .replace(/[<>:"/|?*\x00-\x1f]/g, "") // Remove most invalid chars but keep backslash
        .replace(/\.\.+/g, "") // Remove path traversal attempts
        .replace(/^\.+/, "") // Remove leading dots
        .replace(/\.+$/, "") // Remove trailing dots
        .trim()
        .substring(0, 255); // Limit length
    },

    // Validate that a path stays within allowed boundaries
    validatePathSafety: (fullPath, allowedBasePaths) => {
      const normalizedPath = path.resolve(fullPath);

      // Check if the resolved path starts with any of the allowed base paths
      const isAllowed = allowedBasePaths.some((basePath) => {
        const normalizedBase = path.resolve(basePath);
        return (
          normalizedPath.startsWith(normalizedBase + path.sep) ||
          normalizedPath === normalizedBase
        );
      });

      if (!isAllowed) {
        throw new Error(`Path ${fullPath} is outside allowed directories`);
      }

      return normalizedPath;
    },

    // Safe path construction with validation
    buildSafePath: (basePath, ...segments) => {
      // Sanitize each segment
      const sanitizedSegments = segments
        .map((segment) => {
          if (typeof segment !== "string") {
            throw new Error("All path segments must be strings");
          }

          // Remove any path traversal attempts
          return segment
            .replace(/\.\./g, "") // Remove ..
            .replace(/[\/\\]/g, "") // Remove path separators
            .replace(/[<>:"|?*\x00-\x1f]/g, "") // Remove invalid chars
            .trim();
        })
        .filter((segment) => segment.length > 0); // Remove empty segments

      // Build the path
      const fullPath = path.join(basePath, ...sanitizedSegments);

      // Validate it stays within the base path
      const normalizedFull = path.resolve(fullPath);
      const normalizedBase = path.resolve(basePath);

      if (
        !normalizedFull.startsWith(normalizedBase + path.sep) &&
        normalizedFull !== normalizedBase
      ) {
        throw new Error("Path traversal attempt detected");
      }

      return fullPath;
    },
  };

  // Updated sanitization functions for your fastify plugin
  function fsanitizePath(drive, wcid, type, docpath) {
    // Validate and sanitize inputs
    const sanitizedDrive = drive.replace(/[^a-zA-Z]/g, "");
    const sanitizedWcid = String(wcid).replace(/[^0-9]/g, "");
    const sanitizedType = pathSanitizer.sanitizeDirectory(type);

    // Build path safely
    const sanitizePath = `${sanitizedDrive}:${docpath}${sanitizedWcid}\\${sanitizedType}\\`;
    console.log(sanitizePath);
    return sanitizePath;
  }

  async function fsanitizeString(str) {
    if (typeof str !== "string") {
      return "";
    }

    const sanitizedString = String(str)
      .replace(/[<>\"'%;()&+]/g, "") // Remove potentially dangerous chars
      .replace(/\.\./g, "") // Remove path traversal attempts
      .replace(/[\/\\]/g, "") // Remove path separators
      .trim() // Remove leading/trailing whitespace
      .substring(0, 1000); // Limit length

    return sanitizedString;
  }

  // Enhanced file operations with safety checks
  const safeFileOperations = {
    async safeCopy(srcPath, destPath, allowedBasePaths) {
      try {
        // Validate both source and destination paths
        const safeSrcPath = pathSanitizer.validatePathSafety(
          srcPath,
          allowedBasePaths
        );
        const safeDestPath = pathSanitizer.validatePathSafety(
          destPath,
          allowedBasePaths
        );

        // Check if source file exists
        const srcExists = await fs.pathExists(safeSrcPath);
        if (!srcExists) {
          throw new Error(`Source file does not exist: ${srcPath}`);
        }

        // Ensure destination directory exists
        await fs.ensureDir(path.dirname(safeDestPath));

        // Perform the copy
        await fs.copy(safeSrcPath, safeDestPath);

        return { success: true, src: safeSrcPath, dest: safeDestPath };
      } catch (error) {
        console.error("Safe copy failed:", error.message);
        throw error;
      }
    },

    async safeMove(srcPath, destPath, allowedBasePaths) {
      try {
        // Validate both source and destination paths
        const safeSrcPath = pathSanitizer.validatePathSafety(
          srcPath,
          allowedBasePaths
        );
        const safeDestPath = pathSanitizer.validatePathSafety(
          destPath,
          allowedBasePaths
        );

        // Check if source file exists
        const srcExists = await fs.pathExists(safeSrcPath);
        if (!srcExists) {
          throw new Error(`Source file does not exist: ${srcPath}`);
        }

        // Ensure destination directory exists
        await fs.ensureDir(path.dirname(safeDestPath));

        // Perform the move
        await fs.move(safeSrcPath, safeDestPath);

        return { success: true, src: safeSrcPath, dest: safeDestPath };
      } catch (error) {
        console.error("Safe move failed:", error.message);
        throw error;
      }
    },
  };

  module.exports = {
    pathSanitizer,
    safeFileOperations,
    fsanitizePath,
    fsanitizeString,
  };

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getEntity(database, collection) {
    // const db = fastify.mongo.db(database);
    const entity = fastify.mongo[database].db.collection(collection);
    return entity;
  }
  //
  // getProp
  // Reference: https://gist.github.com/harish2704/d0ee530e6ee75bad6fd30c98e5ad9dab
  // Usage: "pipeline[0].$match.modified_date.$gt"
  //
  function getProp(object, keys, defaultVal) {
    keys = Array.isArray(keys)
      ? keys
      : keys.replace(/(\[(\d)\])/g, ".$2").split(".");
    object = object[keys[0]];
    if (object && keys.length > 1) {
      return getProp(object, keys.slice(1), defaultVal);
    }
    return object === undefined ? defaultVal : object;
  }

  function reviver_reviver(key, value) {
    if (typeof value === "string") {
      if (
        /\d{4}-\d{1,2}-\d{1,2}/.test(value) ||
        /\d{4}\/\d{1,2}\/\d{1,2}/.test(value)
      ) {
        return new Date(value);
      } else if (key === "_id") {
        return new ObjectId(value);
      }
    }
    return value;
  }
  function reviver(key, value) {
    if (typeof value === "string") {
      if (
        /\d{4}-\d{1,2}-\d{1,2}/.test(value) ||
        /\d{4}\/\d{1,2}\/\d{1,2}/.test(value)
      ) {
        return new Date(value);
      } else if (key === "_id") {
        return new ObjectId(value);
      } else if (key === "file") {
        //pdf names have a timestap
        return value;
      }
    }
    return value;
  }
  //
  // Post (Create)
  //
  // fastify.post('accountpass/:database/:collection', {
  //   schema: {
  //     params: {
  //       type: 'object',
  //       properties: {
  //         database: {
  //           description: 'The database name',
  //           // summary: 'The database name',
  //           type: 'string'
  //         },
  //         collection: {
  //           description: 'The collection name',
  //           // summary: 'The collection name',
  //           type: 'string'
  //         }
  //       }
  //     },
  //     body: {
  //       type: 'object'
  //     }
  //   }
  // },
  //   async (request, reply) => {

  //     let { database, collection } = request.params;
  //     const entity = getEntity(database, collection);
  //     console.log('post ', collection)//,result.insertedIds.toString())

  //     const bod = JSON.stringify(request.body)

  //     const obj = JSON.parse(bod, reviver);

  //     let result;

  //     var resp = { status: 'ok' };
  //     console.log('resp', resp);
  //     return reply.send(resp);

  //   });
  fastify.post(
    "/:database/:collection",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            database: {
              description: "The database name",
              // summary: 'The database name',
              type: "string",
            },
            collection: {
              description: "The collection name",
              // summary: 'The collection name',
              type: "string",
            },
          },
        },
        body: {
          type: "object",
        },
      },
    },
    async (request, reply) => {
      let { database, collection } = request.params;

      database = await fastify.sanitize.getString(database);
      collection = await fastify.sanitize.getString(collection);

      let entity = getEntity(database, collection);
      console.log("post ", collection); //,result.insertedIds.toString())

      const bod = JSON.stringify(request.body);

      const obj = JSON.parse(bod, reviver);

      let result;
      // let ssn = obj.b110_Employee_SSN
      // // let SSConvert = await myDBtools.chilkat_encrypt(ssn)
      // let SSConvert = await chilkat_encrypt(ssn)
      // ssn = ssn.slice(-4);
      // obj.b110_Employee_SSN = ssn
      // obj.SSConvert = SSConvert
      let ssn;
      let SSConvert;
      switch (collection) {
        case "froi":
          ssn = obj.b110_Employee_SSN;
          // let SSConvert = await myDBtools.chilkat_encrypt(ssn)
          // SSConvert = await chilkat_encrypt(ssn)
          SSConvert = fastify.chilkat.encrypt(ssn);

          ssn = ssn.slice(-4);
          obj.b110_Employee_SSN = ssn;
          obj.SSConvert = SSConvert;
          result = await entity.insertOne(obj); // spanish version
          // take away from pdf
          delete obj.SSConvert;
          // &&&&&&&&&&&&&&&&&&&&&&&&&&&&
          //  collection += 'noauth';

          console.log("collection for createpdf ", collection);
          obj.Language = "EN";
          fastify.inject(
            {
              method: "post",
              // headers: headobj,
              payload: obj,
              // url: `/api/brm/v1/createpdf/${collection}`,
              url: `/api/brm/v1/createpdf/${collection}`,
            },
            (err, response) => {
              if (err) {
                next(err);
              } else {
              }
            }
          );
          break;
        case "sroi":
          result = await entity.insertOne(obj); // spanish version
          // take away from pdf
          delete obj.SSConvert;
          collection += "noauth";
          console.log("collection for createpdf ", collection);
          obj.Language = "EN";
          fastify.inject(
            {
              method: "post",
              // headers: headobj,
              payload: obj,
              url: `/api/brm/v1/createpdf/${collection}`,
            },
            (err, response) => {
              if (err) {
                next(err);
              } else {
              }
            }
          );
          break;

        case "froispanish":
          obj.Language = "ES";
          ssn = obj.b110_Employee_SSN;
          // let SSConvert = await myDBtools.chilkat_encrypt(ssn)
          // SSConvert = await chilkat_encrypt(ssn)
          SSConvert = fastify.chilkat.encrypt(ssn);
          ssn = ssn.slice(-4);
          obj.b110_Employee_SSN = ssn;
          obj.SSConvert = SSConvert;

          result = await entity.insertOne(obj); // spanish version

          // take away from pdf
          delete obj.SSConvert;
          // obj._id = result.insertedId.toString()

          obj.spanish_id = result.insertedId.toString();
          delete obj._id; //don not wrte spanish _id on reg record

          // a1_Employer_Name: 'Toma',
          // b100_Employee_Last_Name: 'Testa',
          // convert questions to spanish
          // const j_root = path.join(__dirname, `/public/json/translate.json`)// buildPath);//'public'),
          const jsonxlateF = fastify.jsonxlate;
          console.log("jsonxlate ", jsonxlateF);

          // Create lookup: fieldId -> label
          const fieldToLabel = jsonxlateF.reduce((acc, item) => {
            acc[item.fieldId] = item.label;
            return acc;
          }, {});

          // write spanish pdf
          console.log(" froinoauth_inspanish obj= ", obj);
          // Transform obj: replace fieldId keys with labels
          let translated = {};
          for (const [key, value] of Object.entries(obj)) {
            const label = fieldToLabel[key] || key; // fallback to original key if not found
            translated[label] = value;
          }
          translated.a1_Employer_Name = obj.a1_Employer_Name;
          translated.b100_Employee_Last_Name = obj.b100_Employee_Last_Name;

          // write spanish pdf and sends email
          await fastify.inject(
            {
              method: "post",
              // payload: englishobj,
              payload: translated,
              //    url: `/api/brm/v1/createpdf/${collection}`,
              url: `/api/brm/v1/createpdf/froispanish`,
            },
            (err, response) => {
              if (err) {
                next(err);
              } else {
              }
            }
          );

          // take spanish version and convert to english
          let entityfroi = getEntity(database, "froi"); // for english version
          let englishobj = {};
          englishobj.Language = "EN";
          let ob;
          for (const fld in obj) {
            await translate(obj[fld], { from: "es", to: "en" })
              .then((res) => {
                if (
                  fld === "a1_Employer_Name" ||
                  fld === "b100_Employee_Last_Name" ||
                  fld === "b101_Employee_First_Name" ||
                  fld === "e108_oother_preparers_phone" ||
                  fld === "e103_other_date_administrator_tpa_notified"
                ) {
                  englishobj[fld] = obj[fld];
                } else {
                  englishobj[fld] = res.text;
                }
              })
              .catch((err) => {
                console.error(err);
              });
          }

          let resulten = await entityfroi.insertOne(englishobj); // for english version
         
          englishobj._id = resulten.insertedId.toString();
          console.log("insertOne  obj._id ", englishobj._id);
          // write englishobj pdf and sends email
          fastify.inject(
            {
              method: "post",
              payload: englishobj,
              url: `/api/brm/v1/createpdf/froi`,
            },
            (err, response) => {
              if (err) {
                next(err);
              } else {
              }
            }
          );

          break;
      } // switch

   

      var resp = { status: "ok" };
      console.log("resp", resp);
      return reply.send(resp);
    }
  );

  // http:///10.1.215.217/apinoauth/brm/froi/63f28ae64118575ad5c9b7fb/makepdf
  // http:///10.1.215.217/apinoauth/brm/froi/63f336804118575ad5c9b7fd/makepdf
  // http:///10.1.215.217/apinoauth/brm/froi/63f37b5a4118575ad5c9bb09/makepdf
  // http:///10.1.215.217/apinoauth/brm/froi/63f37f134118575ad5c9bbbe/makepdf
  //
  // http:///10.1.215.217/apinoauth/brm/sroi/63f28d5c4118575ad5c9b7fc/makepdf
  // http:///10.1.215.217/apinoauth/brm/sroi/63f337cc4118575ad5c9b7fe/makepdf
  // http:///10.1.215.217/apinoauth/brm/sroi/63f37fc14118575ad5c9bbbf/makepdf
  // http:///10.1.215.217/apinoauth/brm/sroi/63f380f64118575ad5c9bbc0/makepdf
  // fastify.get(
  //   "/:database/:collection/:id/makepdf",
  //   {
  //     // // preValidation: [fastify.authenticate],
  //     schema: {
  //       params: {
  //         type: "object",
  //         properties: {
  //           database: {
  //             description: "The database name",
  //             // summary: 'The database name',
  //             type: "string",
  //           },
  //           collection: {
  //             description: "The collection name",
  //             // summary: 'The collection name',
  //             type: "string",
  //           },
  //           id: {
  //             description: "The document id",
  //             // summary: 'The document id',
  //             type: "string",
  //           },
  //         },
  //       },
  //     },
  //   },
  //   async (request, reply) => {
  //     const { database, collection, id } = request.params;
  //     const entity = getEntity(database, collection);
  //     // const _id = new ObjectId(id);
  //     console.log("get _id===collection========= ", collection);
  //     const _id = new ObjectId(id);
  //     console
  //       .log
  //       // `===============reply======================${_id} --  -- ${request.session.authenticated}`
  //       (); //[0].lastName} `)
  //     //{ "testit" : 7 }

  //     result = await entity.findOne(query);
  //     // const result = await entity.findOne({
  //     //   _id
  //     // });
  //     //

  //     fastify.inject(
  //       {
  //         method: "post",
  //         payload: result,
  //         url: `/api/brm/v1/createpdf/${collection}noauth`,
  //       },
  //       (err, response) => {
  //         if (err) {
  //           next(err);
  //         } else {
  //         }
  //       }
  //     );

  //     var resp = { data: result };

  //     return reply.send(resp);
  //   }
  // );

  // fastify.get(
  //   "/:database/:collection/:id",
  //   {
  //     // // preValidation: [fastify.authenticate],
  //     schema: {
  //       params: {
  //         type: "object",
  //         properties: {
  //           database: {
  //             description: "The database name",
  //             // summary: 'The database name',
  //             type: "string",
  //           },
  //           collection: {
  //             description: "The collection name",
  //             // summary: 'The collection name',
  //             type: "string",
  //           },
  //           id: {
  //             description: "The document id",
  //             // summary: 'The document id',
  //             type: "string",
  //           },
  //         },
  //       },
  //     },
  //   },
  //   async (request, reply) => {
  //     const { database, collection, id } = request.params;
  //     const entity = getEntity(database, collection);
  //     // const _id = new ObjectId(id);
  //     console.log("get _id===collection========= ", collection);
  //     const _id = new ObjectId(id);
  //     console.log(
  //       `===============reply======================${_id} --  -- ${request.session.authenticated}`
  //     ); //[0].lastName} `)
  //     // if (request.session.authenticated) {

  //     const result = await entity.findOne({
  //       _id,
  //     });
  //     //
  //     fastify.io.sockets.emit("lobby", result);
  //     //   return {database, collection, id, _id, result};
  //     //  } else result = 'not autenticated'
  //     // console.log('===result========= ', result)
  //     // // return {result};
  //     // return { data: result };

  //     var resp = { data: result };
  //     console.log(resp);
  //     return reply.send(resp);
  //   }
  // );
  // // Get (Retreive)

  // fastify.get(
  //   "/:database/:collection",
  //   {
  //     schema: {
  //       params: {
  //         type: "object",
  //         properties: {
  //           database: {
  //             description: "The database name",
  //             // summary: 'The database name',
  //             type: "string",
  //           },
  //           collection: {
  //             description: "The collection name",
  //             // summary: 'The collection name',
  //             type: "string",
  //           },
  //         },
  //       },
  //       querystring: {
  //         type: "object",
  //         properties: {
  //           filter: {
  //             description: "The filter criteria as a JSON string",
  //             // summary: 'The filter criteria',
  //             type: "string",
  //           },
  //           orderBy: {
  //             description: "The orderBy expression as a JSON string",
  //             // summary: 'The orderBy expression',
  //             type: "string",
  //           },
  //           limit: {
  //             description: "The limit ",
  //             // summary: 'The limit',
  //             type: "integer",
  //           },
  //           skip: {
  //             description: "The ,skip ",
  //             // summary: 'The skip',
  //             type: "integer",
  //           },
  //           fo: {
  //             description: "The find one flag",
  //             // summary: 'Find one',
  //             type: "boolean",
  //           },
  //           f: {
  //             description: "The fields object",
  //             // summary: 'The fields object',
  //             type: "string",
  //           },
  //           c: {
  //             description: "Count the number of documents",
  //             // summary: 'Count',
  //             type: "boolean",
  //           },
  //         },
  //         required: [],
  //       },
  //     },
  //   },
  //   async (request, reply) => {
  //     const { database, collection } = request.params;
  //     const {
  //       filter,
  //       orderBy,
  //       limit = 0,
  //       skip = 0,
  //       fo = false,
  //       f = null,
  //       c = false,
  //       ci,
  //       filterregex,
  //     } = request.query;
  //     let query = {};
  //     let sort = {};
  //     let project = {};
  //     let findOne = fo;
  //     // http://localhost:8080/apinoauth/brm/account_passwords?filter={%22Name%22:%22BergenCounty%22,%22Password%22:%22ClaimsDept100%22}
  //     // http://localhost:8080/apinoauth/brm/account_passwords?filter={"Name":"BergenCounty","Password":"ClaimsDept100"}
  //     console.log("filter 1 ", filter);
  //     if (filter) {
  //       console.log("filter", filter);
  //       // query = JSON.parse(filter);//, reviver);
  //       query = JSON.parse(filter, reviver);

  //       console.log("query", query);
  //     }

  //     // console.log("filter", filter) //[0].lastName} `)

  //     if (orderBy) {
  //       // sort = JSON.stringify(orderBy)
  //       sort = JSON.parse(orderBy); //, reviver);
  //     }
  //     // if(sort==="{POID:-1}") sort={POID:-1}
  //     // console.log('orderBy  ', ' sort ', sort)
  //     // console.log('limit ', limit)
  //     // console.log('query +', query)

  //     if (f) {
  //       console.log(f);
  //       project = JSON.parse(f);
  //     }
  //     // console.log('project +', project)

  //     const entity = getEntity(database, collection);
  //     let result;
  //     result = await entity.find(query).toArray();
  //     console.log("result +", result);
  //     if (findOne) {
  //       if (f) {
  //         result = await entity.findOne(query, {
  //           projection: project,
  //         });
  //       } else {
  //         result = await entity.findOne(query);
  //       }
  //     } else {
  //       if (f) {
  //         // let pp={POID:1,VendorID:1}
  //         result = await entity
  //           .find(query)
  //           .project(project)
  //           .sort(sort)
  //           .skip(+skip)
  //           .limit(+limit)
  //           .toArray();
  //       } else {
  //         if (c) {
  //           result = await entity.find(query).count();
  //         } else {
  //           result = await entity
  //             .find(query)
  //             .sort(sort)
  //             .skip(+skip)
  //             .limit(+limit)
  //             .toArray();
  //           //  result = await entity.find(query).toArray();
  //         }
  //       }
  //     }
  //     // "Name" : "BergenCounty",
  //     // "Password" : "ClaimsDept100",
  //     // "ExpireDate" : "06/30/2025"
  //     // @guivic/fastify-socket.io'
  //     fastify.io.sockets.emit("lobby", result);
  //     console.log("result", result.length);
  //     console.log("=======================");

  //     // return result;
  //     return { data: result };
  //   }
  // );

  // // http://localhost:8080/api/v1/walkdir/getfoleyIMG_0497.JPG
  // // http://localhost:8080/apinoauth/brm/sharp/IMG_0497.JPG

  // fastify.get("/sharp/:imageref", {}, async (request, reply) => {
  //   const { imageref } = request.params;
  //   let root = `${drive}:/Photos/fix`; //bf_ti BillFoley`
  //   let rootfixed = `${drive}:/Photos/fixed`; //bf_ti BillFoley`
  //   const imgPath = path.join(root, imageref);
  //   console.log("get _id===imgPath========= ", imgPath);

  //   const thumbName = `tn_${imageref}`;
  //   const thumbPath = path.join(rootfixed, thumbName);
  //   await sharp(imgPath)
  //     .resize({
  //       width: 254,
  //       height: 254, // 300,
  //       fit: "contain", //sharp.fit.cover,
  //       background: { r: 255, g: 255, b: 255, alpha: 1.0 },
  //     })
  //     .toFile(thumbPath);
  //   // let image = `${drive}:/Photos/fix/:imageref`;//bf_ti BillFoley`
  //   // fs.readFile(path.join(root, imageref), 'utf8', async function (err, contents) {
  //   //   await sharp(contents)
  //   //   .resize({
  //   //       width: 254,
  //   //       height: 300,
  //   //       fit:  'contain',//sharp.fit.cover,

  //   //     })  .toFile(thumbPath);
  //   // })
  //   var resp = { data: "reszied" };
  //   console.log(resp);
  //   return reply.send(resp);
  // });

  ///   7 or 9 ...
  /// http://localhost:8080/apinoauth/rebuildfroi/sroi/1
  // http://localhost:8080/apinoauth/rebuildfroi/froi/1
  fastify.get(
    "/rebuildfroi/:collection/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            database: {
              description: "The database name",
              //summary: 'The database name',
              type: "string",
            },
            collection: {
              description: "The collection name",
              //  summary: 'The collection name',
              type: "string",
            },
          },
        },
      },
    },
    async (req, reply) => {
      //  let collection = 'froi'
      let { collection } = req.params;
      let { id } = req.params;

      let database = "brm";
      const entity = getEntity(database, collection);
      console.log("post======================================", collection); //,result.insertedIds.toString())
      // maker sure  testit =1
      // let query = { "testit": id * 1 }
      let query = {};

      // this will retrieve 1 or more
      // let obj = await entity.findOne(query); // spanish version
      let recs = await entity.find(query).toArray();
      let allct = recs.length;
      let ct = 0;
      // const { buildPathHtml, buildPathPdf } = require('./buildPaths');
      // const createdAt =  dayjs.utc(val.toLocaleString()).format('MM/DD/YYYY')
      const createdAt = dayjs().utc(true).format("MM/DD/YYYY");
      const createTable = (rows) => `
            <style>
            .Rtable {
                display: flex;
                flex-wrap: wrap;
                margin: 0 0 1em 0;
                padding: 0;
              }
              .Rtable-cell {
                box-sizing: border-box;
                width: 100%;  
                padding: 0.2em 0.2em;
                overflow-wrap: break-word;   
                  list-style: none;
                  border: solid 1px black;
               
              }
            
            
       
            .Rtable--2cols > .Rtable-cell  { width: 50%; }
            .Rtable--3cols > .Rtable-cell  { width: 33.33%; }
            .Rtable--4cols > .Rtable-cell  { width: 25%; }
            .Rtable--5cols > .Rtable-cell  { width: 20%; }
            .Rtable--6cols > .Rtable-cell  { width: 16.6%; }
            
            
            </style>
            <html>
              <h2> Bergen Risk Managers : FROI</h2>
         
            <div class="Rtable Rtable--2cols">
            
            ${rows}    
            </div>
            </html>
`;

      // <h2> Bergen Risk Managers : SUPERVISOR/SAFETY REPORT</h2>
      const createHtml = (table) => `
  <html>
  ${table}
  </html>
`;

      const doesFileExist = (filePath) => {
        try {
          fs.statSync(filePath); // get information of the specified file path.
          return true;
        } catch (error) {
          return false;
        }
      };

      for (const obj of recs) {
        ct++;
        delete obj.SSConvert;
        const unordered = obj;
        let rows = "";
        const ordered = {};
        console.log(ct, obj);
        Object.keys(unordered)
          .sort()
          .forEach(function (key) {
            let labelindex = key.indexOf("_") + 1;
            // in froi dont cut occurrence 11 , other 6, medical 8
            if (labelindex < 6 && key !== "_id") {
              let nkey = key.substr(labelindex, key.length);
              ordered[nkey] = unordered[key];
            } else ordered[key] = unordered[key];
            // console.log(ordered)
          });
        for (const property in ordered) {
          let isadate = property.toLowerCase().includes("date");
          // console.log('froi isadate', isadate, property);
          let ss = "";
          let val = ordered[property];
          if (val === undefined) val = "";
          if (isadate && val !== null) {
            console.log("val ", val);
            val = dayjs.utc(val.toLocaleString()).format("MM/DD/YYYY");
            //FIX  val = dayjs().utc(true).format('MM/DD/YYYY')
            if (val === "Invalid date") val = "";
          }
          ss = `<div class="Rtable-cell"  flex-wrap: wrap; >${property} </div>  <div class="Rtable-cell"> ${val} </div>`;
          rows = rows + ss;
        }
        collection += "noauth";
        console.log("collection for createpdf ", collection);
        obj.Language = "EN";

        let from = ordered.Employer_Name; //.trim()
        // const regex = /[\\\/:*"?<>|]/g;

        from = from.replace(regex, "_");

        const to = ordered.Employee_Last_Name;

        const table = createTable(rows);
        /* generate html */
        const html = createHtml(table);
        /* write the generated html to file */
        let buildPathHtml, buildPathPdf;
        if (collection === "sroi") {
          buildPathHtml = `${drive}:/Safety/safety_${from}_${to}.html`; //  path.resolve('./build.html')// path.resolve(`d:/PDF/${from}_${to}.html`)
          buildPathPdf = `${drive}:/Safety/safety_${from}_${to}.pdf`; //path.resolve(`d:/PDF/froi_${from}_${to}.html`)
        }
        /* write the generated html to file */
        if (collection === "froinoauth") {
          //E:\PDF\froi_Borough of Glen Rock_Onove.pdf
          buildPathHtml = `${drive}:/PDF/froi_${from}_${to}.html`; //  path.resolve('./build.html')// path.resolve(`d:/PDF/${from}_${to}.html`)
          buildPathPdf = `${drive}:/PDF/froi_${from}_${to}.pdf`; //path.resolve(`d:/PDF/froi_${from}_${to}.html`)
        }

        try {
          /* Check if the2 file for `html` build exists in system or not */
          if (doesFileExist(buildPathHtml)) {
            console.log("Deleting old build file");
            fs.unlinkSync(buildPathHtml);
          }
        } catch (error) {
          return false;
        }

        fs.writeFileSync(buildPathHtml, html);
        console.log("Succesfully created an HTML table line 184 createpdf");

        const printPdf = async (buildPathHtml) => {
          console.log("Starting: Generating PDF Process, Kindly wait ..");
          /** Launch a headleass browser */
          const browser = await puppeteer.launch();
          /* 1- Ccreate a newPage() object. It is created in default browser context. */
          const page = await browser.newPage();
          /* 2- Will open our generated `.html` file in the new Page instance. */
          //  let ss={ content:'table { width: 100%; } tr { text-align: left; border: 1px solid black;                 }                  th, td {                    padding: 15px; }tr:nth-child(odd) {background: #CCC}tr:nth-child(even) {background: #FFF}.no-content {background-color: red;}'}
          await page.goto(buildPathHtml, { waitUntil: "networkidle0" });
          // await page.addStyleTag(ss)

          // await page.addStyleTag({ content: '.nav { display: none} .navbar { border: 0px} #print-button {display: none}' })
          /* 3- Take a snapshot of the PDF */
          const pdf = await page.pdf({
            format: "Letter",
            printBackground: true,
            margin: {
              top: "10px",
              right: "10px",
              bottom: "10px",
              left: "10px",
            },
          });
          /* 4- Cleanup: close browser. */
          await sleep(500);
          await browser.close();
          // console.log('Ending: Generating PDF Process');
          return pdf;
        };

        const init = async () => {
          try {
            const pdf = await printPdf(buildPathHtml);
            fs.writeFileSync(buildPathPdf, pdf);
            // console.log('Succesfully created a Froi PDF table');
            //  fs.unlinkSync(buildPathHtml);

            return;
          } catch (error) {
            console.log("Error generating PDF", error);
          }
        };

        init();

        console.log(ct, "/", allct);
        if (allct === ct) {
          console.log("----------------------");
          var resp = { status: "ok" };
          console.log("resp", resp);
          reply.send(resp);
        }
      }
    }
  );
};

// module.exports.autoPrefix = '/apinoauth';
module.exports.autoPrefix = "/api_server";
