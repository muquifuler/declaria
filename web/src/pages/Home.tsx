import { useEffect, useState } from 'react';
import { BACKENDS, apis } from '../lib/api';

type Status = { state: 'loading' | 'ok' | 'error'; text: string };

// Comprueba que cada módulo del proyecto responde (bórralo cuando empieces)
export default function Home() {
  const [status, setStatus] = useState<Record<string, Status>>({});

  useEffect(() => {
    const set = (key: string, value: Status) => setStatus(s => ({ ...s, [key]: value }));
    for (const [key, b] of Object.entries(BACKENDS)) {
      if (!b.health) {
        set(key, { state: 'ok', text: 'sin endpoint de salud' });
        continue;
      }
      apis[key]
        .get(b.health)
        .then(() => set(key, { state: 'ok', text: 'conectado' }))
        .catch((err: Error) => set(key, { state: 'error', text: err.message }));
    }
  }, []);

  const rows = [
    ...Object.entries(BACKENDS).map(([key, b]) => ({ key, label: `${b.label} (${b.base})` })),
  ];

  return (
    <main>
      <h1>DECLARIA</h1>
      <p>Edita <code>src/pages/Home.tsx</code> para empezar.</p>
      <ul className="status-list">
        {rows.map(r => {
          const s = status[r.key] || { state: 'loading', text: 'comprobando…' };
          return (
            <li key={r.key}>
              {r.label}:{' '}
              <span className={s.state === 'ok' ? 'status-ok' : s.state === 'error' ? 'status-error' : ''}>{s.text}</span>
            </li>
          );
        })}
      </ul>
      <p>
        Si algo sale en rojo, arranca todo desde la raíz con <code>npm run dev</code>.
      </p>
    </main>
  );
}
