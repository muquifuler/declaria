import Stripe from 'stripe';

// Clave secreta SOLO en el servidor (.env → STRIPE_SECRET_KEY). Nunca en el frontend.
// Se crea al primer uso: así da igual si el .env se carga después de los imports.
let client = null;

function getStripe() {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) throw Object.assign(new Error('Falta STRIPE_SECRET_KEY en el .env del servidor'), { status: 500 });
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

export { getStripe };
