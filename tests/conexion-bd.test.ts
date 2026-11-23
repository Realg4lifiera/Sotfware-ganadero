import { afterEach, describe, expect, it, vi } from "vitest";
import { configuracionPg, urlBaseDatos, urlMigraciones } from "@/lib/conexion-bd";

const SUPABASE =
  "postgres://postgres.abc:clave@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x&pgbouncer=true";

afterEach(() => vi.unstubAllEnvs());

describe("conexión a la base de datos", () => {
  it("con Supabase cifra sin verificar la CA y quita sslmode de la URL", () => {
    const c = configuracionPg(SUPABASE);
    expect(c.ssl).toEqual({ rejectUnauthorized: false });
    expect(c.connectionString).toBe(
      "postgres://postgres.abc:clave@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
    );
  });

  it("verifica contra DATABASE_CA si se da", () => {
    vi.stubEnv("DATABASE_CA", "-----BEGIN CERTIFICATE-----\\nX\\n-----END CERTIFICATE-----");
    expect(configuracionPg(SUPABASE).ssl).toEqual({
      ca: "-----BEGIN CERTIFICATE-----\nX\n-----END CERTIFICATE-----",
    });
  });

  it("deja igual una base local", () => {
    const local = "postgresql://ganadero:ganadero@localhost:5432/ganadero";
    expect(configuracionPg(local)).toEqual({ connectionString: local });
  });

  it("usa las variables de la integración de Vercel si faltan las propias", () => {
    vi.stubEnv("DATABASE_URL", undefined);
    vi.stubEnv("DATABASE_URL_UNPOOLED", undefined);
    vi.stubEnv("POSTGRES_PRISMA_URL", "postgres://pool");
    vi.stubEnv("POSTGRES_URL_NON_POOLING", "postgres://directa");
    expect(urlBaseDatos()).toBe("postgres://pool");
    expect(urlMigraciones()).toBe("postgres://directa");
  });
});
