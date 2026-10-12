// Erzeugt AUTH_PASSWORD_HASH für Vercel. Aufruf: npm run hash-password
// Das Passwort wird verdeckt abgefragt und nirgends gespeichert.
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

function hash(password) {
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

const fromArg = process.argv[2];
if (fromArg) {
  process.stdout.write(hash(fromArg) + "\n");
  process.exit(0);
}

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl.stdoutMuted = true;
rl._writeToOutput = function (s) {
  if (!rl.stdoutMuted) rl.output.write(s);
};
process.stdout.write("Passwort (mind. 20 Zeichen): ");
rl.question("", (pw) => {
  rl.close();
  process.stdout.write("\n");
  if (pw.length < 20) {
    console.error("Zu kurz. Bitte mindestens 20 Zeichen (z. B. aus der Passwörter-App).");
    process.exit(1);
  }
  process.stdout.write("AUTH_PASSWORD_HASH=" + hash(pw) + "\n");
});
