# DECLARIA · Frontend SPA

Módulo `web/` del proyecto. Desde la raíz: `npm run dev:web`.

## Desarrollo local

```bash
npm install
npm run dev
npm run typecheck   # comprobación de tipos (tsc --noEmit)
```

- TypeScript estricto. Algunas tecnologías añaden archivos `.js`/`.jsx` (Stripe, por ejemplo): conviven sin problema (`allowJs`).

- React Router: páginas en `src/pages/`, rutas en `src/App.tsx` y menú en `src/nav.ts`. En el VPS, Nginx devuelve index.html para cualquier ruta (try_files).
