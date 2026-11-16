// Cliente de pagos: el servidor crea la sesión de Stripe Checkout y aquí solo redirigimos.
async function post(path, body) {
  const res = await fetch(`/api/stripe${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export async function getPlans() {
  const res = await fetch('/api/stripe/plans');
  if (!res.ok) throw new Error('No se pudieron cargar los planes');
  return res.json();
}

// options: { customerEmail, customerId, userId, quantity }
export async function startCheckout(priceId, options = {}) {
  const { url } = await post('/checkout', { priceId, ...options });
  window.location.assign(url);
}

export async function openBillingPortal(customerId) {
  const { url } = await post('/portal', { customerId });
  window.location.assign(url);
}

export async function getCheckoutSession(sessionId) {
  const res = await fetch(`/api/stripe/session?id=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Sesión no encontrada');
  return res.json();
}
