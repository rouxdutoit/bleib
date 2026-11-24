#!/usr/bin/env node
// Exports early-access signups from the private `bleib-signups` Bunny Storage zone as CSV on stdout.
// Usage: BUNNY_SIGNUPS_PASSWORD=... npm run export-signups > signups.csv
// The password is the zone's storage password (Bunny dashboard > Storage > bleib-signups > Access).
const key = process.env.BUNNY_SIGNUPS_PASSWORD;
if (!key) {
  console.error('Set BUNNY_SIGNUPS_PASSWORD to the bleib-signups storage password.');
  process.exit(1);
}
const base = 'https://storage.bunnycdn.com/bleib-signups/';
const get = async (url) => {
  const res = await fetch(url, { headers: { AccessKey: key } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
};
const files = (await get(base)).filter((f) => !f.IsDirectory && f.ObjectName.endsWith('.json'));
const rows = await Promise.all(files.map((f) => get(base + encodeURIComponent(f.ObjectName))));
rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
console.log('email,lang,createdAt');
for (const r of rows) console.log([r.email, r.lang, r.createdAt].map(q).join(','));
