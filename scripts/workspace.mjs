import { execFileSync, spawn } from 'node:child_process';
import { join } from 'node:path';

/** The apps, in the order they are built. */
export const APPS = ['api', 'web'];

/**
 * Runs a package.json script in an app with the package manager that runs this
 * one, so `pnpm dev`, `npm run dev`, `yarn dev` and `bun run dev` all work.
 *
 * @param {string} app - The app directory under apps/
 * @param {string} script - The script name
 * @param {{ prefix?: boolean }} [options] - Prefix every output line with the app name
 * @returns {import('node:child_process').ChildProcess} The process
 */
export function runScript(app, script, options = {}) {
  const execpath = process.env.npm_execpath;
  // pnpm, npm and yarn point at a JavaScript file, bun at its own binary
  const [command, args] =
    execpath && /\.[cm]?js$/.test(execpath)
      ? [process.execPath, [execpath, 'run', script]]
      : [execpath || 'npm', ['run', script]];

  const child = spawn(command, args, {
    cwd: join(import.meta.dirname, '..', 'apps', app),
    stdio: options.prefix ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? '1' },
  });

  if (options.prefix) {
    const label = `[${app}]`.padEnd(6);

    for (const stream of [child.stdout, child.stderr]) {
      let buffered = '';

      stream.on('data', (chunk) => {
        const lines = (buffered + chunk).split('\n');

        buffered = lines.pop();

        for (const line of lines) {
          process.stdout.write(`${label} ${line}\n`);
        }
      });
    }
  }

  return child;
}

/**
 * Stops a process started by {@link runScript} and everything it started.
 * Package managers run scripts in a process group of their own and do not
 * always pass a signal on, so the tree is walked instead.
 *
 * @param {import('node:child_process').ChildProcess} child - The process
 * @returns {void}
 */
export function stopScript(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // already gone
    }

    return;
  }

  for (const pid of [...descendants(child.pid), child.pid]) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // already gone
    }
  }
}

/**
 * Lists the processes below one, deepest first.
 *
 * @param {number} root - The process id
 * @returns {number[]} The descendants
 */
function descendants(root) {
  const children = new Map();

  for (const line of execFileSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' }).split('\n')) {
    const [pid, ppid] = line.trim().split(/\s+/).map(Number);

    if (pid && ppid) {
      children.set(ppid, [...(children.get(ppid) ?? []), pid]);
    }
  }

  const found = [];
  const walk = (pid) => {
    for (const child of children.get(pid) ?? []) {
      walk(child);
      found.push(child);
    }
  };

  walk(root);

  return found;
}
