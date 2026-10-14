/**
 * Informe del productor (mensual, estilo Colanta) — función pura.
 * Rubros con total, $/L (sobre litros producidos) y % de participación; litros, precio
 * de venta, ingresos, utilidad, rentabilidad y costo por litro producido y vendido, para
 * la finca completa y solo para el centro Lechería.
 */
import { indicadoresLeche, type LineaCosto } from "./motor-costos";

export interface RubroInforme {
  rubroId: string;
  nombre: string;
  total: number;
  porLitro: number | null;
  participacion: number | null;
}

export interface GrupoInforme {
  grupo: string;
  total: number;
  porLitro: number | null;
  participacion: number | null;
  rubros: RubroInforme[];
}

export interface EntradaInforme {
  rubros: { id: string; nombre: string; grupo: string }[];
  lineas: LineaCosto[];
  centroLecheriaId: string | null;
  litros: { producidos: number; vendidos: number; consumo: number };
  ingresos: { leche: number; otros: number };
}

const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function informeProductor(e: EntradaInforme) {
  const porRubro = new Map<string, number>();
  let costoTotal = 0;
  let costoLecheria = 0;
  for (const l of e.lineas) {
    porRubro.set(l.rubroId, (porRubro.get(l.rubroId) ?? 0) + l.monto);
    costoTotal += l.monto;
    if (e.centroLecheriaId && l.centroCostoId === e.centroLecheriaId) costoLecheria += l.monto;
  }
  costoTotal = redondear(costoTotal);
  costoLecheria = redondear(costoLecheria);
  const porLitro = (x: number) =>
    e.litros.producidos > 0 ? redondear(x / e.litros.producidos) : null;
  const participacion = (x: number) => (costoTotal > 0 ? x / costoTotal : null);

  const grupos: GrupoInforme[] = [];
  for (const r of e.rubros) {
    let g = grupos.find((x) => x.grupo === r.grupo);
    if (!g) {
      g = { grupo: r.grupo, total: 0, porLitro: null, participacion: null, rubros: [] };
      grupos.push(g);
    }
    const total = redondear(porRubro.get(r.id) ?? 0);
    g.rubros.push({
      rubroId: r.id,
      nombre: r.nombre,
      total,
      porLitro: porLitro(total),
      participacion: participacion(total),
    });
    g.total = redondear(g.total + total);
  }
  for (const g of grupos) {
    g.porLitro = porLitro(g.total);
    g.participacion = participacion(g.total);
  }

  const ingresos = redondear(e.ingresos.leche + e.ingresos.otros);
  return {
    grupos,
    costoTotal,
    costoLecheria,
    litros: e.litros,
    ingresos: { leche: e.ingresos.leche, otros: e.ingresos.otros, total: ingresos },
    precioVenta: e.litros.vendidos > 0 ? redondear(e.ingresos.leche / e.litros.vendidos) : null,
    ...indicadoresLeche({
      costoTotal,
      costoLecheria,
      ingresos,
      litrosProducidos: e.litros.producidos,
      litrosVendidos: e.litros.vendidos,
    }),
  };
}

export type InformeProductor = ReturnType<typeof informeProductor>;
