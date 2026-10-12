import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Format: scrypt$N$r$p$<salt base64url>$<hash base64url>
// Erzeugen: `npm run hash-password` (scripts/hash-password.mjs, gleiche Parameter).

const KEY_LENGTH = 64;

function scrypt(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64url");
  if (expected.length !== KEY_LENGTH) return false;
  const key = await scrypt(password, Buffer.from(saltB64, "base64url"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return timingSafeEqual(key, expected);
}

/** Login gegen Hash (scrypt) oder Klartext aus der Umgebung; Klartext-Vergleich in konstanter Zeit. */
export async function verifyLogin(input: string, secret: { hash: string } | { plain: string }): Promise<boolean> {
  if ("hash" in secret) return verifyPassword(input, secret.hash);
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(secret.plain).digest();
  return timingSafeEqual(a, b);
}
