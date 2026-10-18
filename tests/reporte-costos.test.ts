import { describe, expect, it } from "vitest";
import { agruparCostos, mesesEntre } from "@/lib/dominio/reporte-costos";
import type { LineaCosto } from "@/lib/dominio/motor-costos";

const l = (x: Partial<LineaCosto>): LineaCosto => ({
  origen: "COMPRA",
  rubroId: "alim",
  categoriaId: "conc",
  centroCostoId: "lech",
  monto: 0,
  ...x,
});
const meses = [
  {
    mes: "2026-09",
    lineas: [
      l({ monto: 100 }),
      l({ origen: "NOMINA", rubroId: "mo", categoriaId: null, monto: 300, loteId: "L1" }),
    ],
  },
  { mes: "2026-10", lineas: [l({ monto: 50.5, loteId: "L1", animalId: "a1" })] },
];
const nombres = new Map([
  ["alim", "Alimentación"],
  ["mo", "Mano de obra"],
  ["conc", "Concentrado"],
  ["lech", "Lechería"],
  ["L1", "Lote 1"],
  ["a1", "101 · Lola"],
]);

describe("agruparCostos", () => {
  it("por rubro con columnas por mes y participación", () => {
    const r = agruparCostos(meses, "rubro", nombres);
    expect(r.total).toBe(450.5);
    expect(r.totalPorMes).toEqual({ "2026-09": 400, "2026-10": 50.5 });
    expect(r.filas.map((f) => [f.nombre, f.porMes, f.total])).toEqual([
      ["Mano de obra", { "2026-09": 300 }, 300],
      ["Alimentación", { "2026-09": 100, "2026-10": 50.5 }, 150.5],
    ]);
    expect(r.filas[0].participacion).toBeCloseTo(0.666, 2);
  });

  it("por categoría nombra la nómina por su origen", () => {
    const r = agruparCostos(meses, "categoria", nombres);
    expect(r.filas.map((f) => f.nombre)).toEqual(["Nómina", "Concentrado"]);
  });

  it("por lote y por animal dejan lo no asignado al final", () => {
    expect(agruparCostos(meses, "lote", nombres).filas.map((f) => [f.nombre, f.total])).toEqual([
      ["Lote 1", 350.5],
      ["Sin asignar", 100],
    ]);
    expect(agruparCostos(meses, "animal", nombres).filas.map((f) => f.nombre)).toEqual([
      "101 · Lola",
      "Sin asignar",
    ]);
  });

  it("respeta un orden dado", () => {
    const orden = (k: string) => (k === "alim" ? 0 : 1);
    expect(agruparCostos(meses, "rubro", nombres, orden).filas[0].nombre).toBe("Alimentación");
  });
});

describe("mesesEntre", () => {
  it("rango incluido, cruzando el año, con límite", () => {
    expect(mesesEntre("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(mesesEntre("2026-05", "2026-04")).toEqual([]);
    expect(mesesEntre("2020-01", "2026-12", 24)).toHaveLength(24);
  });
});
