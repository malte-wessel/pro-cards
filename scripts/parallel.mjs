// Runs npm scripts side by side (`node scripts/parallel.mjs lint typecheck`): each one's output
// is printed as a block once it is done, so the logs never interleave, and the run fails when any
// of them fails. Node 22, no deps.
import { spawn } from "node:child_process";

const names = process.argv.slice(2);
const run = (name) =>
  new Promise((resolve) => {
    const started = Date.now();
    const child = spawn("npm", ["run", "-s", name], { shell: process.platform === "win32" });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => {
      const s = ((Date.now() - started) / 1000).toFixed(1);
      process.stdout.write(
        `\n── ${name} (${code === 0 ? "ok" : `failed, exit ${code}`}, ${s}s)\n${out}`,
      );
      resolve(code === 0);
    });
  });

const results = await Promise.all(names.map(run));
process.exit(results.every(Boolean) ? 0 : 1);
