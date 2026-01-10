import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyFormbody from '@fastify/formbody';
import { datastar } from '@johntom/datastar-fastify';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import * as fzstd from 'fzstd';

import PRODUCTS from './products.js';

// Load and decompress Bad Apple frames (Go gob-encoded, 36 lines per frame, 96 chars wide)
const badAppleCompressed = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'badapple.zst'));
const badAppleData = fzstd.decompress(badAppleCompressed);
const badAppleText = new TextDecoder().decode(badAppleData);
// Remove carriage returns and split by newline (don't skip line 0 - it contains frame data!)
const rawLines = badAppleText.replace(/\r/g, '').split('\n');
const FRAME_HEIGHT = 36;
const badAppleFrames = [];
// Gob encoding puts markers at start of lines 0, 36, 72... which also contain frame data
// Extract last 96 chars from each line to get the actual frame content
for (let frameIdx = 0; frameIdx < Math.floor(rawLines.length / FRAME_HEIGHT); frameIdx++) {
  const frameLines = [];
  for (let lineIdx = 0; lineIdx < FRAME_HEIGHT; lineIdx++) {
    const rawLineIdx = frameIdx * FRAME_HEIGHT + lineIdx;
    const line = rawLines[rawLineIdx] || '';
    // Clean gob markers and take LAST 96 chars (handles header/marker lines correctly)
    const cleaned = line.replace(/[^\x20-\x7E]/g, '');
    const frameData = cleaned.slice(-96).padEnd(96, ' ');
    frameLines.push(frameData);
  }
  const frame = frameLines.join('\n');
  if (frame.trim()) badAppleFrames.push(frame);
}

// Pre-encode SSE messages at startup (elapsed time calculated at 30fps original timing)
const badAppleSseFrames = badAppleFrames.map((frame, i) => {
  const pct = (i / badAppleFrames.length) * 100;
  const totalSecs = Math.floor(i / 30); // Original 30fps timing
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const elapsed = `${mins}:${secs.toString().padStart(2, '0')}`;
  return `event: datastar-patch-signals\ndata: signals ${JSON.stringify({ _contents: frame, _percentage: pct, _elapsed: elapsed })}\n\n`;
});
console.log(`Bad Apple: ${badAppleFrames.length} frames loaded and pre-encoded`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({ logger: true });

// Register plugins
fastify.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/',
});
fastify.register(fastifyFormbody);
fastify.register(datastar);

// In-memory cart
const cart = [];

// Helper to render product card
function renderProductCard(product) {
  return `<article class="product"><a href="/products/${product.id}"><img src="/images/${product.image}" alt="${product.title}" /><div class="product-content"><h3>${product.title}</h3><p class="product-price">$${product.price}</p></div></a></article>`;
}

// Helper to render cart count
function renderCartCount(count) {
  return `<span id="cart-count">${count > 0 ? `(${count})` : ''}</span>`;
}

// Helper to render cart items
function renderCartItems() {
  if (cart.length === 0) {
    return '<p class="empty-cart">Your cart is empty</p>';
  }
  return cart.map((item, index) => `<li id="cart-item-${index}" class="cart-item"><span class="cart-item-title">${item.title}</span><span class="cart-item-price">$${item.price}</span><button class="cart-item-remove" data-on:click="@delete('/cart/${index}')">x</button></li>`).join('');
}

// Helper to render cart total
function renderCartTotal() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  return total.toFixed(2);
}

fastify.get('/', async (request, reply) => {
  const productsList = PRODUCTS.map(renderProductCard).join('');

  return reply.type('text/html').send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Shop</title>
        <link rel="stylesheet" href="/main.css">
        <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.0-RC.7/bundles/datastar.js"></script>
      </head>
      <body>
        <header id="main-header">
          <div id="main-title">
            <a href="/">
              <img src="/logo.png" alt="Elegant model" />
              <h1>Elegant Clothing</h1>
            </a>
          </div>
        </header>
        <div id="page-content">
          <aside id="cart-sidebar">
            <h2>Cart ${renderCartCount(cart.length)}</h2>
            <ul id="cart-items">
              ${renderCartItems()}
            </ul>
            ${cart.length > 0 ? `<p class="cart-total">Total: $${renderCartTotal()}</p>` : ''}
          </aside>
          <main id="shop">
            <h2>Elegant Clothing For Everyone</h2>
            <ul id="products">
              ${productsList}
            </ul>
          </main>
        </div>
      </body>
    </html>
  `);
});

fastify.get('/products/:id', async (request, reply) => {
  const product = PRODUCTS.find((p) => p.id === request.params.id);

  if (!product) {
    return reply.status(404).send('Product not found');
  }

  return reply.type('text/html').send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${product.title}</title>
        <link rel="stylesheet" href="/main.css">
        <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.0-RC.7/bundles/datastar.js"></script>
      </head>
      <body>
        <header id="main-header">
          <div id="main-title">
            <a href="/">
              <img src="/logo.png" alt="Elegant model" />
              <h1>Elegant Clothing</h1>
            </a>
          </div>
        </header>
        <div id="page-content">
          <aside id="cart-sidebar">
            <h2>Cart ${renderCartCount(cart.length)}</h2>
            <ul id="cart-items">
              ${renderCartItems()}
            </ul>
            ${cart.length > 0 ? `<p class="cart-total">Total: $${renderCartTotal()}</p>` : ''}
          </aside>
          <main id="product">
            <header>
              <img src="/images/${product.image}" alt="${product.title}">
              <div>
                <h1>${product.title}</h1>
                <p id="product-price">$${product.price}</p>
                <div id="cart-actions">
                  <button data-on:click="@post('/cart?productId=${product.id}')" data-indicator:adding>
                    <span data-show="!$adding">Add to Cart</span>
                    <span data-show="$adding">Adding...</span>
                  </button>
                </div>
              </div>
            </header>
            <p id="product-description">${product.description}</p>
          </main>
        </div>
      </body>
    </html>
  `);
});

