# DECLARIA · Servidor Node.js

Módulo `server/` del proyecto. Desde la raíz: `npm run dev:server`.

## Desarrollo local

```bash
npm install
npm run dev
npm run typecheck   # comprobación de tipos (tsc --noEmit)
```

- Publicado bajo `/api` (variable `API_PREFIX`): `/api/health`. Añade rutas con `route('GET', '/ruta', handler)` en `server.ts`.
- TypeScript sin compilar: `tsx` lo ejecuta en desarrollo y en producción (`start.mjs`, que es lo que arranca PM2).
