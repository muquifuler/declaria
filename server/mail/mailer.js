// Envío de emails por SMTP con Nodemailer.
// Variables: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO
import nodemailer from 'nodemailer';

let transporter = null;

// Se crea en el primer uso: así el .env ya está cargado
export function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) throw Object.assign(new Error('SMTP no configurado (SMTP_HOST vacío)'), { status: 503 });
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export function sendMail({ to, subject, text, html, replyTo }) {
  return getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: to || process.env.MAIL_TO || process.env.MAIL_FROM,
    subject,
    text,
    html,
    replyTo,
  });
}

function readJson(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Mensaje demasiado grande'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('JSON no válido'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

// Límite simple anti-spam: 5 envíos por IP cada 10 minutos
const hits = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  if (list.length >= 5) throw Object.assign(new Error('Demasiados envíos, prueba más tarde'), { status: 429 });
  list.push(now);
  hits.set(ip, list);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function registerMailRoutes(route) {
  route('POST', '/contact', async ({ req }) => {
    rateLimit(req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'local');
    const { name = '', email = '', message = '', website = '' } = await readJson(req);
    if (website) return { ok: true }; // campo trampa para bots
    if (!String(name).trim() || !EMAIL_RE.test(email) || String(message).trim().length < 5) {
      throw Object.assign(new Error('Revisa el nombre, el email y el mensaje'), { status: 400 });
    }
    await sendMail({
      replyTo: email,
      subject: `Contacto web: ${String(name).slice(0, 80)}`,
      text: `${name} <${email}>\n\n${message}`,
    });
    return { ok: true };
  });
}
