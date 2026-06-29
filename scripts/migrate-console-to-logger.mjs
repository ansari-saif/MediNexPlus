#!/usr/bin/env node
/**
 * Replaces console.* with logger in backend/ and src/app/api/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TARGET_DIRS = [
  path.join(ROOT, "backend"),
  path.join(ROOT, "src/app/api"),
];

const SKIP_FILES = new Set([
  path.join(ROOT, "backend/utils/logger.ts"),
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function moduleName(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/").replace(/\.(ts|tsx|js|mjs)$/, "");
}

function computeLoggerImport(filePath) {
  const loggerPath = path.join(ROOT, "backend/utils/logger.ts");
  let rel = path.relative(path.dirname(filePath), loggerPath).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel.replace(/\.ts$/, "");
}

function migrateFile(filePath) {
  if (SKIP_FILES.has(filePath)) return false;
  let content = fs.readFileSync(filePath, "utf8");
  if (!/console\.(log|error|warn|info|debug)\(/.test(content)) return false;

  const importPath = computeLoggerImport(filePath);
  const importLine = `import { logger } from "${importPath}";`;
  const mod = moduleName(filePath);
  const logVar = `log_${mod.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const childLine = `const ${logVar} = logger.child("${mod}");`;

  content = content
    .replace(/console\.log\(/g, `${logVar}.info(`)
    .replace(/console\.info\(/g, `${logVar}.info(`)
    .replace(/console\.warn\(/g, `${logVar}.warn(`)
    .replace(/console\.error\(/g, `${logVar}.error(`)
    .replace(/console\.debug\(/g, `${logVar}.debug(`);

  // Fix pino signature: logger.info(obj, msg) - console.log("msg", obj) needs manual fix
  // For simple string-only console.log, wrap as message
  content = content.replace(
    new RegExp(`${logVar}\\.info\\((["\`])([^"\`]*?)\\1\\)`, "g"),
    (match, _q, msg) => `${logVar}.info({}, ${JSON.stringify(msg)})`
  );
  content = content.replace(
    new RegExp(`${logVar}\\.error\\((["\`])([^"\`]*?)\\1\\)`, "g"),
    (match, _q, msg) => `${logVar}.error({}, ${JSON.stringify(msg)})`
  );
  content = content.replace(
    new RegExp(`${logVar}\\.warn\\((["\`])([^"\`]*?)\\1\\)`, "g"),
    (match, _q, msg) => `${logVar}.warn({}, ${JSON.stringify(msg)})`
  );

  if (!content.includes(importLine)) {
    const firstImport = content.match(/^import .+;\n/m);
    if (firstImport) {
      const insertAt = content.indexOf(firstImport[0]) + firstImport[0].length;
      content =
        content.slice(0, insertAt) +
        importLine +
        "\n" +
        childLine +
        "\n" +
        content.slice(insertAt);
    } else {
      content = importLine + "\n" + childLine + "\n" + content;
    }
  } else if (!content.includes(childLine)) {
    const importIdx = content.indexOf(importLine) + importLine.length;
    content = content.slice(0, importIdx) + "\n" + childLine + content.slice(importIdx);
  }

  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

let count = 0;
for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    if (migrateFile(file)) {
      count++;
      console.log(`✓ ${path.relative(ROOT, file)}`);
    }
  }
}
console.log(`\nMigrated console.* in ${count} files`);
