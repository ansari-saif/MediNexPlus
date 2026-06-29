#!/usr/bin/env node
/**
 * Codemod: wrap all API route.ts handlers with withApiRoute.
 */
import fs from "fs";
import path from "path";
import ts from "typescript";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const API_DIR = path.join(ROOT, "src/app/api");

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

function collectRouteFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectRouteFiles(full, files);
    else if (entry.name === "route.ts") files.push(full);
  }
  return files;
}

function routeNameFromPath(filePath) {
  const rel = path.relative(API_DIR, filePath).replace(/\\/g, "/");
  const segments = rel
    .replace(/\/route\.ts$/, "")
    .split("/")
    .filter(Boolean)
    .map((s) => (s.startsWith("[") && s.endsWith("]") ? s.slice(1, -1) : s));
  return segments.join(".") || "api";
}

function importPathForRoute(filePath) {
  const rel = path.relative(API_DIR, path.dirname(filePath)).replace(/\\/g, "/");
  const depth = rel === "." ? 0 : rel.split("/").filter(Boolean).length;
  return `${"../".repeat(3 + depth)}backend/utils/api-route`;
}

function findHandlerNodes(sourceFile) {
  const handlers = [];

  function visit(node) {
    if (
      ts.isFunctionDeclaration(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) &&
      node.name &&
      HTTP_METHODS.has(node.name.text) &&
      node.body
    ) {
      handlers.push(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return handlers;
}

function ensureImport(content, importPath) {
  const importLine = `import { withApiRoute } from "${importPath}";`;
  if (!content.includes("withApiRoute")) return content;
  if (content.includes(importLine)) return content;
  const lines = content.split("\n");
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) lastImport = i;
  }
  if (lastImport >= 0) lines.splice(lastImport + 1, 0, importLine);
  else lines.unshift(importLine);
  return lines.join("\n");
}

function migrateFile(filePath) {
  if (filePath.endsWith(`${path.sep}metrics${path.sep}route.ts`)) return false;

  const routeName = routeNameFromPath(filePath);
  const importPath = importPathForRoute(filePath);
  const original = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const handlers = findHandlerNodes(sourceFile);
  if (!handlers.length) return false;

  let content = original;
  const sorted = [...handlers].sort((a, b) => b.getStart() - a.getStart());

  for (const fn of sorted) {
    const method = fn.name.text;
    const start = fn.getStart(sourceFile);
    const end = fn.getEnd();
    const params = fn.parameters.map((p) => p.getText(sourceFile)).join(", ");
    const body = fn.body.getText(sourceFile);
    const replacement = `export const ${method} = withApiRoute("${routeName}.${method.toLowerCase()}", async (${params}) => ${body});`;
    content = content.slice(0, start) + replacement + content.slice(end);
  }

  content = ensureImport(content, importPath);
  if (content === original) return false;
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

const files = collectRouteFiles(API_DIR);
let migrated = 0;

for (const file of files) {
  try {
    if (migrateFile(file)) {
      migrated++;
      console.log(`✓ ${path.relative(ROOT, file)}`);
    }
  } catch (err) {
    console.error(`Failed: ${file}`, err);
    process.exitCode = 1;
  }
}

console.log(`\nMigrated ${migrated} route files (${files.length} total)`);
