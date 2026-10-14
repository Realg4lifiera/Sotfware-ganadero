/**
 * Depreciación en línea recta (mensual):
 *   cuota = (valor de compra − valor residual) / vida útil en meses
 * Empieza el mes de la compra y dura `vidaUtilMeses` meses. Las cuotas suman exacto el
 * valor depreciable (los centavos sobrantes van en los primeros meses).
 * Un activo inactivo (vendido o dado de baja) no deprecia.
 */
import { repartir } from "./prorrateo";

export interface ActivoDepreciable {
  valorCompra: number;
  valorResidual: number;
  fechaCompra: Date;
  vidaUtilMeses: number;
  activo: boolean;
}

/** Índice del mes ("AAAA-MM") contado desde el mes de compra (0 = mes de compra). */
function indiceMes(fechaCompra: Date, mes: string): number {
  const [a, m] = mes.split("-").map(Number);
  return (a - fechaCompra.getUTCFullYear()) * 12 + (m - 1 - fechaCompra.getUTCMonth());
}

function cuotas(a: ActivoDepreciable): number[] {
  const depreciable = Math.max(0, a.valorCompra - a.valorResidual);
  return repartir(
    depreciable,
    Array.from({ length: Math.max(1, a.vidaUtilMeses) }, () => 1),
  );
}

export function depreciacionEnMes(a: ActivoDepreciable, mes: string): number {
  if (!a.activo) return 0;
  const i = indiceMes(a.fechaCompra, mes);
  return i < 0 || i >= a.vidaUtilMeses ? 0 : cuotas(a)[i];
}

/** Depreciación acumulada hasta el mes indicado (incluido) y valor en libros. */
export function estadoActivo(a: ActivoDepreciable, mes: string) {
  const i = Math.min(indiceMes(a.fechaCompra, mes), a.vidaUtilMeses - 1);
  const c = cuotas(a);
  const acumulada =
    i < 0 ? 0 : Math.round(c.slice(0, i + 1).reduce((s, x) => s + x, 0) * 100) / 100;
  return {
    cuotaMensual: c[0] ?? 0,
    acumulada,
    valorEnLibros: Math.round((a.valorCompra - acumulada) * 100) / 100,
    mesesRestantes: Math.max(0, a.vidaUtilMeses - (i + 1)),
  };
}
