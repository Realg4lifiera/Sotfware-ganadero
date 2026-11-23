/**
 * Opciones de conexión del driver `pg` (app, seed y carga inicial).
 *
 * Supabase firma su certificado TLS con su propia CA, que Node no reconoce: sin más, `pg`
 * rechaza la conexión ("self-signed certificate in certificate chain"). Con
 * `DATABASE_CA` (el PEM que descarga Supabase en Settings › Database › SSL) se verifica
 * contra esa CA; si no está, la conexión a Supabase va cifrada sin verificar la CA.
 * Las URL no deben llevar `sslmode`: `pg` le daría prioridad sobre estas opciones.
 */
import type { PoolConfig } from "pg";

export function configuracionPg(url = process.env.DATABASE_URL): PoolConfig {
  if (!url) return {};
  const ca = process.env.DATABASE_CA?.replace(/\\n/g, "\n");
  if (ca) return { connectionString: url, ssl: { ca } };
  const host = new URL(url).hostname;
  if (host.endsWith(".supabase.com") || host.endsWith(".supabase.co"))
    return { connectionString: url, ssl: { rejectUnauthorized: false } };
  return { connectionString: url };
}
