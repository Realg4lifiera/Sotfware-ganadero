/**
 * Utilidades de fecha para America/Bogota (UTC−5, sin horario de verano).
 *
 * Convención: las fechas de evento de un día (`@db.Date`) viajan como `Date` a la
 * medianoche UTC de ese día. Para mostrarlas se formatean en UTC; para "hoy" se usa la
 * fecha civil de Bogotá.
 */
export const ZONA_HORARIA = "America/Bogota";

const fmtFecha = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
const fmtFechaHora = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: ZONA_HORARIA,
});
const fmtMes = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const fmtIsoBogota = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: ZONA_HORARIA,
});

/** Fecha de un día (`@db.Date`) → "14/02/2025" */
export function formatoFecha(fecha: Date | null | undefined): string {
  return fecha ? fmtFecha.format(fecha) : "—";
}

/** Instante (timestamptz) → "14/02/2025, 08:30 a. m." en hora de Bogotá */
export function formatoFechaHora(fecha: Date | null | undefined): string {
  return fecha ? fmtFechaHora.format(fecha) : "—";
}

/** "junio de 2025" */
export function formatoMes(fecha: Date): string {
  return fmtMes.format(fecha);
}

/** Fecha civil actual en Bogotá como "AAAA-MM-DD". */
export function hoyISO(ahora: Date = new Date()): string {
  return fmtIsoBogota.format(ahora);
}

/** Fecha civil actual en Bogotá como Date a medianoche UTC (listo para `@db.Date`). */
export function hoy(ahora: Date = new Date()): Date {
  return fechaDesdeISO(hoyISO(ahora));
}

/** "AAAA-MM-DD" → Date a medianoche UTC. Lanza error si el texto no es una fecha válida. */
export function fechaDesdeISO(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Fecha inválida: ${iso}`);
  const [, a, me, d] = m.map(Number);
  const fecha = new Date(Date.UTC(a, me - 1, d));
  if (fecha.getUTCFullYear() !== a || fecha.getUTCMonth() !== me - 1 || fecha.getUTCDate() !== d) {
    throw new Error(`Fecha inválida: ${iso}`);
  }
  return fecha;
}

/** Date (medianoche UTC) → "AAAA-MM-DD" para inputs type="date". */
export function fechaAISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Días completos entre dos fechas de un día. */
export function diasEntre(desde: Date, hasta: Date): number {
  return Math.round((hasta.getTime() - desde.getTime()) / 86_400_000);
}

/** Meses cumplidos entre dos fechas de un día (edad en meses). */
export function mesesEntre(desde: Date, hasta: Date): number {
  let meses =
    (hasta.getUTCFullYear() - desde.getUTCFullYear()) * 12 +
    (hasta.getUTCMonth() - desde.getUTCMonth());
  if (hasta.getUTCDate() < desde.getUTCDate()) meses -= 1;
  return Math.max(0, meses);
}

/** Edad legible: "3 años y 2 meses", "7 meses", "12 días". */
export function edadTexto(nacimiento: Date, referencia: Date): string {
  const meses = mesesEntre(nacimiento, referencia);
  if (meses === 0) {
    const d = Math.max(0, diasEntre(nacimiento, referencia));
    return `${d} ${d === 1 ? "día" : "días"}`;
  }
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes: string[] = [];
  if (anios > 0) partes.push(`${anios} ${anios === 1 ? "año" : "años"}`);
  if (resto > 0) partes.push(`${resto} ${resto === 1 ? "mes" : "meses"}`);
  return partes.join(" y ");
}

/** Mes actual en Bogotá como "AAAA-MM". */
export function mesActualISO(ahora: Date = new Date()): string {
  return hoyISO(ahora).slice(0, 7);
}

/** "AAAA-MM" → { desde, hasta } con hasta exclusivo (primer día del mes siguiente). */
export function rangoMes(mes: string): { desde: Date; hasta: Date } {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error(`Mes inválido: ${mes}`);
  const anio = Number(m[1]);
  const mesNum = Number(m[2]);
  return {
    desde: new Date(Date.UTC(anio, mesNum - 1, 1)),
    hasta: new Date(Date.UTC(anio, mesNum, 1)),
  };
}

/** Mes válido desde un parámetro de URL, o el mes actual. */
export function mesDesdeParametro(valor: unknown): string {
  if (typeof valor === "string") {
    try {
      rangoMes(valor);
      return valor;
    } catch {
      /* se usa el mes actual */
    }
  }
  return mesActualISO();
}

/** "2025-06" → "junio de 2025" */
export function nombreMes(mes: string): string {
  return formatoMes(rangoMes(mes).desde);
}
