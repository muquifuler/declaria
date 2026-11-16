import { useEffect, useState } from 'react';
import { getCheckoutSession } from '../../lib/stripe.js';

// Úsalo en la ruta /pago/exito (Stripe vuelve con ?session_id=...)
export default function CheckoutResult() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('session_id');
    if (!id) return setState({ loading: false, error: 'No hay sesión de pago' });
    getCheckoutSession(id)
      .then(s => setState({ loading: false, session: s }))
      .catch(err => setState({ loading: false, error: err.message }));
  }, []);

  if (state.loading) return <p>Comprobando el pago…</p>;
  if (state.error) return <p>⚠️ {state.error}</p>;
  const ok = state.session.paymentStatus === 'paid' || state.session.status === 'complete';
  return (
    <div style={{ textAlign: 'center', padding: 32 }}>
      <h2>{ok ? '¡Pago completado! 🎉' : 'Pago pendiente'}</h2>
      {state.session.email && <p>Te hemos enviado el recibo a {state.session.email}.</p>}
    </div>
  );
}
