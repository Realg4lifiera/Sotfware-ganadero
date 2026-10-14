/**
 * Motor de costos del mes (función pura): convierte compras, gastos administrativos,
 * nómina y depreciación en "líneas de costo" asignadas a rubro, categoría y centro de
 * costo. De aquí salen el informe del productor, el costo por litro y el presupuesto
 * ejecutado.
 *
 * Reglas:
 * - Compras y gastos: cuentan en el mes de su fecha; el IVA suma o no según la finca.
 * - Gastos administrativos: su cuota del mes (período repartido en partes iguales), al
 *   centro indicado o prorrateada con su regla.
 * - Nómina: costo total del pago en el mes de pago, al rubro con clave MANO_OBRA.
 * - Depreciación: cuota mensual de cada activo, al rubro con clave DEPRECIACIONES.
 */
import { costoDeCompra } from "./compras";
import { depreciacionEnMes, type ActivoDepreciable } from "./depreciacion";
import { cuotaEnMes, prorratear, type DetalleRegla } from "./prorrateo";
import type { Periodicidad } from "@/generated/prisma/enums";

export type OrigenCosto = "COMPRA" | "ADMINISTRATIVO" | "NOMINA" | "DEPRECIACION";

export interface LineaCosto {
  origen: OrigenCosto;
  rubroId: string;
  categoriaId: string | null;
  centroCostoId: string | null;
  monto: number;
}

export interface EntradaCostos {
  ivaEsCosto: boolean;
  rubroManoObraId: string | null;
  rubroDepreciacionId: string | null;
  gastos: {
    fecha: Date;
    categoriaId: string;
    rubroId: string;
    centroCostoId: string;
    valorTotal: number;
    valorIva: number;
  }[];
  indirectos: {
    fecha: Date;
    periodicidad: Periodicidad;
    valorTotal: number;
    categoriaId: string;
    rubroId: string;
    centroCostoId: string | null;
    regla: DetalleRegla[] | null;
  }[];
  nomina: { fecha: Date; costoTotal: number; centroCostoId: string }[];
  activos: (ActivoDepreciable & { centroCostoId: string | null })[];
}

const mesDe = (f: Date) => f.toISOString().slice(0, 7);
const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineasDelMes(e: EntradaCostos, mes: string): LineaCosto[] {
  const lineas: LineaCosto[] = [];

  for (const g of e.gastos) {
    if (mesDe(g.fecha) !== mes) continue;
    lineas.push({
      origen: "COMPRA",
      rubroId: g.rubroId,
      categoriaId: g.categoriaId,
      centroCostoId: g.centroCostoId,
      monto: costoDeCompra({ valorTotal: g.valorTotal, valorIva: g.valorIva }, e.ivaEsCosto),
    });
  }

  for (const c of e.indirectos) {
    const cuota = cuotaEnMes(c, mes);
    if (cuota <= 0) continue;
    const base = { origen: "ADMINISTRATIVO" as const, rubroId: c.rubroId, categoriaId: c.categoriaId };
    if (c.centroCostoId || !c.regla?.length) {
      lineas.push({ ...base, centroCostoId: c.centroCostoId, monto: cuota });
    } else {
      for (const [centroCostoId, monto] of prorratear(cuota, c.regla))
        if (monto > 0) lineas.push({ ...base, centroCostoId, monto });
    }
  }

  if (e.rubroManoObraId) {
    for (const p of e.nomina) {
      if (mesDe(p.fecha) !== mes || p.costoTotal <= 0) continue;
      lineas.push({
        origen: "NOMINA",
        rubroId: e.rubroManoObraId,
        categoriaId: null,
        centroCostoId: p.centroCostoId,
        monto: p.costoTotal,
      });
    }
  }

  if (e.rubroDepreciacionId) {
    for (const a of e.activos) {
      const monto = depreciacionEnMes(a, mes);
      if (monto <= 0) continue;
      lineas.push({
        origen: "DEPRECIACION",
        rubroId: e.rubroDepreciacionId,
        categoriaId: null,
        centroCostoId: a.centroCostoId,
        monto,
      });
    }
  }
  return lineas;
}

/** Suma las líneas por una clave (rubro, centro, categoría…). */
export function sumarPor<K extends keyof LineaCosto>(lineas: LineaCosto[], clave: K): Map<LineaCosto[K], number> {
  const m = new Map<LineaCosto[K], number>();
  for (const l of lineas) m.set(l[clave], redondear((m.get(l[clave]) ?? 0) + l.monto));
  return m;
}

export function totalLineas(lineas: LineaCosto[]): number {
  return redondear(lineas.reduce((s, l) => s + l.monto, 0));
}

export interface IndicadoresLeche {
  costoTotal: number;
  costoLecheria: number;
  ingresos: number;
  litrosProducidos: number;
  litrosVendidos: number;
}

/**
 * Indicadores del informe del productor (PENDIENTES DE VALIDACIÓN):
 * costo/litro producido y vendido (total finca y solo lechería), utilidad y rentabilidad.
 */
export function indicadoresLeche(i: IndicadoresLeche) {
  const div = (a: number, b: number) => (b > 0 ? redondear(a / b) : null);
  const utilidad = redondear(i.ingresos - i.costoTotal);
  return {
    costoPorLitroProducido: div(i.costoTotal, i.litrosProducidos),
    costoPorLitroVendido: div(i.costoTotal, i.litrosVendidos),
    costoLecheriaPorLitroProducido: div(i.costoLecheria, i.litrosProducidos),
    costoLecheriaPorLitroVendido: div(i.costoLecheria, i.litrosVendidos),
    utilidad,
    rentabilidad: i.ingresos > 0 ? utilidad / i.ingresos : null,
  };
}
