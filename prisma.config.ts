import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * URL de las migraciones: conexión directa o "session pooler" (DATABASE_URL_UNPOOLED); la
 * app usa la conexión con pool (DATABASE_URL). Supabase exige TLS: el motor de
 * migraciones lo activa con `sslmode=require` (cifra sin verificar la CA de Supabase).
 */
function urlMigraciones(): string | undefined {
  const url = process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"];
  if (!url) return url;
  const u = new URL(url);
  if (/\.supabase\.(com|co)$/.test(u.hostname) && !u.searchParams.has("sslmode"))
    u.searchParams.set("sslmode", "require");
  return u.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: urlMigraciones(),
  },
});
