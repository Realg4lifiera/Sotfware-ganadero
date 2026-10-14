import { describe, expect, it } from "vitest";
import { comparativoPresupuesto, porcentajeEjecucion } from "@/lib/dominio/presupuesto";
import type { LineaCosto } from "@/lib/dominio/motor-costos";

const rubros = [
  { id: "alim", nombre: "Alimentación", grupo: "COSTO_VARIABLE" },
  { id: "mo", nombre: "Mano de obra", grupo: "COSTO_FIJO" },
];
const categorias = [
  { id: "conc", nombre: "Concentrado", rubroId: "alim" },
  { id: "sal", nombre: "Sales", rubroId: "alim" },
  { id: "nom", nombre: "Nómina", rubroId: "mo" },
];
const linea = (l: Partial<LineaCosto>): LineaCosto => ({
  origen: "COMPRA",
  rubroId: "alim",
  categoriaId: "conc",
  centroCostoId: "c1",
  monto: 0,
  ...l,
});

describe("comparativoPresupuesto", () => {
  it("compara por categoría y agrupa por rubro", () => {
    const r = comparativoPresupuesto(
      rubros,
      categorias,
      new Map([
        ["conc", 1_000_000],
        ["nom", 3_000_000],
      ]),
      [
        linea({ monto: 600_000 }),
        linea({ monto: 500_000.5 }),
        linea({ categoriaId: "sal", monto: 80_000 }),
      ],
    );
    const alim = r.find((x) => x.rubroId === "alim")!;
    expect(alim.presupuestado).toBe(1_000_000);
    expect(alim.ejecutado).toBe(1_180_000.5);
    expect(alim.filas.map((f) => [f.nombre, f.presupuestado, f.ejecutado])).toEqual([
      ["Concentrado", 1_000_000, 1_100_000.5],
      ["Sales", 0, 80_000],
    ]);
  });

  it("muestra la nómina (sin categoría) como fila propia del rubro", () => {
    const r = comparativoPresupuesto(rubros, categorias, new Map([["nom", 3_000_000]]), [
      linea({ origen: "NOMINA", rubroId: "mo", categoriaId: null, monto: 2_500_000 }),
      linea({ origen: "NOMINA", rubroId: "mo", categoriaId: null, monto: 400_000 }),
    ]);
    const mo = r.find((x) => x.rubroId === "mo")!;
    expect(mo.presupuestado).toBe(3_000_000);
    expect(mo.ejecutado).toBe(2_900_000);
    expect(mo.filas[1]).toMatchObject({ nombre: "Pagos de nómina", ejecutado: 2_900_000 });
  });

  it("porcentaje de ejecución", () => {
    expect(porcentajeEjecucion(1000, 1100)).toBeCloseTo(1.1);
    expect(porcentajeEjecucion(0, 50)).toBeNull();
  });
});
