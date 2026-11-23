import "dotenv/config";
import { defineConfig } from "prisma/config";
import { esSupabase, urlMigraciones } from "./src/lib/conexion-bd";

/**
 * Migraciones por conexión directa o "session pooler" (ver `lib/conexion-bd.ts`). Supabase
 * exige TLS: el motor de migraciones lo activa con `sslmode=require` (cifra sin verificar
 * la CA de Supabase).
 */
function url(): string | undefined {
  const base = urlMigraciones();
  if (!base || !esSupabase(base)) return base;
  const u = new URL(base);
  u.searchParams.delete("pgbouncer");
  u.searchParams.delete("supa");
  if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
  return u.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: url(),
  },
});
