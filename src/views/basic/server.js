// server.js - Clean working Fastify + Datastar Todo App (converted to use SDK)
const fastify = require("fastify")({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  },
});
// const app = fastify;
// // Register the Datastar plugin
// app.register(datastar);

const sleep = async (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};
const path = require("path");



const { datastar, GetSSE, PostSSE, escapeHtml, PatchMode } = require('@johntom/datastar-fastify');

// Register the Datastar plugin
fastify.register(datastar);

//  or
// const app = fastify;
// Register the Datastar plugin
// app.register(datastar);


// Register static file handler
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});

// Initialize tasks array
let tasks = [
  { id: 1, text: "Learn Datastar", completed: false },
  { id: 2, text: "Build a project with Fastify", completed: false },
];

// Helper function to render tasks as HTML
function renderTasks() {
  if (tasks.length === 0) {
    return '<p style="color: #888; font-style: italic;">No tasks yet. Add your first task above!</p>';
  }

  return tasks
    .map(
      (task) =>
        `<div class="task ${task.completed ? "completed" : ""}">` +
        `<span>${escapeHtml(task.text)}</span>` +
        `<button data-on-click="${PostSSE(`/todos/${task.id}/toggle`)}">` +
        `${task.completed ? "✓ Mark Incomplete" : "Mark Complete"}` +
        `</button>` +
        `</div>`
    )
    .join("");
}

