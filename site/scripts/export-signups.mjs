#!/usr/bin/env node
// Exports early-access signups from the EARLY_ACCESS KV namespace as CSV on stdout.
// Usage: npm run export-signups -- --namespace-id <id>   (needs `npx wrangler login`)
import { execFileSync } from 'node:child_process';

const idx = process.argv.indexOf('--namespace-id');
const id = idx > -1 ? process.argv[idx + 1] : process.env.EARLY_ACCESS_ID;
if (!id) {
  console.error('Pass --namespace-id <id> or set EARLY_ACCESS_ID.');
  process.exit(1);
}
const wrangler = (args) =>
  execFileSync('npx', ['wrangler', ...args, '--namespace-id', id, '--remote'], { encoding: 'utf8' });
const keys = JSON.parse(wrangler(['kv', 'key', 'list', '--prefix', 'email:']));
console.log('email,lang,createdAt');
for (const { name } of keys) {
  const row = JSON.parse(wrangler(['kv', 'key', 'get', name]));
  console.log([row.email, row.lang, row.createdAt].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
}
