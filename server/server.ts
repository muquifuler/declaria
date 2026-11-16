import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerStripeRoutes } from './stripe/stripeRoutes.js'; // [devops-suite] Stripe
import { registerMailRoutes } from './mail/mailer.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(HERE, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const PORT = Number(process.env.PORT || 4000);
const API_PREFIX = `/${String(process.env.API_PREFIX ?? '/api').replace(/^\/+|\/+$/g, '')}`.replace(/^\/$/, '');
const PREFIX_RE = API_PREFIX ? new RegExp(`^${API_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=/|$)`) : null;
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  query: Record<string, string>;
}
export type Handler = (ctx: RouteContext) => unknown;

function send(res: ServerResponse, status: number, body: unknown) {
  if (res.headersSent) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function cors(req: IncomingMessage, res: ServerResponse) {
  const origin = String(req.headers.origin || '').toLowerCase();
  if (!origin) return true;
  let sameOrigin = false;
  try {
    sameOrigin = new URL(origin).host === String(req.headers.host || '').toLowerCase();
  } catch {}
  const allowed = sameOrigin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', String(req.headers.origin));
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }
  return allowed;
}

const routes = new Map<string, Handler>();
const route = (method: string, pathname: string, handler: Handler) => routes.set(`${method} ${pathname}`, handler);

route('GET', '/health', async () => ({ ok: true, name: 'declaria', time: new Date().toISOString() }));
registerMailRoutes(route);
registerStripeRoutes(route); // [devops-suite] Stripe

const server = http.createServer(async (req, res) => {
  const okOrigin = cors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(okOrigin ? 204 : 403);
    return res.end();
  }
  if (!okOrigin) return send(res, 403, { error: 'Origen no permitido' });

  const url = new URL(req.url || '/', 'http://local');
  const bare = PREFIX_RE ? url.pathname.replace(PREFIX_RE, '') : url.pathname;
  const pathname = bare.replace(/\/+$/, '') || '/';
  const handler = routes.get(`${req.method} ${pathname}`);
  if (!handler) return send(res, 404, { error: 'Ruta no encontrada' });

  try {
    const result = await handler({ req, res, url, query: Object.fromEntries(url.searchParams) });
    if (result !== undefined) send(res, 200, result);
  } catch (err) {
    const e = err as { status?: number; message?: string };
    send(res, e.status || 500, { error: e.message || 'Error interno' });
  }
});

server.listen(PORT, () => {
  console.log(`[server] escuchando en :${PORT} (prefijo ${API_PREFIX || '/'})`);
});