fastify.post('/cart', async (request, reply) => {
  const productId = request.query.productId;
  const product = PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    return reply.status(404).send('Product not found');
  }

  // Add to cart
  cart.push({ ...product, addedAt: Date.now() });

  await reply.datastar((sse) => {
    // Redirect back to home page
    sse.executeScript('window.location.href = "/"');
  });
});

// Helper to render cart sidebar content (for SSE updates)
function renderCartSidebar() {
  const countHtml = `<h2 id="cart-header">Cart ${renderCartCount(cart.length)}</h2>`;
  const itemsHtml = `<ul id="cart-items">${renderCartItems()}</ul>`;
  const totalHtml = cart.length > 0 ? `<p id="cart-total" class="cart-total">Total: $${renderCartTotal()}</p>` : '<p id="cart-total"></p>';
  return `<aside id="cart-sidebar">${countHtml}${itemsHtml}${totalHtml}</aside>`;
}

fastify.delete('/cart/:index', async (request, reply) => {
  const index = parseInt(request.params.index);

  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
  }

  await reply.datastar((sse) => {
    // Update the entire cart sidebar - HTML must be single line!
    sse.patchElements(renderCartSidebar());
  });
});

// Bad Apple - HTML page
// go takes 1.05 for 30%
// ours 1:22 and 3:35 for entire clip
fastify.get('/bad-apple', async (request, reply) => {
  return reply.type('text/html').send(`<!DOCTYPE html>
<html>
<head>
  <title>Bad Apple - Datastar</title>
  <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.0-RC.7/bundles/datastar.js"></script>
  <style>
    body { background: #000; color: #0f0; font-family: monospace; margin: 0; padding: 10px; display: flex; flex-direction: column; align-items: center; }
    h1 { margin: 10px 0; font-size: 18px; }
    pre { font-size: 12px; line-height: 1.0; margin: 0; white-space: pre; overflow: visible; border: 1px solid #333; padding: 5px; }
    .controls { margin: 10px 0; display: flex; align-items: center; gap: 20px; }
    button { padding: 8px 16px; cursor: pointer; }
    input[type="range"] { width: 200px; }
  </style>
</head>
<body>
  <h1>Bad Apple</h1>
  <div data-signals="{_percentage: 0, _contents: '', _elapsed: '0:00', _playing: false}">
    <div class="controls">
      <button data-show="!$_playing" data-on:click="$_playing = true; @get('/bad-apple/stream')">Start</button>
      <button data-show="$_playing" data-on:click="$_playing = false; window.stop()">Stop</button>
      <span data-text="$_elapsed"></span>
      <span data-text="\`\${$_percentage.toFixed(2)}%\`"></span>
      <input type="range" min="0" max="100" step="0.01" disabled data-attr:value="$_percentage" />
    </div>
  </div>
  <pre style="line-height: 100%" data-text="$_contents"></pre>
</body>
</html>`);
});

// Bad Apple - SSE streaming endpoint (30fps) - raw SSE for performance
fastify.get('/bad-apple/stream', async (request, reply) => {
  const fps = 28;
  const frameTime = 1000 / fps;
  const totalFrames = badAppleSseFrames.length;

  // Raw SSE setup with TCP optimizations
  const raw = reply.raw;
  raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  raw.socket?.setNoDelay(true);
  raw.flushHeaders();

  const startTime = Date.now();
  let aborted = false;
  request.raw.on('close', () => { aborted = true; });

  for (let i = 0; i < totalFrames && !aborted; i++) {
    raw.write(badAppleSseFrames[i]);

    // Drift-correcting delay
    const target = startTime + (i + 1) * frameTime;
    const delay = target - Date.now();
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
  }

  if (!aborted) {
    raw.write(`event: datastar-patch-signals\ndata: signals {"_contents":"Done!","_percentage":100,"_playing":false}\n\n`);
  }
  raw.end();
});
//300
fastify.listen({ port: 3003 }, (err) => {
  fastify.log.info("http://127.0.0.1:3003/bad-apple")
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
