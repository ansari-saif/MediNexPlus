#!/usr/bin/env node
/**
 * Scan src/ for UIAnchor identities and generate:
 *   - src/lib/uianchor/ui-anchor.manifest.json
 *   - src/lib/uianchor/ids.generated.ts  (UIAnchorId union)
 *
 * Application source owns identities; this file is never hand-maintained.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const OUT_DIR = path.join(SRC, "lib", "uianchor");
const MANIFEST_PATH = path.join(OUT_DIR, "ui-anchor.manifest.json");
const IDS_PATH = path.join(OUT_DIR, "ids.generated.ts");

const UI_ID_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;
const OTP_MAX = 6;

/** @typedef {"button"|"input"|"select"|"link"|"landmark"} AnchorType */

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walkTsx(dir) {
  /** @type {string[]} */
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".next") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkTsx(full));
      continue;
    }
    if (/\.(tsx|ts|jsx|js)$/.test(ent.name) && !ent.name.endsWith(".generated.ts")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * @param {string} file
 * @param {string} source
 * @param {number} index
 * @returns {AnchorType}
 */
function inferType(file, source, index) {
  const before = source.slice(Math.max(0, index - 120), index);
  if (/Anchor\.Button\b[\s\S]*$/.test(before) || /<button\b[^>]*$/.test(before)) return "button";
  if (/Anchor\.Input\b[\s\S]*$/.test(before) || /<input\b[^>]*$/.test(before)) return "input";
  if (/Anchor\.Select\b[\s\S]*$/.test(before) || /<select\b[^>]*$/.test(before)) return "select";
  if (/Anchor\.Link\b[\s\S]*$/.test(before) || /<a\b[^>]*$/.test(before)) return "link";
  // data-ui on button/input often has attrs between tag and attribute
  const tagWindow = source.slice(Math.max(0, index - 400), index);
  const open = tagWindow.lastIndexOf("<");
  if (open >= 0) {
    const tag = tagWindow.slice(open + 1).match(/^[a-zA-Z][\w.-]*/)?.[0]?.toLowerCase();
    if (tag === "button") return "button";
    if (tag === "input") return "input";
    if (tag === "select") return "select";
    if (tag === "a") return "link";
  }
  if (file.includes("Anchor") || /Anchor\./.test(before)) {
    // fallback already handled
  }
  return "landmark";
}

/**
 * Collect string literal id: "foo" from object arrays in a file (nav items etc.)
 * @param {string} source
 * @returns {string[]}
 */
function collectLocalIds(source) {
  /** @type {Set<string>} */
  const ids = new Set();
  const re = /\bid\s*:\s*["']([a-z][a-z0-9-]*)["']/g;
  let m;
  while ((m = re.exec(source))) ids.add(m[1]);
  return [...ids];
}

/**
 * Collect uiPrefix="…" string literals project-wide.
 * @param {string[]} files
 * @returns {string[]}
 */
function collectUiPrefixes(files) {
  /** @type {Set<string>} */
  const prefixes = new Set();
  const re = /\buiPrefix\s*=\s*\{?\s*["']([a-z][a-z0-9.-]*)["']\s*\}?/g;
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    let m;
    while ((m = re.exec(source))) prefixes.add(m[1]);
  }
  return [...prefixes];
}

/**
 * Extract string literals from ternary branches: cond ? 'a' : 'b'
 * @param {string} expr
 * @returns {string[]}
 */
function ternaryLiterals(expr) {
  const m = expr.match(/^\s*[^?]+\?\s*["']([a-z][a-z0-9-]*)["']\s*:\s*["']([a-z][a-z0-9-]*)["']\s*$/);
  if (m) return [m[1], m[2]];
  return [];
}

/**
 * @param {Map<string, AnchorType>} components
 * @param {string} id
 * @param {AnchorType} type
 */
function add(components, id, type) {
  if (!UI_ID_PATTERN.test(id)) return;
  const prev = components.get(id);
  if (!prev || prev === "landmark") components.set(id, type);
}

/**
 * @param {string} file
 * @param {string} source
 * @param {Map<string, AnchorType>} components
 * @param {string[]} uiPrefixes
 */
function scanFile(file, source, components, uiPrefixes) {
  const localIds = collectLocalIds(source);

  // 1) Static ui="…" / data-ui="…"
  {
    const re = /\b(?:ui|data-ui)\s*=\s*["']([a-z][a-z0-9.-]*)["']/g;
    let m;
    while ((m = re.exec(source))) {
      add(components, m[1], inferType(file, source, m.index));
    }
  }

  // 2) Static ui={"…"} / data-ui={'…'}
  {
    const re = /\b(?:ui|data-ui)\s*=\s*\{\s*["']([a-z][a-z0-9.-]*)["']\s*\}/g;
    let m;
    while ((m = re.exec(source))) {
      add(components, m[1], inferType(file, source, m.index));
    }
  }

  // 3) Template literals: ui={`…`}
  {
    const re = /\b(?:ui|data-ui)\s*=\s*\{`([^`]*)`\}/g;
    let m;
    while ((m = re.exec(source))) {
      const tpl = m[1];
      const type = inferType(file, source, m.index);

      // `${uiPrefix}.suffix` (literal suffix only)
      const prefixRel = tpl.match(/^\$\{uiPrefix\}\.([a-z][a-z0-9.-]*)$/);
      if (prefixRel) {
        for (const p of uiPrefixes) add(components, `${p}.${prefixRel[1]}`, type);
        continue;
      }

      // `${uiPrefix || 'shared'}.suffix`
      const prefixOrShared = tpl.match(/^\$\{uiPrefix\s*\|\|\s*['"]shared['"]\}\.([a-z][a-z0-9.-]*)$/);
      if (prefixOrShared) {
        for (const p of uiPrefixes) add(components, `${p}.${prefixOrShared[1]}`, type);
        add(components, `shared.${prefixOrShared[1]}`, type);
        continue;
      }

      // `prefix-${expr}` numbered (otp)
      const numbered = tpl.match(/^([a-z][a-z0-9.-]*)-\$\{[^}]+\}$/);
      if (numbered) {
        for (let i = 1; i <= OTP_MAX; i++) add(components, `${numbered[1]}-${i}`, type);
        continue;
      }

      // `prefix.${ternary}` → both branches
      const tern = tpl.match(/^([a-z][a-z0-9.-]*)\.\$\{([^}]+)\}$/);
      if (tern) {
        const branches = ternaryLiterals(tern[2]);
        if (branches.length) {
          for (const b of branches) add(components, `${tern[1]}.${b}`, type);
          continue;
        }
        // `prefix.${n.id}` / `prefix.${item.id}` / `prefix.${t.id}`
        if (/\.id\s*$/.test(tern[2].trim()) || /\bid\b/.test(tern[2])) {
          for (const id of localIds) add(components, `${tern[1]}.${id}`, type);
          continue;
        }
      }

      // `hospitaladmin.configure.${entityName.toLowerCase()…}` — skip non-literal
      // Pure static template (no ${})
      if (!tpl.includes("${") && UI_ID_PATTERN.test(tpl)) {
        add(components, tpl, type);
      }
    }
  }
}

/** ISO-8601 timestamp in India Standard Time (+05:30). */
function formatGeneratedAtIst(date = new Date()) {
  const local = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  return `${local.replace(" ", "T")}+05:30`;
}

function main() {
  const files = walkTsx(SRC).filter((f) => !f.includes(`${path.sep}uianchor${path.sep}`));
  const uiPrefixes = collectUiPrefixes(files);
  /** @type {Map<string, AnchorType>} */
  const components = new Map();

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    scanFile(file, source, components, uiPrefixes);
  }

  const sortedIds = [...components.keys()].sort();
  /** @type {Record<string, { type: AnchorType }>} */
  const manifestComponents = {};
  for (const id of sortedIds) {
    manifestComponents[id] = { type: /** @type {AnchorType} */ (components.get(id)) };
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: formatGeneratedAtIst(),
    components: manifestComponents,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  const union =
    sortedIds.length === 0
      ? "string"
      : sortedIds.map((id) => `  | ${JSON.stringify(id)}`).join("\n");

  const idsSource = `/* AUTO-GENERATED by scripts/generate-uianchor.mjs — do not edit */
/* eslint-disable */
export type UIAnchorId =
${union};

export const UI_ANCHOR_IDS = [
${sortedIds.map((id) => `  ${JSON.stringify(id)},`).join("\n")}
] as const satisfies readonly UIAnchorId[];
`;

  fs.writeFileSync(IDS_PATH, idsSource, "utf8");

  console.log(
    `[uianchor] Generated ${sortedIds.length} ids →\n  ${path.relative(ROOT, MANIFEST_PATH)}\n  ${path.relative(ROOT, IDS_PATH)}`
  );
}

main();
