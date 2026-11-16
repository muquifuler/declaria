# DECLARIA

Una plataforma web que automatiza la preparación de la declaración de la renta a partir de los movimientos y documentos financieros de diferentes entidades, como Revolut, Trade Republic, MyInvestor, Interactive Brokers, bancos tradicionales y otras plataformas de inversión.

El objetivo es simplificar y automatizar un proceso que actualmente resulta complicado, especialmente para personas que tienen dinero repartido entre varios bancos, cuentas remuneradas, brókeres y plataformas de inversión.

El usuario simplemente tendrá que subir los documentos fiscales o extractos descargados de sus plataformas financieras (CSV, PDF, Excel, etc.). La aplicación se encargará de analizar los archivos, identificar las operaciones realizadas y clasificar automáticamente la información según su tratamiento fiscal en España.

Proyecto modular: **Frontend SPA + Servidor Node.js**
Generado con **CENTER · DevOps Suite**.

## Módulos

| Carpeta | Tipo | Prefijo / puerto | Clave en la Bóveda |
|---|---|---|---|
| `web/` | Frontend SPA | :5173 | `frontend` |
| `server/` | Servidor Node.js | `/api` → :4000 | `server` |

La lista vive en `center.modules.json`: CENTER la usa para registrar las carpetas y `scripts/modules.mjs` para arrancar cada módulo con su comando.

## Desarrollo local

```bash
npm run setup     # instala cada módulo
npm run dev       # arranca todos a la vez, con el log de cada uno en su color
npm run dev:web   # o solo uno
```

## Cómo se conectan

- El frontend (`web/`) llama a `/api/…` (Servidor Node.js). En local lo enruta el proxy de Vite; en producción, Nginx (o el `docker-compose` si lo has incluido).
- Cada API conoce su prefijo por `API_PREFIX` en su `.env`, así que puedes moverla de prefijo sin tocar código.
- Clientes listos en `web/src/lib/api.js`: `apis.<tipo>.get('/ruta')` para cada API, o `apiGet` para la principal (`/api`).
- Para añadir otro módulo más adelante: crea su carpeta, añádelo a `center.modules.json` y regístralo en CENTER (Proyectos → editar → Módulos).

## Tecnologías incluidas

- Stripe
- Email (SMTP)
- Tailwind CSS v4
- Zustand
- Vitest + Testing Library
- ESLint + Prettier

- **Stripe**: crea productos y webhooks desde *DevOps Suite → Stripe · Pagos* e instala los precios con un clic (rellena `STRIPE_PRICE_*` en la Bóveda). En local: `stripe listen --forward-to localhost:4000/api/stripe/webhook`.
- Usa `<PricingTable />` (web/src/components/PricingTable) y `<CheckoutResult />` en la ruta de éxito `/pago/exito`.
- **Email**: rellena `SMTP_*` en la Bóveda y usa `<ContactForm />` (envía a `POST /api/contact`, con límite anti-spam y campo trampa).
- **Tailwind CSS v4**: ya está activo; usa clases directamente en JSX. Los temas se definen con `@theme` en `src/index.css`.
- **Zustand**: store en `src/store/useAppStore.ts` (`const theme = useAppStore(s => s.theme)`).
- **Vitest**: `npm test` (modo watch) o `npm run test:run`. Ejemplo en `src/App.test.tsx`.
- **ESLint + Prettier**: `npm run lint` y `npm run format` dentro de cada módulo (web/, server/).
