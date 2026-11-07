import { execFileSync, spawn } from 'node:child_process';
import { join } from 'node:path';

/** The apps, in the order they are built. */
export const APPS = ['api', 'web'];

const windows = process.platform === 'win32';

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
  // pnpm, npm and yarn 1 point at a JavaScript file; bun and yarn berry at an
  // executable, which on Windows is a .cmd shim only a shell can start
  const [command, args, shell] =
    execpath && /\.[cm]?js$/.test(execpath)
      ? [process.execPath, [execpath, 'run', script], false]
      : [execpath || 'npm', ['run', script], windows];

  const child = spawn(command, args, {
    cwd: join(import.meta.dirname, '..', 'apps', app),
    stdio: options.prefix ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? '1' },
    shell,
  });

  // a process that cannot start reports it, instead of crashing this script
  child.on('error', (error) => {
    process.stderr.write(`[${app}] could not run "${script}": ${error.message}\n`);
    child.emit('exit', 1, null);
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

      // the last line often says why it stopped, and has no newline
      stream.on('end', () => {
        if (buffered) {
          process.stdout.write(`${label} ${buffered}\n`);
        }
      });
    }

    // remembered while it runs: once the package manager exits, what it
    // started is no longer below it and could not be found to be stopped
    child.descendants = new Set();

    const remember = setInterval(() => {
      for (const pid of descendants(child.pid)) {
        child.descendants.add(pid);
      }
    }, 1000);

    remember.unref();
    child.on('exit', () => clearInterval(remember));
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
  if (windows) {
    try {
      execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // already gone
    }

    return;
  }

  const running = child.exitCode === null && child.signalCode === null;
  const pids = new Set([...(running ? descendants(child.pid) : []), ...(child.descendants ?? [])]);

  if (running) {
    pids.add(child.pid);
  }

  for (const pid of pids) {
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

  try {
    for (const line of execFileSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' }).split('\n')) {
      const [pid, ppid] = line.trim().split(/\s+/).map(Number);

      if (pid && ppid) {
        children.set(ppid, [...(children.get(ppid) ?? []), pid]);
      }
    }
  } catch {
    return [];
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
