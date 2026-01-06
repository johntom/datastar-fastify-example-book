'use strict';

// Toast notification routes for Datastar

// Messages for random selection
const messages = [
  "Stop overcomplicating it.",
  "Backend controls state.",
  "Props down, Events up.",
  "Flamegraphs don't care about your feelings.",
  "Practice yourself, for heaven's sake, in little things; and thence proceed to greater",
  "Freedom is the only worthy goal in life. It is won by disregarding things that lie beyond our control.",
  "Be the change you want to see.",
  "https://data-star.dev/"
];

// Helper to get random message
const getRandomMessage = () => messages[Math.floor(Math.random() * messages.length)];

module.exports = async function (fastify, opts) {

  // Toast endpoint - generic toast
  fastify.get("/show", async (request, reply) => {
    const message = getRandomMessage();
    const toastHtml = `
      <div
        class="toast toast-entering"
        style="--toast-duration: 5000ms"
        data-on:animationend="event.animationName?.startsWith('toast-in') && el.classList.remove('toast-entering');event.animationName?.startsWith('toast-out') && el.remove()"
      >
        <div class="toast-body" style="color: blue;">Toast! ${message}</div>
        <div
          class="toast-progress"
          data-on:animationend="el.closest('.toast')?.classList.add('toast-leaving')"
        ></div>
      </div>
    `;

    await reply.datastar(async (sse) => {
      sse.patchElements(toastHtml, {
        selector: ".toast-container",
        mode: "append"
      });
    });
  });

  // Success toast endpoint
  fastify.get("/success", async (request, reply) => {
    const timestamp = new Date().toLocaleTimeString();
    const toastHtml = `
      <div
        class="toast toast-entering"
        style="--toast-duration: 5000ms; background-color: #d4edda; border-color: #28a745;"
        data-on:animationend="event.animationName?.startsWith('toast-in') && el.classList.remove('toast-entering');event.animationName?.startsWith('toast-out') && el.remove()"
      >
        <div class="toast-body" style="color: #155724;">✓ Success! Operation completed at ${timestamp}</div>
        <div
          class="toast-progress"
          style="background-color: #28a745;"
          data-on:animationend="el.closest('.toast')?.classList.add('toast-leaving')"
        ></div>
      </div>
    `;

    await reply.datastar(async (sse) => {
      sse.patchElements(toastHtml, {
        selector: ".toast-container",
        mode: "append"
      });
    });
  });

  // Error toast endpoint
  fastify.get("/error", async (request, reply) => {
    const timestamp = new Date().toLocaleTimeString();
    const toastHtml = `
      <div
        class="toast toast-entering"
        style="--toast-duration: 5000ms; background-color: #f8d7da; border-color: #f44336;"
        data-on:animationend="event.animationName?.startsWith('toast-in') && el.classList.remove('toast-entering');event.animationName?.startsWith('toast-out') && el.remove()"
      >
        <div class="toast-body" style="color: #721c24;">✗ Error! Something went wrong at ${timestamp}</div>
        <div
          class="toast-progress"
          style="background-color: #f44336;"
          data-on:animationend="el.closest('.toast')?.classList.add('toast-leaving')"
        ></div>
      </div>
    `;

    await reply.datastar(async (sse) => {
      sse.patchElements(toastHtml, {
        selector: ".toast-container",
        mode: "append"
      });
    });
  });

};

module.exports.autoPrefix = '/toast';
