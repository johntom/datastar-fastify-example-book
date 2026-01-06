"use strict";

const path = require("path");
const fs = require("fs-extra");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc"); // ES 2015
//  bad const { PatchMode } = require('@johntom/datastar-fastify-sdk');
const { PatchMode } = require('@johntom/datastar-fastify');
dayjs.extend(utc);
//   val = dayjs.utc(val.toLocaleString()).format('MM/DD/YYYY')
let froiName, sroiName; // iniversal
const NCCI_Class_Codesvals = `
    <select class="form-select" name="b160_Employee_NCCI_Class_Code"  id="b160_Employee_NCCI_Class_Code" aria-label="Select NCCI" required="required">
    <option value="">--Please choose an option--</option>
    <option >0042 Landscape/Parks</option>

    <option >3632 Machine Shop</option>
    <option >5509 Street / Road Department</option>
    <option >7381 Bus Operator - School & Driver</option>
    <option>7520 Water Department</option>
    <option >7539 Electric Department</option>
   <option >7580 Sewage Disposal Plant</option>
<option>7610 Radio Station</option>
<option>7710 Fire Department - Paid</option>
<option>7711 Fire Department - Volunteer</option>
<option>7714 First Aid/Rescue - Paid</option>
<option>7715 First Aid - Volunteer</option>
<option>7720 Police/Sheriff\'s department</option>
<option>7727 Crossing Guard</option>
<option>7728 Off Duty Police</option>
<option>8397 Auto Garage/Repair Shop</option>
<option>8810 Clerical (Includes Administrative</option>
<option>8820 Attorney - All Employees & Clerical</option></option>
<option>8829 Assisted Living Facility</option>
<option>8838 Library</option>
<option>8868 Schools - Professional Employees/Clerical</option>
<option>9015 Building Department</option>
<option>9033 Housing Authority</option>
<option>9045 Hospital Employees - Including Nurses</option>
<option>9053 Lifeguard</option>
<option>9102 Parks Department</option>
<option>9106 Schools - Non-Professional Employees</option>
<option>9182 Golf Course - Public</option>
<option>9402 Sewer Cleaning</option>
<option>9403 Garbage Removal</option>
<option>9410 Municipal Employees (All other)</option>
<option>9420 Volunteer First Aid</option>
<option>9430 Volunteer Firefighter</option>
<option>9554 Sign Installation/Removal</option>
    </select> 
    `;
const initTreatmentvals = `
     <select class="form-select" name="d101_medical_Initial_Treatment" id="d101_medical_Initial_Treatment" aria-label="Select init" required="required">
  
    <option value="">--Please choose an option--</option> 
       <option>No medical Treatment  </option>
       <option>Minor Treatment by Employer  </option>
       <option>Minor Clinic Hospital  </option>
       <option>Emergency Care  </option>
       <option>Hospitalized greater than 24 hours  </option>
       <option>Future major medical/lost time anticipated </option>
    </select>`;
