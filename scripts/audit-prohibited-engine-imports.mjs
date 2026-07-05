import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const appRoot = path.join(repoRoot, "app");

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const forbiddenSegments = [
  "app/engine/core",
  "app/engine/agents",
  "app/engine/strategy",
  "app/engine/alerts",
  "engine/core",
  "engine/agents",
  "engine/strategy",
  "engine/alerts",
];

function normalize(filePath) {
  return filePath.split(path.sep).join("/");
}

function isIgnoredFile(filePath) {
  const rel = normalize(path.relative(repoRoot, filePath));

  if (!rel.startsWith("app/")) {
    return true;
  }

  if (rel.startsWith("app/engine/")) {
    return true;
  }

  if (rel.startsWith("app/backend/adapters/")) {
    return true;
  }

  return false;
}

function walk(dirPath, acc) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolute = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }

      walk(absolute, acc);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!SCAN_EXTENSIONS.has(ext)) {
      continue;
    }

    acc.push(absolute);
  }
}

function findImportViolations(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const lines = source.split(/\r?\n/);
  const violations = [];

  lines.forEach((line, index) => {
    const importMatch = line.match(/from\s+["']([^"']+)["']/);
    if (!importMatch) {
      return;
    }

    const importPath = importMatch[1];
    const normalizedImport = importPath.replace(/\\/g, "/");

    const isForbidden = forbiddenSegments.some((segment) => normalizedImport.includes(segment));
    if (!isForbidden) {
      return;
    }

    violations.push({
      line: index + 1,
      importPath,
      code: line.trim(),
    });
  });

  return violations;
}

const files = [];
walk(appRoot, files);

const allViolations = [];

for (const file of files) {
  if (isIgnoredFile(file)) {
    continue;
  }

  const violations = findImportViolations(file);
  if (violations.length === 0) {
    continue;
  }

  allViolations.push({
    file: normalize(path.relative(repoRoot, file)),
    violations,
  });
}

if (allViolations.length === 0) {
  console.log("Architecture audit passed: no forbidden engine imports outside backend adapter/engine internals.");
  process.exit(0);
}

console.error("Architecture audit failed: forbidden direct engine imports detected.\n");
for (const entry of allViolations) {
  console.error(`- ${entry.file}`);
  for (const violation of entry.violations) {
    console.error(`  L${violation.line}: ${violation.importPath}`);
  }
}

process.exit(1);
