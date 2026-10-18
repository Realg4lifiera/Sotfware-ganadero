import { describe, expect, it } from "vitest";
import { rotacionInventario, type AnimalRotacion } from "@/lib/dominio/rotacion-inventario";

const f = (s: string) => new Date(`${s}T00:00:00Z`);
const octubre = [f("2026-10-01"), f("2026-11-01")] as const;
const a = (x: Partial<AnimalRotacion>): AnimalRotacion => ({
  origen: "COMPRADO",
  fechaIngreso: f("2025-01-01"),
  salidas: [],
  ...x,
});

describe("rotacionInventario", () => {
  it("cuadra inicial + entradas − salidas = final", () => {
    const r = rotacionInventario(
      [
        a({}),
        a({}),
        a({ origen: "NACIDO", fechaIngreso: f("2026-10-12") }),
        a({ fechaIngreso: f("2026-10-20") }),
        a({ salidas: [{ tipo: "VENTA", fecha: f("2026-10-05") }] }),
        a({ salidas: [{ tipo: "MUERTE", fecha: f("2026-09-30") }] }),
      ],
      ...octubre,
    );
    expect(r).toEqual({
      inicial: 3,
      nacimientos: 1,
      compras: 1,
      descartes: 0,
      ventas: 1,
      muertes: 0,
      final: 4,
    });
    expect(r.inicial + r.nacimientos + r.compras - r.descartes - r.ventas - r.muertes).toBe(
      r.final,
    );
  });

  it("descartada y luego vendida sale una vez, en el descarte", () => {
    const vaca = a({
      salidas: [
        { tipo: "VENTA", fecha: f("2026-11-10") },
        { tipo: "DESCARTE", fecha: f("2026-10-15") },
      ],
    });
    expect(rotacionInventario([vaca], ...octubre)).toMatchObject({
      inicial: 1,
      descartes: 1,
      ventas: 0,
      final: 0,
    });
    expect(rotacionInventario([vaca], f("2026-11-01"), f("2026-12-01"))).toMatchObject({
      inicial: 0,
      ventas: 0,
      final: 0,
    });
  });

  it("nace y muere en el mismo mes", () => {
    const r = rotacionInventario(
      [
        a({
          origen: "NACIDO",
          fechaIngreso: f("2026-10-02"),
          salidas: [{ tipo: "MUERTE", fecha: f("2026-10-09") }],
        }),
      ],
      ...octubre,
    );
    expect(r).toMatchObject({ inicial: 0, nacimientos: 1, muertes: 1, final: 0 });
  });
});
