/**
 * Reporte de costos (función pura): agrupa las líneas del motor de costos de varios meses
 * por rubro, categoría, centro de costo, lote, animal u origen.
 */
import type { LineaCosto, OrigenCosto } from "./motor-costos";

export const AGRUPACIONES = ["rubro", "categoria", "centro", "lote", "animal", "origen"] as const;
export type Agrupacion = (typeof AGRUPACIONES)[number];

export const ETIQUETA_AGRUPACION: Record<Agrupacion, string> = {
  rubro: "Rubro",
  categoria: "Categoría",
  centro: "Centro de costo",
  lote: "Lote",
  animal: "Animal",
  origen: "Origen",
};

export const ETIQUETA_ORIGEN_COSTO: Record<OrigenCosto, string> = {
  COMPRA: "Compras y gastos",
  ADMINISTRATIVO: "Gastos administrativos",
  NOMINA: "Nómina",
  DEPRECIACION: "Depreciación",
};

export interface FilaReporteCostos {
  clave: string;
  nombre: string;
  porMes: Record<string, number>;
  total: number;
  participacion: number | null;
}

const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const SIN_ASIGNAR = "—";

function claveDe(l: LineaCosto, por: Agrupacion): string {
  switch (por) {
    case "rubro":
      return l.rubroId;
    case "categoria":
      return l.categoriaId ?? `origen:${l.origen}`;
    case "centro":
      return l.centroCostoId ?? SIN_ASIGNAR;
    case "lote":
      return l.loteId ?? SIN_ASIGNAR;
    case "animal":
      return l.animalId ?? SIN_ASIGNAR;
    case "origen":
      return l.origen;
  }
}

/**
 * @param nombres nombre de cada clave (rubros, categorías, centros, lotes, animales).
 *   Las líneas sin categoría (nómina, depreciación) se nombran por su origen.
 */
export function agruparCostos(
  meses: { mes: string; lineas: LineaCosto[] }[],
  por: Agrupacion,
  nombres: Map<string, string>,
  orden: (clave: string) => number = () => 0,
): { filas: FilaReporteCostos[]; totalPorMes: Record<string, number>; total: number } {
  const filas = new Map<string, FilaReporteCostos>();
  const totalPorMes: Record<string, number> = Object.fromEntries(meses.map((m) => [m.mes, 0]));
  for (const { mes, lineas } of meses) {
    for (const l of lineas) {
      const clave = claveDe(l, por);
      const nombre =
        clave === SIN_ASIGNAR
          ? "Sin asignar"
          : clave.startsWith("origen:")
            ? ETIQUETA_ORIGEN_COSTO[l.origen]
            : por === "origen"
              ? ETIQUETA_ORIGEN_COSTO[l.origen]
              : (nombres.get(clave) ?? "Desconocido");
      const f =
        filas.get(clave) ??
        ({ clave, nombre, porMes: {}, total: 0, participacion: null } as FilaReporteCostos);
      f.porMes[mes] = redondear((f.porMes[mes] ?? 0) + l.monto);
      f.total = redondear(f.total + l.monto);
      totalPorMes[mes] = redondear(totalPorMes[mes] + l.monto);
      filas.set(clave, f);
    }
  }
  const total = redondear(Object.values(totalPorMes).reduce((s, x) => s + x, 0));
  const lista = [...filas.values()].map((f) => ({
    ...f,
    participacion: total > 0 ? f.total / total : null,
  }));
  // "Sin asignar" al final; el resto por el orden dado (p. ej. el del rubro) y luego por monto.
  lista.sort(
    (a, b) =>
      Number(a.clave === SIN_ASIGNAR) - Number(b.clave === SIN_ASIGNAR) ||
      orden(a.clave) - orden(b.clave) ||
      b.total - a.total,
  );
  return { filas: lista, totalPorMes, total };
}

/** Meses "AAAA-MM" de `desde` a `hasta` (incluidos), máximo `limite`. */
export function mesesEntre(desde: string, hasta: string, limite = 24): string[] {
  const [a1, m1] = desde.split("-").map(Number);
  const [a2, m2] = hasta.split("-").map(Number);
  const n = (a2 - a1) * 12 + (m2 - m1) + 1;
  if (n <= 0) return [];
  return Array.from({ length: Math.min(n, limite) }, (_, i) =>
    new Date(Date.UTC(a1, m1 - 1 + i, 1)).toISOString().slice(0, 7),
  );
}
