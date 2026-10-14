/** Funciones puras de la auditoría (sin dependencias del servidor, para poder probarlas). */

/** Campos que nunca se guardan en la auditoría. */
const CAMPOS_OCULTOS = new Set(["passwordHash"]);
/** Campos que cambian siempre y no aportan al diff. */
const CAMPOS_IGNORADOS_DIFF = new Set(["updatedAt", "updatedById"]);

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Convierte un registro de Prisma en JSON plano (Decimal → string, Date → ISO). */
export function serializar(registro: Record<string, unknown>): Record<string, Json> {
  const salida: Record<string, Json> = {};
  for (const [k, v] of Object.entries(registro)) {
    if (CAMPOS_OCULTOS.has(k)) continue;
    salida[k] = JSON.parse(JSON.stringify(v ?? null)) as Json;
  }
  return salida;
}

/** Devuelve solo los campos que cambiaron: [antes, después]. */
export function diferencias(
  antes: Record<string, Json>,
  despues: Record<string, Json>,
): [Record<string, Json>, Record<string, Json>] {
  const a: Record<string, Json> = {};
  const d: Record<string, Json> = {};
  const claves = new Set([...Object.keys(antes), ...Object.keys(despues)]);
  for (const k of claves) {
    if (CAMPOS_IGNORADOS_DIFF.has(k)) continue;
    if (JSON.stringify(antes[k] ?? null) !== JSON.stringify(despues[k] ?? null)) {
      a[k] = antes[k] ?? null;
      d[k] = despues[k] ?? null;
    }
  }
  return [a, d];
}
