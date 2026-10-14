/**
 * Ganancia diaria de peso (GDP) entre pesajes consecutivos, en g/día.
 * Fórmula (PENDIENTE DE VALIDACIÓN con el veterinario):
 *   (peso final − peso inicial) / días entre pesajes × 1000
 */
import { diasEntre } from "@/lib/fechas";

export interface PesoFechado {
  fecha: Date;
  pesoKg: number;
}

/** GDP en g/día; null si los pesajes son del mismo día o están desordenados. */
export function gananciaDiariaGramos(anterior: PesoFechado, actual: PesoFechado): number | null {
  const dias = diasEntre(anterior.fecha, actual.fecha);
  if (dias <= 0) return null;
  return Math.round(((actual.pesoKg - anterior.pesoKg) / dias) * 1000);
}

/** Agrega a cada pesaje (en cualquier orden) la GDP desde el pesaje anterior. */
export function pesajesConGanancia<T extends PesoFechado>(
  pesajes: T[],
): (T & { gdpGramos: number | null })[] {
  const ordenados = [...pesajes].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  return ordenados.map((p, i) => ({
    ...p,
    gdpGramos: i === 0 ? null : gananciaDiariaGramos(ordenados[i - 1], p),
  }));
}
