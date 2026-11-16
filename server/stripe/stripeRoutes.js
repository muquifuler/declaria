import { createCheckout, createPortal, getSession, processWebhook, publicPlans } from './stripeService.js';

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const raw = await readRawBody(req);
  try {
    return raw.length ? JSON.parse(raw.toString('utf8')) : {};
  } catch {
    throw Object.assign(new Error('JSON no válido'), { status: 400 });
  }
}

// Registra las rutas en el enrutador del servidor (route(method, path, handler)).
// El servidor ya quita el prefijo /api: /api/stripe/checkout → /stripe/checkout
function registerStripeRoutes(route) {
  route('GET', '/stripe/plans', async () => publicPlans());
  route('POST', '/stripe/checkout', async ({ req }) => createCheckout(await readJson(req), req.headers.origin));
  route('POST', '/stripe/portal', async ({ req }) => createPortal(await readJson(req), req.headers.origin));
  route('GET', '/stripe/session', async ({ query }) => getSession(query.id));
  route('POST', '/stripe/webhook', async ({ req }) => processWebhook(await readRawBody(req), req.headers['stripe-signature']));
}

export { registerStripeRoutes };
