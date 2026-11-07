// Starts the Vercube API and the Vite dev server together. The web app proxies
// /api to the API, see apps/web/vite.config.ts.
import { APPS, runScript, stopScript } from './workspace.mjs';

const children = APPS.map((app) => runScript(app, 'dev', { prefix: true }));

const stop = () => {
  for (const child of children) {
    stopScript(child);
  }
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

for (const child of children) {
  child.on('exit', (code) => {
    // one of them stopped: stop the other too, and report the failure
    stop();
    process.exitCode ||= code ?? 0;
  });
}
