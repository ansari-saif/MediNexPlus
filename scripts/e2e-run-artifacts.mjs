import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const command = process.argv[2] || "list";
const requestedId = process.argv[3] || "latest";
const root = resolve("test-results");
const runsRoot = join(root, "runs");

function resolveRunId(value) {
  const id =
    value === "latest"
      ? readFileSync(join(root, "latest-run-id.txt"), "utf8").trim()
      : value;
  if (!/^[a-zA-Z0-9._-]+$/.test(id)) throw new Error("Invalid E2E run ID");
  return id;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

if (command === "runs") {
  if (!existsSync(runsRoot)) process.exit(0);
  for (const entry of readdirSync(runsRoot, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .sort((a, b) => b.name.localeCompare(a.name))) {
    const manifestPath = join(runsRoot, entry.name, "run.json");
    const manifest = existsSync(manifestPath)
      ? JSON.parse(readFileSync(manifestPath, "utf8"))
      : { status: "unknown" };
    console.log(`${entry.name}\t${manifest.status}\t${manifest.passed ?? 0}/${manifest.total ?? "?"}`);
  }
  process.exit(0);
}

const runId = resolveRunId(requestedId);
const runDirectory = join(runsRoot, runId);
if (!existsSync(runDirectory)) throw new Error(`E2E run not found: ${runId}`);

const files = walk(runDirectory).sort();
if (command === "list") {
  const manifestPath = join(runDirectory, "run.json");
  if (existsSync(manifestPath)) console.log(readFileSync(manifestPath, "utf8").trim());
  console.log("\nArtifacts:");
  for (const file of files) console.log(relative(process.cwd(), file));
  process.exit(0);
}

if (command === "trace") {
  const traces = files.filter((file) => file.endsWith("trace.zip"));
  if (!traces.length) throw new Error(`No traces found for run: ${runId}`);

  const selector = process.argv[4] || (traces.length === 1 ? "1" : "");
  console.log(`Run ${runId} — ${traces.length} trace(s):\n`);
  traces.forEach((file, index) => {
    console.log(`  ${index + 1}\t${relative(process.cwd(), file)}`);
  });

  const selected = selectTraces(traces, selector);
  if (!selected.length) {
    console.log(`\nOpen one with:\n  npm run test:e2e:trace -- ${runId} 1`);
    console.log(`  npm run test:e2e:trace -- ${runId} 06-book`);
    console.log(`  npm run test:e2e:trace -- ${runId} all`);
    process.exit(0);
  }

  for (const trace of selected) {
    console.log(`\nOpening ${relative(process.cwd(), trace)}`);
    const result = spawnSync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["playwright", "show-trace", trace],
      { stdio: "inherit" }
    );
    if (result.status) process.exit(result.status);
  }
  process.exit(0);
}

function selectTraces(traces, selector) {
  if (!selector) return [];
  if (selector === "all") return traces;
  if (/^\d+$/.test(selector)) {
    const trace = traces[Number(selector) - 1];
    if (!trace) throw new Error(`No trace at index ${selector}`);
    return [trace];
  }
  const matches = traces.filter((file) => file.includes(selector));
  if (!matches.length) throw new Error(`No trace matching: ${selector}`);
  return matches;
}

throw new Error(`Unknown command: ${command}`);
