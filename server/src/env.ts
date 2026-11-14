import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

/** Parse an env file into a plain object. Never writes into process.env. A missing file gives {}. */
export function loadEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const parsed = parse(readFileSync(path));
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) out[key] = value.trim();
  return out;
}
