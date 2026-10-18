/**
 * Rotación mensual del inventario (función pura): inventario inicial, entradas
 * (nacimientos y compras), salidas (descartes, ventas y muertes) e inventario final.
 * La salida de un animal es su PRIMER movimiento de descarte, venta o muerte: una vaca
 * descartada y luego vendida sale una sola vez, el día del descarte (como el inventario
 * activo, que no cuenta a las descartadas).
 */

export type TipoSalida = "DESCARTE" | "VENTA" | "MUERTE";

export interface AnimalRotacion {
  origen: "NACIDO" | "COMPRADO";
  fechaIngreso: Date;
  salidas: { tipo: TipoSalida; fecha: Date }[];
}

export interface Rotacion {
  inicial: number;
  nacimientos: number;
  compras: number;
  descartes: number;
  ventas: number;
  muertes: number;
  final: number;
}

export function salidaDe(a: AnimalRotacion): { tipo: TipoSalida; fecha: Date } | null {
  return a.salidas.length
    ? [...a.salidas].sort((x, y) => x.fecha.getTime() - y.fecha.getTime())[0]
    : null;
}

export function rotacionInventario(animales: AnimalRotacion[], desde: Date, hasta: Date): Rotacion {
  const r: Rotacion = {
    inicial: 0,
    nacimientos: 0,
    compras: 0,
    descartes: 0,
    ventas: 0,
    muertes: 0,
    final: 0,
  };
  for (const a of animales) {
    const salida = salidaDe(a);
    const presenteAntes = a.fechaIngreso < desde && (!salida || salida.fecha >= desde);
    if (presenteAntes) r.inicial++;
    if (a.fechaIngreso >= desde && a.fechaIngreso < hasta) {
      if (a.origen === "NACIDO") r.nacimientos++;
      else r.compras++;
    }
    if (salida && salida.fecha >= desde && salida.fecha < hasta && a.fechaIngreso < hasta) {
      if (salida.tipo === "DESCARTE") r.descartes++;
      else if (salida.tipo === "VENTA") r.ventas++;
      else r.muertes++;
    }
    if (a.fechaIngreso < hasta && (!salida || salida.fecha >= hasta)) r.final++;
  }
  return r;
}
