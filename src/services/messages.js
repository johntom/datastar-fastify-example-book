'use strict'

const messages = [
  "Stop overcomplicating it.",
  "Backend controls state.",
  "Props down, Events up.",
  "Flamegraphs don't care about your feelings.",
  "Practice yourself, for heaven's sake, in little things; and thence proceed to greater",
  "Freedom is the only worthy goal in life. It is won by disregarding things that lie beyond our control.",
  "Be the change you want to see.",
  "https://data-star.dev/ 🚀",
];

// Helper function for delays
const sleep = async (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

module.exports = async function (fastify, opts) {

  // Message cycling endpoint - cycles through ALL messages with one click
  fastify.get('/cycle', async (request, reply) => {
    console.log('🔄 Messages /cycle endpoint hit');
    await reply.datastar(async (sse) => {
      // Cycle through ALL messages
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];

        // Update the content with current message
        sse.patchElements(message, {
          selector: "#content",
          mode: "inner"
        });

        // Wait 2 seconds before showing next message (except for the last one)
        if (i < messages.length - 1) {
          await sleep(2000);
        }
      }
    });
  });

}

module.exports.autoPrefix = '/messages';
