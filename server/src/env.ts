import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

/** Parse an env file into a plain object (quotes and outer spaces stripped by dotenv). Never writes into process.env. A missing file gives {}. */
export function loadEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  return parse(readFileSync(path));
}
