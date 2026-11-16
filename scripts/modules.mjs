#!/usr/bin/env node
// Orquestador de módulos (sin dependencias). Lee center.modules.json.
//
//   node scripts/modules.mjs setup [módulo…]   instala cada módulo (npm / venv + pip)
//   node scripts/modules.mjs dev   [módulo…]   arranca todo a la vez con logs por módulo
//   node scripts/modules.mjs test  [módulo…]
//   node scripts/modules.mjs build [módulo…]
//
// [módulo] puede ser el tipo (spa, node_api, fastapi, evm…), la carpeta o la clave.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(ROOT, 'center.modules.json'), 'utf8'));
const [action = 'dev', ...only] = process.argv.slice(2);
const COLORS = [36, 32, 35, 33, 34, 31, 96, 92];
const isWin = process.platform === 'win32';

const selected = manifest.modules.filter(m => !only.length || only.some(x => [m.type, m.dir, m.key].includes(x)));
if (!selected.length) {
  console.error(`No hay ningún módulo que coincida con: ${only.join(', ')}`);
  process.exit(1);
}

function pythonOf(dir) {
  const venv = path.join(dir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python');
  return existsSync(venv) ? `"${venv}"` : isWin ? 'python' : 'python3';
}
const resolveCmd = (cmd, dir) =>
  cmd.replaceAll('{python-base}', isWin ? 'python' : 'python3').replaceAll('{python}', pythonOf(dir));

function prefixLines(stream, tag, out) {
  let buf = '';
  stream.on('data', chunk => {
    buf += chunk.toString();
    const lines = buf.split(/\r?\n/);
    buf = lines.pop();
    for (const l of lines) out.write(`${tag} ${l}\n`);
  });
  stream.on('end', () => buf && out.write(`${tag} ${buf}\n`));
}

function run(mod, cmd, i, { wait = true } = {}) {
  const dir = path.join(ROOT, mod.dir || '.');
  const tag = `\x1b[${COLORS[i % COLORS.length]}m[${mod.dir || mod.type}]\x1b[0m`;
  const command = resolveCmd(cmd, dir);
  console.log(`${tag} $ ${command}`);
  const child = spawn(command, { cwd: dir, shell: true, env: process.env });
  prefixLines(child.stdout, tag, process.stdout);
  prefixLines(child.stderr, tag, process.stderr);
  const done = new Promise(resolve => child.on('exit', code => resolve(code ?? 0)));
  return wait ? done : { child, done };
}

const portOpen = port =>
  new Promise(resolve => {
    const s = net.connect(port, '127.0.0.1');
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('error', () => resolve(false));
  });

async function waitPort(port, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await portOpen(port)) return true;
    await new Promise(r => setTimeout(r, 750));
  }
  return false;
}

async function sequential(key) {
  let failed = 0;
  for (const [i, mod] of selected.entries()) {
    const cmds = [].concat(mod[key] || []).filter(Boolean);
    for (const cmd of cmds) {
      const code = await run(mod, cmd, i);
      if (code) { failed++; console.error(`✖ ${mod.dir || mod.type}: «${cmd}» terminó con código ${code}`); break; }
    }
  }
  process.exitCode = failed ? 1 : 0;
}

async function dev() {
  const children = [];
  const stop = () => { for (const c of children) try { c.kill(); } catch {} };
  process.on('SIGINT', () => { stop(); process.exit(0); });
  process.on('SIGTERM', () => { stop(); process.exit(0); });

  await Promise.all(selected.map(async (mod, i) => {
    if (!mod.dev) return;
    const { child, done } = run(mod, mod.dev, i, { wait: false });
    children.push(child);
    done.then(code => code && console.error(`✖ ${mod.dir || mod.type} se ha parado (código ${code})`));
    // Contratos: cuando el nodo local responde, se despliegan y se exportan los ABIs
    if (mod.afterReady && mod.readyPort) {
      if (await waitPort(mod.readyPort)) await run(mod, mod.afterReady, i);
      else console.error(`⚠ ${mod.dir}: el puerto ${mod.readyPort} no respondió; ejecuta «${mod.afterReady}» a mano.`);
    }
  }));
}

if (action === 'dev') await dev();
else if (['setup', 'test', 'build'].includes(action)) await sequential(action);
else {
  console.error(`Acción desconocida: ${action}. Usa setup, dev, test o build.`);
  process.exit(1);
}
