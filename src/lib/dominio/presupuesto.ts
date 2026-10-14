/**
 * Comparativo presupuesto vs. ejecutado (función pura). El presupuesto se fija por
 * categoría de gasto; el ejecutado sale del motor de costos. Se agrupa por rubro (como el
 * informe de Colanta). Nómina y depreciación no tienen categoría: se muestran como una
 * fila propia dentro de su rubro.
 */
import type { LineaCosto, OrigenCosto } from "./motor-costos";

export interface FilaComparativo {
  /** Id de la categoría, o el origen para líneas sin categoría (nómina, depreciación). */
  clave: string;
  categoriaId: string | null;
  nombre: string;
  presupuestado: number;
  ejecutado: number;
}

export interface RubroComparativo {
  rubroId: string;
  nombre: string;
  grupo: string;
  presupuestado: number;
  ejecutado: number;
  filas: FilaComparativo[];
}

const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const NOMBRE_SIN_CATEGORIA: Record<OrigenCosto, string> = {
  COMPRA: "Compras",
  ADMINISTRATIVO: "Gastos administrativos",
  NOMINA: "Pagos de nómina",
  DEPRECIACION: "Depreciación de activos",
};

export function comparativoPresupuesto(
  rubros: { id: string; nombre: string; grupo: string }[],
  categorias: { id: string; nombre: string; rubroId: string }[],
  presupuesto: Map<string, number>,
  lineas: LineaCosto[],
): RubroComparativo[] {
  const ejecutadoCategoria = new Map<string, number>();
  const sinCategoria = new Map<string, Map<OrigenCosto, number>>();
  for (const l of lineas) {
    if (l.categoriaId) {
      ejecutadoCategoria.set(l.categoriaId, (ejecutadoCategoria.get(l.categoriaId) ?? 0) + l.monto);
    } else {
      const m = sinCategoria.get(l.rubroId) ?? new Map<OrigenCosto, number>();
      m.set(l.origen, (m.get(l.origen) ?? 0) + l.monto);
      sinCategoria.set(l.rubroId, m);
    }
  }

  return rubros.map((r) => {
    const filas: FilaComparativo[] = categorias
      .filter((c) => c.rubroId === r.id)
      .map((c) => ({
        clave: c.id,
        categoriaId: c.id,
        nombre: c.nombre,
        presupuestado: redondear(presupuesto.get(c.id) ?? 0),
        ejecutado: redondear(ejecutadoCategoria.get(c.id) ?? 0),
      }));
    for (const [origen, monto] of sinCategoria.get(r.id) ?? []) {
      filas.push({
        clave: origen,
        categoriaId: null,
        nombre: NOMBRE_SIN_CATEGORIA[origen],
        presupuestado: 0,
        ejecutado: redondear(monto),
      });
    }
    return {
      rubroId: r.id,
      nombre: r.nombre,
      grupo: r.grupo,
      presupuestado: redondear(filas.reduce((s, f) => s + f.presupuestado, 0)),
      ejecutado: redondear(filas.reduce((s, f) => s + f.ejecutado, 0)),
      filas,
    };
  });
}

/** Ejecutado / presupuestado (null si no hay presupuesto). */
export function porcentajeEjecucion(presupuestado: number, ejecutado: number): number | null {
  return presupuestado > 0 ? ejecutado / presupuestado : null;
}
