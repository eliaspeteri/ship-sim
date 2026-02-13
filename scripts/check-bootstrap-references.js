#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const targets = ['docker-compose.yml', 'README.md', 'package.json'];
const scriptRefPattern = /scripts\/[a-zA-Z0-9._-]+\.(?:js|ts|sh)/g;

const missing = [];
for (const relativeTarget of targets) {
  const absoluteTarget = path.join(repoRoot, relativeTarget);
  if (!fs.existsSync(absoluteTarget)) continue;
  const content = fs.readFileSync(absoluteTarget, 'utf8');
  const refs = content.match(scriptRefPattern) || [];
  for (const ref of refs) {
    const scriptPath = path.join(repoRoot, ref);
    if (!fs.existsSync(scriptPath)) {
      missing.push({ file: relativeTarget, ref });
    }
  }
}

if (missing.length > 0) {
  console.error('Missing bootstrap script reference(s):');
  for (const entry of missing) {
    console.error(`- ${entry.file}: ${entry.ref}`);
  }
  process.exit(1);
}

console.log('Bootstrap script references: OK');
