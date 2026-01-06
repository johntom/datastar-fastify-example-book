

// helloworld.js - Fastify + Datastar Hello World Demo (converted to use SDK)
const fastify = require("fastify")({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  },
});

const { datastar, GetSSE } = require("@johntom/datastar-fastify-sdk");

// Helper function for delays
const sleep = async (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

// Register the Datastar plugin
fastify.register(datastar);

const port = 3003;
const message = "Hello, world!";

// Serve the index page
fastify.get("/", async (request, reply) => {
  return reply.type("text/html").send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Datastar SDK Demo</title>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.7/bundles/datastar.js"></script>
</head>
<body class="bg-white dark:bg-gray-900 text-lg max-w-xl mx-auto my-16">
    <div data-signals:delay="400" class="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5 space-y-2">
        <div class="flex justify-between items-center">
            <h1 class="text-gray-900 dark:text-white text-3xl font-semibold">
                Datastar SDK Demo
            </h1>
            <img src="https://data-star.dev/static/images/rocket-64x64.png" alt="Rocket" width="64" height="64"/>
        </div>
        <p class="mt-2">
            SSE events will be streamed from the backend to the frontend.
        </p>
        <div class="space-x-2">
            <label for="delay">
                Delay in milliseconds
            </label>
            <input data-bind:delay id="delay" type="number" step="100" min="0" class="w-36 rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-sky-500 focus:outline focus:outline-sky-500 dark:disabled:border-gray-700 dark:disabled:bg-gray-800/20" />
        </div>
        <button data-on:click="@get(&#39;/hello-world&#39;)" class="rounded-md bg-sky-500 px-5 py-2.5 leading-5 font-semibold text-white hover:bg-sky-700 hover:text-gray-100 cursor-pointer">
            Start
        </button>
    </div>
    <div class="my-16 text-8xl font-bold text-transparent" style="background: linear-gradient(to right in oklch, red, orange, yellow, green, blue, blue, violet); background-clip: text">
        <div id="message">Hello, world!</div>
    </div>
</body>
</html>
  `);
});

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

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: port, host: "127.0.0.1" });
    console.log(`\n✨ Server running at http://localhost:${port}`);
    console.log(`   Open your browser and click 'Start' to see the demo!\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();