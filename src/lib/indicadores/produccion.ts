/**
 * Indicadores productivos (funciones puras), validados con el veterinario:
 * - Kilos ganados en un período: la ganancia entre dos pesajes consecutivos se reparte
 *   por días; al período le toca la parte de los días que caen dentro de él.
 * - Animales-día: días que cada animal estuvo en la finca dentro del período (ingreso a
 *   salida). Base del costo por animal/día y de los litros por vaca/día.
 * - Costo por kilo ganado: costos de cría, levante y ceba más la parte de los gastos
 *   generales (administración, arriendos, trabajadores sin centro) que les corresponde.
 */
import type { PesoFechado } from "./peso";

const DIA = 86_400_000;

/** Días de [inicio, fin) que caen dentro de [desde, hasta). */
export function diasSolapados(inicio: Date, fin: Date | null, desde: Date, hasta: Date): number {
  const a = Math.max(inicio.getTime(), desde.getTime());
  const b = Math.min((fin ?? hasta).getTime(), hasta.getTime());
  return b > a ? Math.round((b - a) / DIA) : 0;
}

/** Kilos que ganó un animal en [desde, hasta) según sus pesajes. */
export function kilosGanadosEnPeriodo(pesajes: PesoFechado[], desde: Date, hasta: Date): number {
  const o = [...pesajes].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  let kilos = 0;
  for (let i = 1; i < o.length; i++) {
    const dias = (o[i].fecha.getTime() - o[i - 1].fecha.getTime()) / DIA;
    if (dias <= 0) continue;
    const dentro = diasSolapados(o[i - 1].fecha, o[i].fecha, desde, hasta);
    kilos += ((o[i].pesoKg - o[i - 1].pesoKg) / dias) * dentro;
  }
  return Math.round(kilos * 10) / 10;
}

/** Suma de días-en-la-finca de varios intervalos dentro del período. */
export function sumaDias(
  intervalos: { inicio: Date; fin: Date | null }[],
  desde: Date,
  hasta: Date,
): number {
  return intervalos.reduce((s, x) => s + diasSolapados(x.inicio, x.fin, desde, hasta), 0);
}

export const dividir = (a: number, b: number, decimales = 2) =>
  b > 0 ? Math.round((a / b) * 10 ** decimales) / 10 ** decimales : null;

/**
 * Parte de los gastos generales (sin centro de costo) que le toca a cría, levante y ceba:
 * se reparte según los animales-día de sus lotes frente a los de toda la finca.
 */
export function generalesDeCarne(generales: number, diasCarne: number, diasTotal: number): number {
  if (generales <= 0 || diasCarne <= 0 || diasTotal <= 0) return 0;
  return Math.round((generales * Math.min(diasCarne, diasTotal)) / diasTotal);
}
