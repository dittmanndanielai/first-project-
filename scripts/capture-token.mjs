// Erzeugt ein Geräte-Token für /api/capture (Siri-Kurzbefehl, Mac-Hotkey).
// Das Token kommt in den Kurzbefehl (Header "Authorization: Bearer <token>"),
// nur der Hash kommt nach Vercel in CAPTURE_TOKENS (mehrere Hashes komma-getrennt).
import { createHash, randomBytes } from "node:crypto";

const token = randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(token).digest("hex");
const device = process.argv[2] ?? "geraet";

console.log(`Gerät:          ${device}`);
console.log(`Token (Kurzbefehl, einmalig kopieren): ${token}`);
console.log(`Hash (Vercel CAPTURE_TOKENS):         ${hash}`);