const NCCI_Class_CodesvalsSpanish = `
    <select class="form-select" name="b160_Employee_NCCI_Class_Code"  id="b160_Employee_NCCI_Class_Code" aria-label="Select State" required="required">
     <option value="">--Please choose an option--</option>
   <option>0042 Paisajismo/Parques</option>
<option>3632 Taller Mecánico</option>
<option>5509 Departamento de Calles/Carreteras</option>
<option>7381 Operador de Autobús - Escolar y Conductor</option>
<option>7520 Departamento de Agua</option>
<option>7539 Departamento Eléctrico</option>
<option>7580 Planta de Tratamiento de Aguas Residuales</option>
<option>7610 Estación de Radio</option>
<option>7710 Departamento de Bomberos - Remunerado</option>
<option>7711 Departamento de Bomberos - Voluntario</option>
<option>7714 Primeros Auxilios/Rescate - Remunerado</option>
<option>7715 Primeros Auxilios - Voluntario</option>
<option>7720 Departamento de Policía/Sheriff</option>
<option>7727 Guardia de Cruce</option>
<option>7728 Policía Fuera de Servicio</option>
<option>8397 Garaje/Taller de Reparación de Autos</option>
<option>8810 Oficinista (Incluye Administrativo)</option>
<option>8820 Abogado - Todos los Empleados y Oficinistas</option>
<option>8829 Hogar de Cuidado Asistido</option>
<option>8838 Biblioteca</option>
<option>8868 Escuelas - Empleados Profesionales/Oficinistas</option>
<option>9015 Departamento de Construcción</option>
<option>9033 Autoridad de Vivienda</option>
<option>9045 Empleados de Hospital - Incluyendo Enfermeras</option>
<option>9053 Salvavidas</option>
<option>9102 Departamento de Parques</option>
<option>9106 Escuelas - Empleados No Profesionales</option>
<option>9182 Campo de Golf - Público</option>
<option>9402 Limpieza de Alcantarillas</option>
<option>9403 Recolección de Basura</option>
<option>9410 Empleados Municipales (Todos los demás)</option>
<option>9420 Primeros Auxilios Voluntarios</option>
<option>9430 Bombero Voluntario</option>
<option>9554 Instalación/Remoción de Señales</option>
    </select>`;
const initTreatmentvalsSpanish = `
     <select class="form-select" name="d101_medical_Initial_Treatment" id="d101_medical_Initial_Treatment" aria-label="Select init" required="required">
   <option value="">Sin Tratamiento Médico</option>
<option>Tratamiento Menor por el Empleador</option>
<option>Clínica Menor u Hospital</option>
<option>Atención de Emergencia</option>
<option>Hospitalizado más de 24 horas</option>
<option>Se anticipa tratamiento médico mayor/tiempo perdido futuro</option>
    </select>`;

// LOCAL - All backend APIs are now running in this same server
// For PDF URLs that are served to the browser, we use the current server
// let rooturl = `http://${process.env.host || 'localhost'}:${process.env.port || 80}/`;
////////////////////////////////////////////////////////////////////////////////////////////////
/// KEEP IT FULL STACK no calls to api
// let rooturl = './'   
let rooturl = '/'   


// let rooturl = 'http://10.1.215.190/'


let today = dayjs().utc(true).format("MM/DD/YYYY");

