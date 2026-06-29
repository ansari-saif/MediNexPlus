#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules") walk(p, files);
    else if (e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".tsx"))) files.push(p);
  }
  return files;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const logLineRe = /^const log_[^\n]+\n/m;
  if (!logLineRe.test(content)) return false;

  const logLines = [];
  let changed = false;

  while (true) {
    const m = content.match(/^const log_[^\n]+\n/m);
    if (!m) break;
    const line = m[0];
    const idx = content.indexOf(line);
    const before = content.slice(0, idx);
    const after = content.slice(idx + line.length);

    const beforeTrim = before.trimEnd();
    const afterTrim = after.trimStart();

    const betweenImports =
      (beforeTrim.endsWith("{") || beforeTrim.endsWith(",") || /from ["'][^"']+["'];?\s*$/.test(beforeTrim)) &&
      afterTrim.startsWith("import ") || /^[a-zA-Z_{]/.test(afterTrim.split("\n")[0]);

    const insideImport =
      before.includes("import {") &&
      !before.slice(before.lastIndexOf("import {")).includes("} from");

    if (insideImport || (beforeTrim.endsWith("{") && !beforeTrim.includes("} from"))) {
      logLines.push(line);
      content = before + after;
      changed = true;
      continue;
    }

    if (/^const log_/m.test(line) && beforeTrim.endsWith("} from") || /from ["'][^"']+["'];?\s*$/.test(beforeTrim)) {
      const nextIsImport = afterTrim.startsWith("import ");
      if (nextIsImport) {
        logLines.push(line);
        content = before + after;
        changed = true;
        continue;
      }
    }
    break;
  }

  if (!changed || logLines.length === 0) return false;

  const lines = content.split("\n");
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) lastImport = i;
  }
  if (lastImport === -1) return false;

  const insertAt = lastImport + 1;
  const uniqueLogs = [...new Set(logLines)];
  lines.splice(insertAt, 0, ...uniqueLogs.map((l) => l.trimEnd()));
  content = lines.join("\n");
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

let fixed = 0;
for (const f of walk(path.join(ROOT, "src")).concat(walk(path.join(ROOT, "backend")))) {
  if (fixFile(f)) {
    fixed++;
    console.log("fixed:", path.relative(ROOT, f));
  }
}
console.log(`Fixed ${fixed} files`);
