import { getStripe } from './stripeClient.js';
import { publicPlans, findPlanByPrice } from './plans.js';
import { handleStripeEvent } from './webhookHandlers.js';

const SUCCESS_PATH = "/pago/exito";
const CANCEL_PATH = "/pago/cancelado";

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function appUrl(origin) {
  return String(process.env.APP_URL || origin || 'http://localhost:5173').replace(/\/+$/, '');
}

async function createCheckout(body, origin) {
  const { priceId, quantity = 1, customerEmail, customerId, userId } = body || {};
  const plan = findPlanByPrice(priceId);
  if (!plan) throw httpError(400, 'Plan no válido');
  const base = appUrl(origin);
  const session = await getStripe().checkout.sessions.create({
    mode: plan.interval ? 'subscription' : 'payment',
    line_items: [{ price: plan.priceId, quantity: Math.max(1, Number(quantity) || 1) }],
    success_url: `${base}${SUCCESS_PATH}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}${CANCEL_PATH}`,
    ...(customerId ? { customer: customerId } : customerEmail ? { customer_email: customerEmail } : {}),
    ...(userId ? { client_reference_id: String(userId) } : {}),
    ...(plan.interval && plan.trialDays ? { subscription_data: { trial_period_days: plan.trialDays } } : {}),
    ...(!plan.interval && !customerId ? { customer_creation: 'always' } : {}),
    allow_promotion_codes: true,
  });
  return { id: session.id, url: session.url };
}

async function createPortal(body, origin) {
  const { customerId } = body || {};
  if (!customerId) throw httpError(400, 'Falta customerId');
  const portal = await getStripe().billingPortal.sessions.create({ customer: customerId, return_url: appUrl(origin) });
  return { url: portal.url };
}

async function getSession(id) {
  const s = await getStripe().checkout.sessions.retrieve(id);
  return { id: s.id, status: s.status, paymentStatus: s.payment_status, customer: s.customer, email: s.customer_details?.email || null, mode: s.mode };
}

// rawBody: Buffer EXACTO recibido (si se parsea a JSON antes, la firma no cuadra)
async function processWebhook(rawBody, signature) {
  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    throw httpError(400, `Firma de webhook no válida: ${err.message}`);
  }
  await handleStripeEvent(event);
  return { received: true };
}

export { createCheckout, createPortal, getSession, processWebhook, publicPlans, httpError };
