import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

/** Parse an env file into a plain object (quotes and outer spaces stripped by dotenv). Never writes into process.env. A missing file gives {}. */
export function loadEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  return parse(readFileSync(path));
}

/**
 * The server's settings: the env file, with every non-empty process environment variable on top. Locally the file
 * holds the secrets; a deployment has no file and sets them as environment variables (Fly secrets).
 */
export function serverEnv(path: string, processEnv: Record<string, string | undefined>): Record<string, string> {
  const env = loadEnv(path);
  for (const [key, value] of Object.entries(processEnv)) {
    if (value !== undefined && value.trim() !== '') env[key] = value;
  }
  return env;
}
