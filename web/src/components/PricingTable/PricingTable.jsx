import { useEffect, useState } from 'react';
import { getPlans, startCheckout } from '../../lib/stripe.js';
import './PricingTable.css';

const INTERVAL = { day: 'día', week: 'semana', month: 'mes', year: 'año' };
const money = (amount, currency) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);

// Tabla de precios generada por DevOps Suite · Stripe Studio
export default function PricingTable({ highlight, customerEmail, userId } = {}) {
  const [plans, setPlans] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(err => setError(err.message))
      .finally(() => setLoaded(true));
  }, []);

  const buy = async plan => {
    setBusy(plan.key);
    setError('');
    try {
      await startCheckout(plan.priceId, { customerEmail, userId });
    } catch (err) {
      setError(err.message);
      setBusy('');
    }
  };

  if (!plans.length) {
    return <p className="pricing__empty">{error || (loaded ? 'Aún no hay planes configurados (DevOps Suite → Stripe · Pagos).' : 'Cargando planes…')}</p>;
  }

  return (
    <div className="pricing">
      {plans.map(plan => (
        <article key={plan.key} className={`pricing__card${plan.key === highlight ? ' is-highlight' : ''}`}>
          <h3 className="pricing__name">{plan.name}</h3>
          {plan.description && <p className="pricing__desc">{plan.description}</p>}
          <div className="pricing__price">
            {money(plan.amount, plan.currency)}
            {plan.interval && <span>/{INTERVAL[plan.interval] || plan.interval}</span>}
          </div>
          {plan.features?.length > 0 && (
            <ul className="pricing__features">
              {plan.features.map(f => <li key={f}>{f}</li>)}
            </ul>
          )}
          <button className="pricing__btn" disabled={busy === plan.key} onClick={() => buy(plan)}>
            {busy === plan.key ? 'Redirigiendo…' : plan.interval ? 'Suscribirme' : 'Comprar'}
          </button>
        </article>
      ))}
      {error && <p className="pricing__error">{error}</p>}
    </div>
  );
}
