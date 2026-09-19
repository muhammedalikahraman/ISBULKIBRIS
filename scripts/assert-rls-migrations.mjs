import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const sql = files.map((f) => readFileSync(join(dir, f), "utf8")).join("\n");

const tables = new Set();
for (const match of sql.matchAll(/create table public\.([a-z0-9_]+)/gi)) {
  tables.add(match[1]);
}
const rls = new Set();
for (const match of sql.matchAll(/alter table public\.([a-z0-9_]+)\s+enable row level security/gi)) {
  rls.add(match[1]);
}

const missing = [...tables].filter((t) => !rls.has(t)).sort();
if (missing.length) {
  console.error("RLS missing:", missing.join(", "));
  process.exit(1);
}
console.log(`RLS enabled on ${rls.size} public tables.`);
