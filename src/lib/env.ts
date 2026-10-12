import "server-only";
import { z } from "zod";

// Einzige Stelle, die process.env liest. Wird erst zur Laufzeit ausgewertet (nicht beim Build),
// damit Prerendering ohne Secrets funktioniert.

const isProd = process.env.NODE_ENV === "production";

// Nur für lokale Entwicklung: feste Werte, damit `npm run dev` ohne .env.local startet.
// Passwort lokal: "dev" (Hash unten). In Production sind alle Werte Pflicht.
const DEV_SESSION_SECRET = "dev-only-session-secret-change-me-0123456789";
const DEV_PASSWORD_HASH =
  "scrypt$16384$8$1$3ilKd6RXTCrT_3r-1OzKKQ$xKlClCjYyBgRxJyjcRP_Im4zoEqsDP_vPthEL70R3KyEy9K5qLqydTl82u1bqh05cW7d9Oi_QXA23aUNZIYEUQ";

const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const schema = z
  .object({
    DATA_SOURCE: z.enum(["notion", "mock"]).default("mock"),
    APP_TIMEZONE: z.string().default("Europe/Berlin"),
    OWNER_NAME: z.string().default("Daniel"),

    SESSION_SECRET: isProd ? z.string().min(32) : z.string().min(32).default(DEV_SESSION_SECRET),
    SESSION_VERSION: z.string().default("1"),
    AUTH_PASSWORD_HASH: isProd ? z.string().startsWith("scrypt$") : z.string().default(DEV_PASSWORD_HASH),

    NOTION_TOKEN: optional,
    NOTION_TODOS_DS_ID: z.string().default("b8065b38-5580-43fc-b022-e8708fc1b680"),
    NOTION_GOALS_DS_ID: z.string().default("467d56b3-cf05-429b-a3dd-08d47c443b7b"),

    N8N_CAPTURE_URL: optional.pipe(z.url().optional()),
    N8N_WEBHOOK_KEY: optional,

    ELEVENLABS_API_KEY: optional,
    ELEVENLABS_AGENT_ID: z.string().default("agent_2601m4p82ey6ew8bnejvezdmrt9x"),

    // Komma-getrennte SHA-256-Hashes der Geräte-Tokens für /api/capture (Siri, Mac).
    CAPTURE_TOKENS: optional,
    REVALIDATE_SECRET: optional,
  })
  .superRefine((env, ctx) => {
    if (env.DATA_SOURCE === "notion" && !env.NOTION_TOKEN) {
      ctx.addIssue({ code: "custom", path: ["NOTION_TOKEN"], message: "Pflicht bei DATA_SOURCE=notion" });
    }
  });

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      // Nur Variablennamen ausgeben, nie Werte.
      const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Ungültige Konfiguration: ${fields}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export function captureTokenHashes(): string[] {
  return (env().CAPTURE_TOKENS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[0-9a-f]{64}$/.test(s));
}
