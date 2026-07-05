import { cpus } from "node:os";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const separatorIndex = args.indexOf("--");
const commandArgs = separatorIndex >= 0 ? args.slice(separatorIndex + 1) : args;

if (commandArgs.length === 0) {
  console.error("Usage: node scripts/heavy-runner.mjs -- <command> [args...]");
  process.exit(1);
}

const cpuCount = cpus().length;
const memoryMb = Number(process.env.HEAVY_TASK_MEMORY_MB || 8192);
const configuredConcurrency = Number(process.env.HEAVY_TASK_CONCURRENCY || 0);
const effectiveConcurrency = configuredConcurrency > 0 ? configuredConcurrency : Math.max(2, cpuCount - 1);

const env = {
  ...process.env,
  UV_THREADPOOL_SIZE: String(Math.min(128, Math.max(4, effectiveConcurrency * 2))),
  NODE_OPTIONS: `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ""}--max-old-space-size=${memoryMb}`.trim(),
};

console.log(`Heavy runner -> CPUs: ${cpuCount}, concurrency: ${effectiveConcurrency}, memory: ${memoryMb} MB`);
console.log(`Executing: ${commandArgs.join(" ")}`);

const child = spawn(commandArgs[0], commandArgs.slice(1), {
  stdio: "inherit",
  shell: true,
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
