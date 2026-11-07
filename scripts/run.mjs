// Runs a script in every app, one after another: `node scripts/run.mjs build`.
import { APPS, runScript } from './workspace.mjs';

const script = process.argv[2];

for (const app of APPS) {
  const code = await new Promise((resolve) => runScript(app, script).on('exit', resolve));

  if (code !== 0) {
    process.exitCode = code ?? 1;
    break;
  }
}
