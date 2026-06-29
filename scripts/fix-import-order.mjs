#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".ts")) files.push(full);
  }
  return files;
}

function fixBrokenWithApiRouteImport(content) {
  return content.replace(
    /import \{\nimport \{ withApiRoute \} from "([^"]+)";\n([\s\S]*?\n\}) from "([^"]+)";/g,
    'import { withApiRoute } from "$1";\nimport {\n$2\n} from "$3";'
  );
}

function fixImportOrder(content) {
  const lines = content.split("\n");
  const imports = [];
  const loggerLines = [];
  const rest = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("import ")) {
      imports.push(line);
      i++;
      continue;
    }
    if (line.startsWith("const log_") && line.includes("logger.child")) {
      loggerLines.push(line);
      i++;
      continue;
    }
    if (line.startsWith("import { logger }")) {
      imports.push(line);
      i++;
      continue;
    }
    break;
  }

  if (!loggerLines.length) {
    return fixBrokenWithApiRouteImport(content);
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("import ")) {
      imports.push(line);
    } else {
      rest.push(...lines.slice(i));
      break;
    }
    i++;
  }

  if (rest.length === 0 && imports.length === lines.filter((l) => l.startsWith("import ") || l.startsWith("const log_")).length) {
    return fixBrokenWithApiRouteImport(content);
  }

  const fixed = [...imports, ...loggerLines, "", ...rest].join("\n").replace(/\n{3,}/g, "\n\n");
  return fixBrokenWithApiRouteImport(fixed);
}

const dirs = [
  path.join(ROOT, "src/app/api"),
  path.join(ROOT, "backend"),
];

let fixed = 0;
for (const dir of dirs) {
  for (const file of walk(dir)) {
    const original = fs.readFileSync(file, "utf8");
    const updated = fixImportOrder(original);
    if (updated !== original) {
      fs.writeFileSync(file, updated, "utf8");
      fixed++;
    }
  }
}
console.log(`Fixed import order in ${fixed} files`);
