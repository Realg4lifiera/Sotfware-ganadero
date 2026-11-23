/**
 * Conexión a PostgreSQL (app, seed, carga inicial y migraciones).
 *
 * URL: `DATABASE_URL` (con pool) y `DATABASE_URL_UNPOOLED` (migraciones). En Vercel, la
 * integración de Supabase crea `POSTGRES_PRISMA_URL` (transaction pooler) y
 * `POSTGRES_URL_NON_POOLING` (session pooler): se usan si faltan las primeras.
 *
 * TLS: Supabase firma su certificado con su propia CA, que Node no reconoce: sin más,
 * `pg` rechaza la conexión ("self-signed certificate in certificate chain"). Con
 * `DATABASE_CA` (el PEM de Supabase, Settings › Database › SSL) se verifica contra esa
 * CA; si no, la conexión a Supabase va cifrada sin verificar la CA. Se quita `sslmode`
 * de la URL porque `pg` le daría prioridad sobre estas opciones.
 */
import type { PoolConfig } from "pg";

/** URL con pool, la que usa la aplicación. */
export const urlBaseDatos = () => process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL;

/** URL sin pool de transacciones, la que usan las migraciones. */
export const urlMigraciones = () =>
  process.env.DATABASE_URL_UNPOOLED ?? process.env.POSTGRES_URL_NON_POOLING ?? urlBaseDatos();

export const esSupabase = (url: string) => /\.supabase\.(com|co)$/.test(new URL(url).hostname);

export function configuracionPg(url = urlBaseDatos()): PoolConfig {
  if (!url) return {};
  const ca = process.env.DATABASE_CA?.replace(/\\n/g, "\n");
  if (!ca && !esSupabase(url)) return { connectionString: url };
  const u = new URL(url);
  for (const p of ["sslmode", "sslcert", "sslkey", "sslrootcert", "pgbouncer", "supa"])
    u.searchParams.delete(p);
  return {
    connectionString: u.toString(),
    ssl: ca ? { ca } : { rejectUnauthorized: false },
  };
}
