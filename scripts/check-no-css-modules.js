#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const targetDirs = ['src', 'tests'];
const allowedModuleCssFiles = new Set([]);
const allowedImporters = new Set([]);

const moduleCssFiles = [];
const moduleCssImports = [];

function walk(dir, visitor) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, visitor);
    } else if (entry.isFile()) {
      visitor(abs);
    }
  }
}

for (const rel of targetDirs) {
  walk(path.join(root, rel), file => {
    const normalized = path.relative(root, file).replace(/\\/g, '/');

    if (
      normalized.endsWith('.module.css') &&
      !allowedModuleCssFiles.has(normalized)
    ) {
      moduleCssFiles.push(normalized);
    }

    if (!/\.(ts|tsx|js|jsx)$/.test(normalized)) return;
    const source = fs.readFileSync(file, 'utf8');
    const importRegex = /from\s+['"][^'"]*\.module\.css['"]/g;
    const bareImportRegex = /import\s+['"][^'"]*\.module\.css['"]/g;
    if (
      (importRegex.test(source) || bareImportRegex.test(source)) &&
      !allowedImporters.has(normalized)
    ) {
      moduleCssImports.push(normalized);
    }
  });
}

if (moduleCssFiles.length || moduleCssImports.length) {
  console.error(
    'CSS module guardrail failed. Tailwind-first policy violation detected.',
  );
  if (moduleCssFiles.length) {
    console.error('\nDisallowed .module.css files:');
    moduleCssFiles.forEach(file => console.error(`- ${file}`));
  }
  if (moduleCssImports.length) {
    console.error('\nDisallowed .module.css imports:');
    moduleCssImports.forEach(file => console.error(`- ${file}`));
  }
  process.exit(1);
}

console.log('CSS module guardrail check passed.');
