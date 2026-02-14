#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const requiredDocs = [
  'docs/security-baseline.md',
  'docs/security-endpoint-checklist.md',
];

const requiredEnvKeys = [
  'NEXTAUTH_SECRET',
  'FRONTEND_URL',
  'FRONTEND_ORIGINS',
  'REGISTER_RATE_LIMIT_MAX',
  'REGISTER_RATE_LIMIT_WINDOW_MS',
  'COMPILE_RATE_LIMIT_MAX',
  'COMPILE_RATE_LIMIT_WINDOW_MS',
];

for (const rel of requiredDocs) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required security doc: ${rel}`);
    process.exit(1);
  }
}

const envExamplePath = path.join(root, '.env.example');
if (!fs.existsSync(envExamplePath)) {
  console.error('Missing .env.example');
  process.exit(1);
}
const envExample = fs.readFileSync(envExamplePath, 'utf8');

const missing = requiredEnvKeys.filter(
  key => !new RegExp(`^${key}=`, 'm').test(envExample),
);
if (missing.length > 0) {
  console.error('Missing required security env keys in .env.example:');
  missing.forEach(key => console.error(`- ${key}`));
  process.exit(1);
}

console.log('Security baseline check passed.');
