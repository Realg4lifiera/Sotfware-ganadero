/**
 * Gastos administrativos (costos indirectos): un valor que cubre un período se reparte
 * por partes iguales en los meses del período, y cada cuota mensual se reparte entre
 * centros de costo según una regla de prorrateo.
 * Todo se calcula en centavos; los residuos de redondeo se asignan para que las partes
 * sumen exactamente el total.
 */
import type { Periodicidad } from "@/generated/prisma/enums";

export const MESES_PERIODICIDAD: Record<Periodicidad, number> = {
  MENSUAL: 1,
  BIMESTRAL: 2,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

const aCentavos = (n: number) => Math.round((n + Number.EPSILON) * 100);

/** "AAAA-MM" del mes de una fecha (medianoche UTC). */
export function mesDe(fecha: Date): string {
  return fecha.toISOString().slice(0, 7);
}

/** Meses ("AAAA-MM") que cubre un costo desde el mes de su fecha. */
export function mesesCubiertos(fechaInicio: Date, periodicidad: Periodicidad): string[] {
  const a = fechaInicio.getUTCFullYear();
  const m = fechaInicio.getUTCMonth();
  return Array.from({ length: MESES_PERIODICIDAD[periodicidad] }, (_, i) =>
    new Date(Date.UTC(a, m + i, 1)).toISOString().slice(0, 7),
  );
}

/** Reparte un monto en partes según pesos, sin perder centavos (método del mayor residuo). */
export function repartir(monto: number, pesos: number[]): number[] {
  const total = aCentavos(monto);
  const sumaPesos = pesos.reduce((s, p) => s + p, 0);
  if (pesos.length === 0 || sumaPesos <= 0) return pesos.map(() => 0);
  const exactos = pesos.map((p) => (total * p) / sumaPesos);
  const partes = exactos.map((x) => Math.floor(x));
  let faltan = total - partes.reduce((s, p) => s + p, 0);
  const orden = exactos.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of orden) {
    if (faltan <= 0) break;
    partes[i] += 1;
    faltan -= 1;
  }
  return partes.map((c) => c / 100);
}

/** Cuota que le corresponde a un mes (0 si el mes está fuera del período). */
export function cuotaEnMes(
  costo: { fecha: Date; periodicidad: Periodicidad; valorTotal: number },
  mes: string,
): number {
  const meses = mesesCubiertos(costo.fecha, costo.periodicidad);
  const i = meses.indexOf(mes);
  return i < 0
    ? 0
    : repartir(
        costo.valorTotal,
        meses.map(() => 1),
      )[i];
}

export interface DetalleRegla {
  centroCostoId: string;
  porcentaje: number;
}

/** Valida que una regla sume 100 % sin centros repetidos. Devuelve el error o null. */
export function errorRegla(detalles: DetalleRegla[]): string | null {
  if (detalles.length === 0) return "Agrega al menos un centro de costo.";
  if (new Set(detalles.map((d) => d.centroCostoId)).size !== detalles.length)
    return "Hay centros de costo repetidos.";
  if (detalles.some((d) => !(d.porcentaje > 0))) return "Cada porcentaje debe ser mayor que 0.";
  const suma = detalles.reduce((s, d) => s + aCentavos(d.porcentaje), 0) / 100;
  return Math.abs(suma - 100) > 0.001
    ? `Los porcentajes deben sumar 100 % (suman ${suma} %).`
    : null;
}

/** Reparte un monto entre centros de costo según la regla. */
export function prorratear(monto: number, detalles: DetalleRegla[]): Map<string, number> {
  const partes = repartir(
    monto,
    detalles.map((d) => d.porcentaje),
  );
  return new Map(detalles.map((d, i) => [d.centroCostoId, partes[i]]));
}
