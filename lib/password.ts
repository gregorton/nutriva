import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { promisify } from "node:util";

/*
  Password hashing, on its own so `reference/db/seed.mjs` can import the same function the
  sign-up action uses — a seeded account signs in through exactly the code path a real one does.
  That is also why this file has no `server-only` import: it is plain node:crypto and nothing
  here reaches for a request.

  scrypt, from the standard library, rather than bcrypt or argon2: both of those are native
  addons that have to compile per platform, and this project has no build step for that.

  Stored format is `scrypt$N$r$p$salt$hash`, all hex. The parameters travel with the hash, so
  raising the cost later leaves every existing password verifiable.
*/

// promisify picks node's four-argument scrypt overload, which has no options parameter, so the
// shape is restated here — the cost parameters have to be passed for any of this to mean anything.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

// ~100ms on a modern desktop core, and 16 MiB of memory per hash. maxmem has to be raised
// above node's 32 MiB default headroom calculation for N this size.
const N = 16384;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH, { N, r, p, maxmem: MAX_MEM });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/**
 * Constant-time comparison against a stored hash. Returns false rather than throwing on a
 * malformed record, so one bad row cannot take the sign-in form down.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, storedN, storedR, storedP, saltHex, keyHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const key = await scryptAsync(password, salt, expected.length, {
      N: Number(storedN),
      r: Number(storedR),
      p: Number(storedP),
      maxmem: MAX_MEM,
    });
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
