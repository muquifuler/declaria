// Planes a la venta. Los IDs de precio salen del .env (test y live son distintos):
//   .env             → STRIPE_PRICE_<PLAN>=price_... (modo test)
//   .env.production  → STRIPE_PRICE_<PLAN>=price_... (modo live)
// Generado por DevOps Suite · Stripe Studio
const PLANS = [
  // Ejemplo: crea el producto en Stripe Studio y pon su ID de precio en STRIPE_PRICE_BASICO
  {
    key: 'basico',
    name: 'Básico',
    description: 'Plan de ejemplo',
    priceEnv: 'STRIPE_PRICE_BASICO',
    amount: 900,
    currency: 'eur',
    interval: 'month',
    intervalCount: 1,
    trialDays: 0,
    features: ['Todo lo esencial'],
  },
];

// El ID se lee del entorno al usarlo (no al importar: el .env puede cargarse después)
const priceIdOf = pl => String(process.env[pl.priceEnv] || '').trim();

function publicPlans() {
  return PLANS.map(({ priceEnv, ...rest }) => ({ ...rest, priceId: priceIdOf({ priceEnv }) })).filter(pl => pl.priceId);
}

function findPlanByPrice(priceId) {
  const pl = PLANS.find(p => priceId && priceIdOf(p) === priceId);
  return pl ? { ...pl, priceId } : null;
}

export { PLANS, publicPlans, findPlanByPrice };