// Serve the index page
fastify.get("/", async (request, reply) => {
  const tasksHtml = renderTasks();

  return reply.type("text/html").send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Datastar-Nodejs/Fastify Todo List</title>
      <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@main/bundles/datastar.js"></script>
      <style>
        * { box-sizing: border-box; }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        h1 {
          color: white;
          text-align: center;
          margin-bottom: 30px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .counter {
          margin: 20px 0;
          padding: 20px;
          border-radius: 12px;
          background: white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        button {
          padding: 8px 16px;
          margin: 5px;
          cursor: pointer;
          border: none;
          border-radius: 6px;
          background: #667eea;
          color: white;
          font-weight: 500;
          transition: all 0.2s;
        }

        button:hover {
          background: #5568d3;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        button:active {
          transform: translateY(0);
        }

        .task {
          padding: 15px;
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .task:hover {
          background: #e9ecef;
          transform: translateX(4px);
        }

        .task.completed {
          opacity: 0.6;
        }

        .task.completed span {
          text-decoration: line-through;
          color: #6c757d;
        }

        .task button {
          background: #28a745;
          font-size: 12px;
        }

        .task.completed button {
          background: #ffc107;
        }

        input {
          padding: 12px;
          width: 70%;
          margin-right: 10px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #667eea;
        }

        .todo-app {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        .todo-app h2 {
          margin-top: 0;
          color: #343a40;
        }

        #tasks-container {
          margin-top: 20px;
        }

        .input-group {
          display: flex;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>

      <h1>✨ Datastar Nodejs/Fastify Todo List</h1>

      <!-- Test basic signal binding -->
      <div data-signals="{message: ''}" class="counter">
        <h3>Basic Signal Test</h3>
        <input data-bind-message placeholder="Type something..." />
        <p>Echo: <strong><span data-text="$message || '(empty)'"></span></strong></p>
        <div data-computed-uppercase="$message.toUpperCase()">
          Uppercase: <strong><span data-text="$uppercase"></span></strong>
        </div>
      </div>

      <!-- Simple counter -->
      <div data-signals="{count: 0}" class="counter">
        <h3>Counter</h3>
        <div style="font-size: 24px; margin: 10px 0;">
          <strong>Count: </strong><span data-text="$count"></span>
        </div>
        <div>
          <button data-on-click="$count = Number($count) + 1">➕ Increment</button>
          <button data-on-click="$count = Number($count) - 1">➖ Decrement</button>
          <button data-on-click="$count = 0" style="background: #dc3545;">🔄 Reset</button>
        </div>
      </div>


  <!-- Simple HAL -->
        <div data-signals="{message: ''}" class="counter">

        <h3>HAL</h3>
        <p> note: 4 secs to send to #hal2 not hal1</p>
       <div id="hal">
       Waiting
        </div>
          <div id="hal2">

        </div>
          <button data-on-click="${GetSSE('/api/hal')}">➕ test hal </button>
   </div>

     <!-- Simple Timer -->
        <div data-signals="{message: ''}" class="counter">

        <h3>Timer</h3>

       <div id="server-time">
       Waiting
        </div>

          <button data-on-click="${GetSSE('/api/time-stream')}">➕ test timer </button>
   </div>


      <div data-signals="{message: ''}" class="counter">


      <h3>Script Execution</h4>
      <section>
   
      <button data-on-click="${GetSSE('/api/alert')}">Show Alert</button>
      <button data-on-click="${GetSSE('/api/console-log')}">Console Log</button>
    </section>
    </div>

   

      <!-- Todo list -->
      <div data-signals="{newtask: ''}" class="todo-app">
        <h2>📝 My Tasks</h2>

        <div class="input-group">
          <input
            data-bind-newtask
            placeholder="Enter a new task..."
            data-on-keydown.enter="$newtask.trim() && ${PostSSE('/todos')}"
          >
          <button data-on-click="$newtask.trim() && ${PostSSE('/todos')}">➕ Add Task</button>
        </div>

        <div id="tasks-container">
          ${tasksHtml}
        </div>




      </div>

    </body>
    </html>
  `);
});

// Endpoint to add a new task
fastify.post("/todos", async (request, reply) => {
  // Read signals using the SDK
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

  // Use SDK to send SSE response
  await reply.datastar((sse) => {
    sse.patchElements(tasksHtml, {
      selector: "#tasks-container",
      mode: "inner"
    });
    sse.patchSignals({ newtask: "" });
  });
});

// Endpoint to toggle task completion
fastify.post("/todos/:id/toggle", async (request, reply) => {
  const id = parseInt(request.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return reply.status(404).send({ error: "Task not found" });
  }

  task.completed = !task.completed;
  fastify.log.info(
    `Task toggled: "${task.text}" -> ${task.completed ? "completed" : "incomplete"
    }`
  );

  const tasksHtml = renderTasks();

  // Use SDK to send SSE response
  await reply.datastar((sse) => {
    sse.patchElements(tasksHtml, {
      selector: "#tasks-container",
      mode: "inner"
    });
  });
});





fastify.get("/api/time-stream", async (request, reply) => {
  fastify.log.info("time-stream endpoint called!");
  await reply.datastar(async (sse) => {

    // Stream time updates for 5 seconds
    for (let i = 0; i < 10; i++) {
      const time = new Date().toLocaleTimeString();
      sse.patchElements(`<span id="server-time">${i} - ${time}</span>`);
      await sleep(1000);
    }
    sse.patchElements('<span id="server-time">Stream ended</span>');
  });
});

// fastify.get("/api/timer", async (request, reply) => {
//   fastify.log.info("timer endpoint called!");

//   // Use SDK's persistent stream for continuous updates
//   const sse = reply.datastarStream({
//     onAbort: () => {
//       if (intervalId) {
//         clearInterval(intervalId);
//         fastify.log.info("Timer interval cleared - client disconnected");
//       }
//     }
//   });

//   let intervalId;

//   // Send time updates
//   const sendTimeUpdate = () => {
//     if (sse.isClosed) {
//       if (intervalId) clearInterval(intervalId);
//       return;
//     }

//     const dt = new Date().toLocaleTimeString();
//     sse.patchElements(dt, {
//       selector: "#timer",
//       mode: "inner"
//     });

//     fastify.log.info("Sending timer update:", dt);
//   };

//   // Send first update immediately
//   sendTimeUpdate();

//   // Then update every second
//   intervalId = setInterval(sendTimeUpdate, 1000);
// });

fastify.get("/api/hal", async (request, reply) => {
  fastify.log.info("HAL endpoint called!");
  // Use SDK for streaming SSE
  await reply.datastar(async (sse) => {
    // First message - HAL's refusal
    const halresp1 = `I'm sorry, Dave. I'm afraid I can't do that.`;
    sse.patchElements(halresp1, {
      selector: "#hal",
      mode: "inner"
    });
    fastify.log.info("Sending first HAL message");

    // Wait 6 seconds
    await sleep(4000);
    // Second message - waiting for order
    const halresp2 = `Waiting for an order...`;
    sse.patchElements(halresp2, {
      selector: "#hal2",
      mode: "inner"
    });
    fastify.log.info("Sending second HAL message");
  });
});
// Show alert via script execution
fastify.get('/api/alert', async (request, reply) => {
  fastify.log.info("api/alert called!");
  // await reply.datastar((sse) => {
  await reply.datastar(async (sse) => {
    sse.executeScript('alert("Hello from the server!")');
  });
});

fastify.get('/api/console-log', async (request, reply) => {
  // await reply.datastar((sse) => {
  await reply.datastar(async (sse) => {
    sse.consoleLog(`Server says hello at ${new Date().toISOString()}`);
    sse.patchElements(
      '<p id="console-status">Check your browser console!</p>',
      { selector: 'section:last-child', mode: PatchMode.Append }
    );
  });
});


// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    console.log("\n==============================================");
    console.log("🚀 Server running at http://localhost:3001");
    console.log("_==============================================\n");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
