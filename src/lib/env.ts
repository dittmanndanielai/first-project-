import "server-only";
import { z } from "zod";

// Einzige Stelle, die process.env liest. Wird erst zur Laufzeit ausgewertet (nicht beim Build),
// damit Prerendering ohne Secrets funktioniert.

// Nur für lokale Entwicklung: feste Werte, damit `npm run dev` ohne .env.local startet.
// Passwort lokal: "dev" (Hash unten). In Production sind die Werte Pflicht.
const DEV_SESSION_SECRET = "dev-only-session-secret-change-me-0123456789";
const DEV_PASSWORD_HASH =
  "scrypt$16384$8$1$3ilKd6RXTCrT_3r-1OzKKQ$xKlClCjYyBgRxJyjcRP_Im4zoEqsDP_vPthEL70R3KyEy9K5qLqydTl82u1bqh05cW7d9Oi_QXA23aUNZIYEUQ";

const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

function buildSchema(isProd: boolean) {
  return z
    .object({
      DATA_SOURCE: z.enum(["notion", "mock"]).default("mock"),
      APP_TIMEZONE: z.string().default("Europe/Berlin"),
      OWNER_NAME: z.string().default("Daniel"),

      // 20 Zeichen = ein „starkes Passwort“ aus der Passwörter-App (ca. 70 Bit Zufall).
      SESSION_SECRET: isProd ? z.string().min(20) : z.string().min(20).default(DEV_SESSION_SECRET),
      SESSION_VERSION: z.string().default("1"),
      // Login: entweder Hash (`npm run hash-password`) oder das Passwort selbst (einfacher in Vercel).
      AUTH_PASSWORD_HASH: optional.pipe(z.string().startsWith("scrypt$").optional()),
      AUTH_PASSWORD: optional.pipe(z.string().min(12).optional()),

      NOTION_TOKEN: optional,
      NOTION_TODOS_DS_ID: z.string().default("b8065b38-5580-43fc-b022-e8708fc1b680"),
      NOTION_GOALS_DS_ID: z.string().default("467d56b3-cf05-429b-a3dd-08d47c443b7b"),
      // Digest Archive (B_news_digest schreibt, die App liest nur)
      NOTION_DIGEST_DS_ID: z.string().default("42a6a120-423e-4375-8a43-f7d5002a2d11"),

      N8N_CAPTURE_URL: optional.pipe(z.url().optional()),
      N8N_WEBHOOK_KEY: optional,

      ELEVENLABS_API_KEY: optional,
      ELEVENLABS_AGENT_ID: z.string().default("agent_2601m4p82ey6ew8bnejvezdmrt9x"),

      // Öffentlicher iCloud-Kalender (ICS), geheim wie ein Passwort. Mehrere Kalender durch Komma getrennt.
      // Bewusst ohne URL-Prüfung hier: ein falscher Wert soll nur den Kalender abschalten, nicht die App
      // (Prüfung in features/calendar/source.ts).
      ICLOUD_CALENDAR_URL: optional,

      // Komma-getrennte SHA-256-Hashes der Geräte-Tokens für /api/capture (Siri, Mac).
      CAPTURE_TOKENS: optional,
      REVALIDATE_SECRET: optional,
    })
    .superRefine((env, ctx) => {
      if (env.DATA_SOURCE === "notion" && !env.NOTION_TOKEN) {
        ctx.addIssue({ code: "custom", path: ["NOTION_TOKEN"], message: "Pflicht bei DATA_SOURCE=notion" });
      }
      if (isProd && !env.AUTH_PASSWORD_HASH && !env.AUTH_PASSWORD) {
        ctx.addIssue({ code: "custom", path: ["AUTH_PASSWORD"], message: "AUTH_PASSWORD oder AUTH_PASSWORD_HASH setzen" });
      }
    });
}

export type Env = z.infer<ReturnType<typeof buildSchema>>;

/** Prüft eine Umgebung. Fehlermeldungen nennen nur Variablennamen, nie Werte. */
export function parseEnv(source: Record<string, string | undefined>, isProd: boolean): Env {
  const parsed = buildSchema(isProd).safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Ungültige Konfiguration: ${fields}`);
  }
  return parsed.data;
}

let cached: Env | undefined;

export function env(): Env {
  if (!cached) cached = parseEnv(process.env, process.env.NODE_ENV === "production");
  return cached;
}

export type LoginSecret = { hash: string } | { plain: string };

/** Hash hat Vorrang vor Klartext; ohne beides gilt lokal das Dev-Passwort „dev“. */
export function loginSecret(e: Env): LoginSecret {
  if (e.AUTH_PASSWORD_HASH) return { hash: e.AUTH_PASSWORD_HASH };
  if (e.AUTH_PASSWORD) return { plain: e.AUTH_PASSWORD };
  return { hash: DEV_PASSWORD_HASH };
}

export function captureTokenHashes(): string[] {
  return (env().CAPTURE_TOKENS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[0-9a-f]{64}$/.test(s));
}
