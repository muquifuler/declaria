// ============================================================================
// Qué hacer cuando Stripe avisa de algo. Rellena los TODO con tu lógica
// (activar la suscripción en tu BD, enviar un email, dar acceso…).
// Stripe puede reenviar el mismo evento: estas funciones deben ser idempotentes.
// ============================================================================
const processed = new Set(); // en producción guarda event.id en tu base de datos

async function handleStripeEvent(event) {
  if (processed.has(event.id)) return;
  processed.add(event.id);

  const obj = event.data.object;
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      if (obj.payment_status === 'paid' || obj.mode === 'subscription') await onCheckoutCompleted(obj);
      break;
    case 'checkout.session.async_payment_failed':
      await onPaymentFailed(obj);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await onSubscriptionChanged(obj);
      break;
    case 'customer.subscription.deleted':
      await onSubscriptionCanceled(obj);
      break;
    case 'invoice.paid':
      await onInvoicePaid(obj);
      break;
    case 'invoice.payment_failed':
      await onPaymentFailed(obj);
      break;
    default:
      console.log(`[stripe] Evento recibido sin manejar: ${event.type}`);
  }
}

async function onCheckoutCompleted(session) {
  // TODO: marca el pedido como pagado / crea la suscripción en tu BD.
  // session.client_reference_id = el id de tu usuario (si lo enviaste al crear el checkout)
  // session.customer            = cliente de Stripe (guárdalo para el Portal de cliente)
  console.log('[stripe] ✅ Checkout completado', { id: session.id, cliente: session.customer, usuario: session.client_reference_id, modo: session.mode });
}

async function onSubscriptionChanged(subscription) {
  // TODO: guarda subscription.status ('active', 'trialing', 'past_due', 'canceled'…) y el plan
  const priceId = subscription.items?.data?.[0]?.price?.id;
  console.log('[stripe] 🔄 Suscripción', subscription.status, { id: subscription.id, cliente: subscription.customer, priceId });
}

async function onSubscriptionCanceled(subscription) {
  // TODO: quita el acceso de pago al usuario
  console.log('[stripe] ⛔ Suscripción cancelada', { id: subscription.id, cliente: subscription.customer });
}

async function onInvoicePaid(invoice) {
  // TODO: renovaciones mensuales/anuales pagadas
  console.log('[stripe] 💶 Factura pagada', { id: invoice.id, cliente: invoice.customer, importe: invoice.amount_paid });
}

async function onPaymentFailed(obj) {
  // TODO: avisa al usuario de que actualice su método de pago
  console.warn('[stripe] ⚠️ Pago fallido', { id: obj.id, cliente: obj.customer });
}

export { handleStripeEvent };
