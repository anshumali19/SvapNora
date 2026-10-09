// Wrapper that:
//   1. loads the repository-root .env (if present), then
//   2. for `generate`/`migrate`, releases the Prisma engine file lock by
//      stopping any running SvapNora API dev-server process on Windows, then
//   3. delegates to the Prisma CLI.
//
// Why step 2? On Windows the running API server keeps the native query engine
// (`query_engine-windows.dll.node`) open, so `prisma generate` cannot rename the
// freshly built engine over it and fails with EPERM. Stopping the server first
// (restart `npm run dev` afterwards) makes generation reliable.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));

const rootEnv = resolve(here, "../../.env");
if (existsSync(rootEnv)) dotenv.config({ path: rootEnv });
const serverEnv = resolve(here, "../.env");
if (existsSync(serverEnv)) dotenv.config({ path: serverEnv });

const args = process.argv.slice(2);
const command = args[0];

function releaseEngineLock() {
  if (process.platform !== "win32") return;
  const repoRoot = resolve(here, "../..").replace(/'/g, "''");
  const ps = [
    `$root = '${repoRoot}';`,
    `Get-CimInstance Win32_Process -Filter "name='node.exe'"`,
    `  | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($root) -and ($_.CommandLine -match 'tsx' -or $_.CommandLine -match 'index\\.ts' -or $_.CommandLine -match 'dist[\\\\/]index\\.js') }`,
    `  | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Output $_.ProcessId }`,
  ].join(" ");
  // Prefer an absolute path: when npm is launched from WSL/Git Bash, System32
  // may not be on PATH and a bare `powershell.exe` would fail to spawn.
  const psExe =
    process.env.SystemRoot + "\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
  const run = (exe) =>
    spawnSync(exe, ["-NoProfile", "-NonInteractive", "-Command", ps], {
      encoding: "utf8",
      windowsHide: true,
    });
  let result = run(psExe);
  if (result.error) result = run("powershell.exe");
  const killed = (result.stdout ?? "").trim();
  if (killed) {
    console.error(
      `[prisma] Stopped running SvapNora server process(es) to release the Prisma engine lock: ${killed.replace(/\s+/g, ", ")}`,
    );
    console.error("[prisma] Restart your dev server afterwards with `npm run dev`.");
  }
}

if (command === "generate" || command === "migrate") {
  releaseEngineLock();
}

const prismaBin = resolve(here, "../../node_modules/prisma/build/index.js");
const result = spawnSync(process.execPath, [prismaBin, ...args], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
