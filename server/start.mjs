// Arranque en producción (PM2 / node start.mjs): registra tsx y carga server.ts sin compilar.
import { register } from 'tsx/esm/api';

register();
await import('./server.ts');