console.log("📅 Today dayjs.utc.toLocaleString", today);
module.exports = async function (fastify, opts) {
  
  fastify.get("/ncci", {}, async (req, reply) => {
    console.log("req ", req);

    reply.send(NCCI_Class_Codesvals);
  });
  fastify.get("/nccispanish", {}, async (req, reply) => {
    console.log("req ", req);

    reply.send(NCCI_Class_CodesvalsSpanish);
  });

  fastify.post("/submit", async (request, reply) => {
    const body = request.body;
    //   //http://localhost:8080/api/gallery/getonepdf/froi/0/
    // froi_jrt77_Tomas.pdf
    console.log("in /submit", body);
    body.b100_Employee_Last_Name = body.b100_Employee_Last_Name
      .replace(/<script.*?>.*?<\/script>/gi, "")
      .replace(/[^\w\s.,;:!?()-]/gi, "");
    body.a1_Employer_Name = body.a1_Employer_Name
      .replace(/<script.*?>.*?<\/script>/gi, "")
      .replace(/[^\w\s.,;:!?()-]/gi, "");
    froiName = `froi_${body.a1_Employer_Name}_${body.b100_Employee_Last_Name}.pdf`;
    delete body.pass;
    body.updatedAt = today;

    try {
      const response = await fastify.inject({
        method: "POST",
        // url: "/apinoauth/brm/froi",
           url: "/api_server/brm/froi",
        headers: {
          "Content-Type": "application/json",
        },
        payload: body,
      });
      const data = JSON.parse(response.payload);
      console.log(data);
    } catch (error) {
      console.error(error);
    }


    reply.send(froiName); // Return froiName to client
  });
  
  fastify.post("/submitsroi", async (request, reply) => {
    const body = request.body;
    delete body.pass;
    body.updatedAt = today;
    console.log("in /submit", body);

    body.a_Employer_Name = body.a_Employer_Name
      .replace(/<script.*?>.*?<\/script>/gi, "")
      .replace(/[^\w\s.,;:!?()-]/gi, "");
    body.b_Employee_Last_Name = body.b_Employee_Last_Name
      .replace(/<script.*?>.*?<\/script>/gi, "")
      .replace(/[^\w\s.,;:!?()-]/gi, "");
    sroiName = `safety_${body.a_Employer_Name}_${body.b_Employee_Last_Name}.pdf`;

    console.log("in /submit sroiName", sroiName);
    //safety_Borough of New Milford_Connor O'Grady

    try {
      const response = await fastify.inject({
        method: "POST",
        url: "/api_server/brm/sroi",
        headers: {
          "Content-Type": "application/json",
        },
        payload: body,
      });
      const data = JSON.parse(response.payload);
      console.log(data);
    } catch (error) {
      console.error(error);
    }

    reply.send(sroiName); // Return sroiName to client
  });
  fastify.get("/sroipdf_aftersubmit", {}, async (req, reply) => {
    let ht = `${rooturl}api_pdf/gallery/getonepdf/sroi/0/${sroiName}`;
    // Check if PDF exists before showing button
    try {
      const checkResponse = await fetch(ht, { method: "HEAD" });
      if (!checkResponse.ok) {
        let text = `<div class="alert alert-warning">PDF is being generated, please wait and try again...</div><button onclick="fetch('/api/sroipdf_aftersubmit').then(r => r.text()).then(html => { document.getElementById('pdf-container').innerHTML = html; })">Retry</button>`;
        console.log("PDF not ready yet:", froiName);
        reply.send(text);
        return;
      }
    } catch (error) {
      let text = `<div class="alert alert-warning">PDF is being generated, please wait and try again...</div><button onclick="fetch('/api/sroipdf_aftersubmit').then(r => r.text()).then(html => { document.getElementById('pdf-container').innerHTML = html; })">Retry</button>`;
      console.log("Error checking PDF:", error.message);
      reply.send(text);
      return;
    }

    let text = `<a id="pdf-link" href='${ht}' target="_blank"><button>Open Pdf</button></a><script>setTimeout(() => document.getElementById('pdf-link').click(), 50);</script>`;
    console.log("sroipdf_aftersubmit text ", text);
    reply.send(text);
  });
 
  // FROI
  fastify.get("/froipdf_aftersubmit", {}, async (req, reply) => {
    //froiName = `froi_ ${body.a1_Employer_Name}_${body.b100_Employee_Last_Name}.pdf`

    //let ht = `http://localhost:8080/api/gallery/getonepdf/froi/0/${froiName}`
    let ht = `${rooturl}api_pdf/gallery/getonepdf/froi/0/${froiName}`;
    console.log("ht=======================", ht);
    // Check if PDF exists before showing button
    try {
      const checkResponse = await fetch(ht, { method: "HEAD" });
      if (!checkResponse.ok) {
        let text = `<div class="alert alert-warning">PDF is being generated, please wait and try again...</div><button onclick="fetch('/api/froipdf_aftersubmit').then(r => r.text()).then(html => { document.getElementById('pdf-container').innerHTML = html; })">Retry</button>`;
        console.log("PDF not ready yet:", froiName);
        reply.send(text);
        return;
      }
    } catch (error) {
      let text = `<div class="alert alert-warning">PDF is being generated, please wait and try again...</div><button onclick="fetch('/api/froipdf_aftersubmit').then(r => r.text()).then(html => { document.getElementById('pdf-container').innerHTML = html; })">Retry</button>`;
      console.log("Error checking PDF:", error.message);
      reply.send(text);
      return;
    }

    let text = `<a id="pdf-link" href='${ht}' target="_blank"><button>Open Pdf</button></a><script>setTimeout(() => document.getElementById('pdf-link').click(), 50);</script>`;
    console.log("froipdf_aftersubmit text ", text);
    reply.send(text);
  });

  fastify.get("/treatment", {}, async (req, reply) => {
    console.log("in treatment");
    console.log("req ", req);
    reply.send(initTreatmentvals);
  });
 
  fastify.get("/admin", async (request, reply) => {
    const data = {
      title: "Froi Form",
      formAction: "froi",
      csrfToken: generateCsrfToken(request),
    };
    const html = await reply.view("./froi/froi.njk", all_data);
    return minifyHtml(html);
  });
  fastify.get("/tomselect", async (request, reply) => {
    const data = {
      title: "froiBootstrap Form",
      formAction: "froi",
      csrfToken: generateCsrfToken(request),
    };
    const html = await reply.view("./tomselect/index.html");
    return minifyHtml(html);
  });
 
  fastify.post("/foo", async (request, reply) => {
    // console.log('in /foo', request.body);
    console.log("in post/foo");
    reply.send("foo ");
  });

  fastify.get("/foo", async (request, reply) => {
    console.log("in get/foo");
    // let rooturl= 'https://audit2.brmflow.com/'
    reply.send("foo ");
  });

  fastify.get('/:database/:collection/:id', {
    // preValidation: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          database: {
            description: 'The database name',
            // summary: 'The database name',
            type: 'string'
          },
          collection: {
            description: 'The collection name',
            // summary: 'The collection name',
            type: 'string'
          },
          id: {
            description: 'The document id',
            // summary: 'The document id',
            type: 'string'
          }
        }
      }
    }
  },
    async (req, reply) => {

      const {
        database,
        collection,
        id
      } = req.params;
      const entity = getEntity(database, collection);
      console.log('get _id===collection========= ', collection, id)
      const { ObjectId } = require('mongodb');
      const _id = new ObjectId(id);
      //  --  -- ${req.session.authenticated}
      console.log(`===============reply======================${_id}`) //[0].lastName} `)
      // if (req.session.authenticated) {

      const result = await entity.
      findOne({
        _id
      });
      // 
      // fastify.io.sockets.emit('lobby', result);
      //   return {database, collection, id, _id, result};
      //  } else result = 'not autenticated'
      // console.log('===result========= ', result)
      // // return {result};
      // return { data: result };

      var resp = { "data": result };
      console.log(resp);
      reply.send(resp);

    }
  );

  // POST - Create document
  fastify.post('/:database/:collection', async (req, reply) => {
    const { database, collection } = req.params;
    const insertData = req.body;

    console.log('POST route called for:', database, collection);
    console.log('Insert data:', insertData);

    try {
      const entity = getEntity(database, collection);
      const result = await entity.insertOne(insertData);

      console.log('Insert result:', result);

      return reply.send({
        success: true,
        insertedId: result.insertedId,
        _id: result.insertedId.toString()
      });
    } catch (error) {
      console.error('Error inserting document:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // Get (Retreive)
  // http://localhost:8080/apinoauth/brm/user/5865d34214e11d6bfafd191d
///////////////////////// BOOK
fastify.get('/:database/:collection',
    {

      schema: {
        params: {
          type: 'object',
          properties: {
            database: {
              description: 'The database name',
              // summary: 'The database name',
              type: 'string'
            },
            collection: {
              description: 'The collection name',
              // summary: 'The collection name',
              type: 'string'
            }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            filter: {
              description: 'The filter criteria as a JSON string',
              // summary: 'The filter criteria',
              type: 'string'
            },
            orderBy: {
              description: 'The orderBy expression as a JSON string',
              // summary: 'The orderBy expression',
              type: 'string'
            },
            limit: {
              description: 'The limit ',
              // summary: 'The limit',
              type: 'integer'
            },
            skip: {
              description: 'The ,skip ',
              // summary: 'The skip',
              type: 'integer'
            },
            fo: {
              description: 'The find one flag',
              // summary: 'Find one',
              type: 'boolean'
            },
            f: {
              description: 'The fields object',
              // summary: 'The fields object',
              type: 'string'
            },
            c: {
              description: 'Count the number of documents',
              // summary: 'Count',
              type: 'boolean'
            }
          },
          required: []
        },

      },
  
    },
    async (req, reply) => {
      const { database, collection, option } = req.params;
      const { filter, orderBy, limit = 0, skip = 0, fo = false, f = null, c = false, ci, filterregex } = req.query;
      let query = {};
      let sort = {};
      let project = {};
      let findOne = fo;

      if (filter) {
        console.log('filter', filter)
        // query = JSON.parse(filter);//, reviver);
        query = JSON.parse(filter, reviver);

        console.log('query', query)
      }

      // console.log("filter", filter) //[0].lastName} `)

      if (orderBy) {
       
        sort = JSON.parse(orderBy)//, reviver);
      }
      // if(sort==="{POID:-1}") sort={POID:-1}
      // console.log('orderBy  ', ' sort ', sort)
      // console.log('limit ', limit)
      // console.log('query +', query)



      if (f) {
        console.log(f);
        project = JSON.parse(f);
      }
      // console.log('project +', project)

      const entity = getEntity(database, collection);
      let result;
      if (findOne) {
        if (f) {
          result = await entity.findOne(query, {
            projection: project
          });
        } else {
          result = await entity.findOne(query);
        }
      } else {
        if (f) {
          // let pp={POID:1,VendorID:1}
          result = await entity.find(query).project(project).sort(sort).skip(+skip).limit(+limit).toArray();
        } else {
          if (c) {
            result = await entity.find(query).count();
          } else {
            result = await entity.find(query).sort(sort).skip(+skip).limit(+limit).toArray();
            //  result = await entity.find(query).toArray();
          }
        }
      }

      // @guivic/fastify-socket.io'
      // fastify.io.sockets.emit('lobby', result);
      console.log('result', result.length)
      console.log('=======================')


      reply.send({ "data": result })



    }
  );

  // PUT - Update document
  fastify.put('/:database/:collection', async (req, reply) => {
    const { database, collection } = req.params;
    const updateData = req.body;

    console.log('PUT route called for:', database, collection);
    console.log('Update data:', updateData);

    if (!updateData._id) {
      return reply.status(400).send({ error: '_id is required for update' });
    }

    try {
      const entity = getEntity(database, collection);
      const { ObjectId } = require('mongodb');
      const _id = new ObjectId(updateData._id);

      // Remove _id from update data to avoid MongoDB error
      const { _id: removedId, ...dataToUpdate } = updateData;

      const result = await entity.updateOne(
        { _id },
        { $set: dataToUpdate }
      );

      console.log('Update result:', result);

      return reply.send({
        success: true,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        data: updateData
      });
    } catch (error) {
      console.error('Error updating document:', error);
      return reply.status(500).send({ error: error.message });
    }
  });
// Helper function for delays
const sleep = async (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

const message = "Hello, world!";
// Streaming SSE endpoint that reveals message character by character
fastify.get("/hello-world", async (request, reply) => {
  // Read signals from the request (delay is sent from the input field)
  const result = await request.readSignals();
  const delay = result.signals?.delay || 400;

  // Use the SDK's datastar method for streaming SSE
  await reply.datastar(async (sse) => {
    // Stream the message character by character
    for (let i = 0; i < message.length; i++) {
      const partialMessage = message.substring(0, i + 1);

      // Use patchElements to update the #message element
      sse.patchElements(partialMessage, {
        selector: "#message",
        mode: "inner"
      });

      // Wait for the specified delay before sending next character
      if (i < message.length - 1) {
        await sleep(delay);
      }
    }
  });
});

// ========================================
// Basic Examples API Endpoints
// ========================================

// Initialize tasks array for basic example
let tasks = [
  { id: 1, text: "Learn Datastar", completed: false },
  { id: 2, text: "Build a project with Fastify", completed: false },
];

// Helper function to escape HTML for basic example
function escapeHtmlBasic(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Helper function to render tasks as HTML
function renderTasks() {
  if (tasks.length === 0) {
    return '<p style="color: #888; font-style: italic;">No tasks yet. Add your first task above!</p>';
  }

  return tasks
    .map(
      (task) =>
        `<div class="task ${task.completed ? "completed" : ""}">` +
        `<span>${escapeHtmlBasic(task.text)}</span>` +
        `<button data-on:click="@post('/api/todos/${task.id}/toggle')">` +
        `${task.completed ? "✓ Mark Incomplete" : "Mark Complete"}` +
        `</button>` +
        `</div>`
    )
    .join("");
}

// Get tasks for basic example
fastify.get("/tasks", async (request, reply) => {
  const tasksHtml = renderTasks();
  return reply.send({ tasksHtml: tasksHtml });
});

// Endpoint to add a new task (basic example)
fastify.post("/todos", async (request, reply) => {
  const result = await request.readSignals();
  const newTaskText = result.signals?.newtask || result.signals?.newTask;

  if (!newTaskText || newTaskText.trim() === "") {
    return reply.status(400).send({ error: "Task text is required" });
  }

  const newTask = {
    id: tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1,
    text: newTaskText.trim(),
    completed: false,
  };

  tasks.push(newTask);
  fastify.log.info(`Task added: "${newTask.text}"`);

  const tasksHtml = renderTasks();

  await reply.datastar((sse) => {
    sse.patchElements(tasksHtml, {
      selector: "#tasks-container",
      mode: "inner"
    });
    sse.patchSignals({ newtask: "" });
  });
});

// Endpoint to toggle task completion (basic example)
fastify.post("/todos/:id/toggle", async (request, reply) => {
  const id = parseInt(request.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return reply.status(404).send({ error: "Task not found" });
  }

  task.completed = !task.completed;
  fastify.log.info(
    `Task toggled: "${task.text}" -> ${task.completed ? "completed" : "incomplete"}`
  );

  const tasksHtml = renderTasks();

  await reply.datastar((sse) => {
    sse.patchElements(tasksHtml, {
      selector: "#tasks-container",
      mode: "inner"
    });
  });
});

// Time stream endpoint
fastify.get("/time-stream", async (request, reply) => {
  fastify.log.info("time-stream endpoint called!");
  await reply.datastar(async (sse) => {
    for (let i = 0; i < 10; i++) {
      const time = new Date().toLocaleTimeString();
      sse.patchElements(`<span id="server-time">${i} - ${time}</span>`);
      await sleep(1000);
    }
    sse.patchElements('<span id="server-time">Stream ended</span>');
  });
});

// HAL endpoint
fastify.get("/hal", async (request, reply) => {
  fastify.log.info("HAL endpoint called!");
  await reply.datastar(async (sse) => {
    const halresp1 = `I'm sorry, Dave. I'm afraid I can't do that.`;
    sse.patchElements(halresp1, {
      selector: "#hal",
      mode: "inner"
    });
    fastify.log.info("Sending first HAL message");

    await sleep(4000);

    const halresp2 = `Waiting for an order...`;
    sse.patchElements(halresp2, {
      selector: "#hal2",
      mode: "inner"
    });
    fastify.log.info("Sending second HAL message");
  });
});

// Show alert via script execution
fastify.get('/alert', async (request, reply) => {
  fastify.log.info("api/alert called!");
  await reply.datastar(async (sse) => {
    sse.executeScript('alert("Hello from the server!")');
  });
});

// Console log endpoint
fastify.get('/console-log', async (request, reply) => {
  await reply.datastar(async (sse) => {
    sse.consoleLog(`Server says hello at ${new Date().toISOString()}`);
    sse.patchElements(
      '<p id="console-status">Check your browser console!</p>',
      { selector: 'section:last-child', mode: 'append' }
    );
  });
});

// ========================================
// Todo App API Endpoints
// ========================================

// In-memory store for todos
const todos = new Map();

// Seed some initial data
todos.set('1', { id: '1', text: 'Learn Datastar', completed: true, createdAt: new Date() });
todos.set('2', { id: '2', text: 'Build something awesome', completed: false, createdAt: new Date() });
todos.set('3', { id: '3', text: 'Share with the world', completed: false, createdAt: new Date() });

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Escape HTML for todos
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Render a single todo item
function renderTodoItem(todo) {
  return `
    <li id="todo-${todo.id}" class="todo-item ${todo.completed ? 'completed' : ''}">
      <input
        type="checkbox"
        ${todo.completed ? 'checked' : ''}
        data-on:change="@post('/api/todosapp/${todo.id}/toggle')"
      />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <button
        class="delete-btn"
        data-on:click="@delete('/api/todosapp/${todo.id}')"
      >×</button>
    </li>
  `;
}

// Render the todo list
function renderTodoList(filter = 'all') {
  let filtered = Array.from(todos.values());

  if (filter === 'active') {
    filtered = filtered.filter(t => !t.completed);
  } else if (filter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  if (filtered.length === 0) {
    return '<li id="empty-state" class="empty">No todos yet!</li>';
  }

  return filtered.map(renderTodoItem).join('');
}

// Render the footer with counts and filters
function renderFooter(activeFilter) {
  const total = todos.size;
  const active = Array.from(todos.values()).filter(t => !t.completed).length;
  const completed = total - active;

  return `
    <footer id="todo-footer" class="footer">
      <span class="count">${active} item${active !== 1 ? 's' : ''} left</span>
      <div class="filters">
        <button
          class="${activeFilter === 'all' ? 'active' : ''}"
          data-on:click="@post('/api/todosapp/filter/all')"
        >All</button>
        <button
          class="${activeFilter === 'active' ? 'active' : ''}"
          data-on:click="@post('/api/todosapp/filter/active')"
        >Active</button>
        <button
          class="${activeFilter === 'completed' ? 'active' : ''}"
          data-on:click="@post('/api/todosapp/filter/completed')"
        >Completed</button>
      </div>
      ${completed > 0 ? `
        <button
          class="clear-completed"
          data-on:click="@post('/api/todosapp/clear-completed')"
        >Clear completed (${completed})</button>
      ` : ''}
    </footer>
  `;
}

// Get all todos
fastify.get('/todosapp', async (request, reply) => {
  const todosArray = Array.from(todos.values());
  return reply.send({ todos: todosArray });
});

// Create a new todo (using /todosapp to avoid conflict with basic /todos)
fastify.post('/todosapp', async (request, reply) => {
  const result = await request.readSignals();
  const text = result.signals?.newTodoText?.trim();

  if (!text) {
    return reply.datastar((sse) => {
      sse.patchSignals({ error: 'Please enter a todo!' });
    });
  }

  const id = generateId();
  const todo = {
    id,
    text,
    completed: false,
    createdAt: new Date(),
  };

  todos.set(id, todo);

  await reply.datastar((sse) => {
    sse.patchSignals({ newTodoText: '', error: '' });
    sse.patchElements(renderTodoItem(todo), {
      selector: '#todo-list',
      mode: PatchMode.Append,
    });
    sse.patchElements(renderFooter(result.signals?.filter || 'all'));
  });
});

// Toggle todo completion
fastify.post('/todosapp/:id/toggle', async (request, reply) => {
  const { id } = request.params;
  const result = await request.readSignals();
  const todo = todos.get(id);

  if (!todo) {
    return reply.status(404).send({ error: 'Todo not found' });
  }

  todo.completed = !todo.completed;

  await reply.datastar((sse) => {
    sse.patchElements(renderTodoItem(todo));
    sse.patchElements(renderFooter(result.signals?.filter || 'all'));
  });
});

// Delete a todo
fastify.delete('/todosapp/:id', async (request, reply) => {
  const { id } = request.params;
  const result = await request.readSignals();

  if (!todos.has(id)) {
    return reply.status(404).send({ error: 'Todo not found' });
  }

  todos.delete(id);

  await reply.datastar((sse) => {
    sse.removeElements(`#todo-${id}`);

    if (todos.size === 0) {
      sse.patchElements('<li id="empty-state" class="empty">No todos yet!</li>', {
        selector: '#todo-list',
        mode: PatchMode.Inner,
      });
    }
    sse.patchElements(renderFooter(result.signals?.filter || 'all'));
  });
});

// Filter todos
fastify.post('/todosapp/filter/:filter', async (request, reply) => {
  const { filter } = request.params;

  await reply.datastar((sse) => {
    sse.patchSignals({ filter });
    sse.patchElements(renderTodoList(filter), {
      selector: '#todo-list',
      mode: PatchMode.Inner,
    });
    sse.patchElements(renderFooter(filter));
  });
});

// Clear completed todos
fastify.post('/todosapp/clear-completed', async (request, reply) => {
  const result = await request.readSignals();

  for (const [id, todo] of todos) {
    if (todo.completed) {
      todos.delete(id);
    }
  }

  await reply.datastar((sse) => {
    sse.patchElements(renderTodoList(result.signals?.filter || 'all'), {
      selector: '#todo-list',
      mode: PatchMode.Inner,
    });
    sse.patchElements(renderFooter(result.signals?.filter || 'all'));
  });
});

const citiesByCountry = {
  usa: [
    { code: 'nyc', name: 'New York' },
    { code: 'la', name: 'Los Angeles' },
    { code: 'chi', name: 'Chicago' },
  ],
  canada: [
    { code: 'tor', name: 'Toronto' },
    { code: 'van', name: 'Vancouver' },
    { code: 'mtl', name: 'Montreal' },
  ]}
  
  function getCitiesForCountry(country) {
  return citiesByCountry[country] || [];
}

fastify.get('/cities', async (request, reply) => {
  // console.log('=== /cities endpoint hit ===');
  // console.log('query:', request.query);
  
  // Read directly from query param
  const country = request.query.country;
  // console.log('country value:', country);
  
  if (!country) {
    console.log('No country - returning disabled select');
    await reply.datastar((sse) => {
      sse.patchElements(`
        <select name="city" disabled>
          <option>Select country first</option>
        </select>
      `, {
        selector: '#cities-container',
        mode: 'inner'
      });
    });
    return;
  }
  
  const cities = getCitiesForCountry(country);
  console.log('cities found:', cities);
  
  const options = cities.map(city => 
    `<option value="${city.code}">${city.name}</option>`
  ).join('');

  await reply.datastar((sse) => {
    sse.patchElements(`
      <select name="city">
        <option value="">Choose city...</option>
        ${options}
      </select>
    `, {
      selector: '#cities-container',
      mode: 'inner'
    });
  });
});
  function generateCsrfToken(request) {
    const token =
      Math.random().toString(36).substring(2, 15) +
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

  function getEntity(database, collection) {
    // const db = fastify.mongo.db(database);
    const entity = fastify.mongo[database].db.collection(collection);
    return entity;
  }


};
module.exports.autoPrefix = "/api";




  //  myHeaders.append("Accept", 'application/json');
  //  myHeaders.append("Content-Type", 'multipart/form-data');
  // 'User-Agent': 'undici-stream-example',
  // 'Content-Type': 'application/json'
  // fastify.post("/printPDF", async (request, reply) => {
  //   const body = request.body;
  //   try {
  //     const response = await fastify.inject({
  //       method: "POST",
  //       url: "/apinoauth/brm/froi",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Accept: "application/json",
  //       },
  //       payload: body,
  //     });
  //     const data = JSON.parse(response.payload);
  //     console.log(data);
  //   } catch (error) {
  //     console.error(error);
  //   }
  //   reply.send("Submit Froi");
  // });
  