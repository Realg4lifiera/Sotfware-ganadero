import { describe, expect, it } from "vitest";
import { informeProductor } from "@/lib/dominio/informe-productor";
import type { LineaCosto } from "@/lib/dominio/motor-costos";

const rubros = [
  { id: "mo", nombre: "Mano de obra", grupo: "COSTO_FIJO" },
  { id: "dep", nombre: "Depreciaciones", grupo: "COSTO_FIJO" },
  { id: "alim", nombre: "Alimentación", grupo: "COSTO_VARIABLE" },
];
const linea = (rubroId: string, monto: number, centroCostoId = "lech"): LineaCosto => ({
  origen: "COMPRA",
  rubroId,
  categoriaId: null,
  centroCostoId,
  monto,
});

describe("informeProductor", () => {
  const inf = informeProductor({
    rubros,
    lineas: [linea("mo", 4_000_000), linea("alim", 5_000_000), linea("alim", 1_000_000, "ceba")],
    centroLecheriaId: "lech",
    litros: { producidos: 10_000, vendidos: 9_500, consumo: 500 },
    ingresos: { leche: 17_100_000, otros: 900_000 },
  });

  it("agrupa rubros con total, $/L y participación", () => {
    expect(inf.costoTotal).toBe(10_000_000);
    expect(inf.grupos.map((g) => [g.grupo, g.total])).toEqual([
      ["COSTO_FIJO", 4_000_000],
      ["COSTO_VARIABLE", 6_000_000],
    ]);
    const alim = inf.grupos[1].rubros[0];
    expect(alim.porLitro).toBe(600);
    expect(alim.participacion).toBeCloseTo(0.6);
    expect(inf.grupos[0].rubros[1]).toMatchObject({ nombre: "Depreciaciones", total: 0 });
  });

  it("calcula indicadores de leche, finca y lechería", () => {
    expect(inf.costoLecheria).toBe(9_000_000);
    expect(inf.precioVenta).toBe(1800);
    expect(inf.ingresos.total).toBe(18_000_000);
    expect(inf.utilidad).toBe(8_000_000);
    expect(inf.rentabilidad).toBeCloseTo(0.4444, 4);
    expect(inf.costoPorLitroProducido).toBe(1000);
    expect(inf.costoPorLitroVendido).toBe(1052.63);
    expect(inf.costoLecheriaPorLitroProducido).toBe(900);
  });

  it("sin litros no divide", () => {
    const vacio = informeProductor({
      rubros,
      lineas: [],
      centroLecheriaId: null,
      litros: { producidos: 0, vendidos: 0, consumo: 0 },
      ingresos: { leche: 0, otros: 0 },
    });
    expect(vacio.costoPorLitroProducido).toBeNull();
    expect(vacio.precioVenta).toBeNull();
    expect(vacio.rentabilidad).toBeNull();
    expect(vacio.grupos[0].participacion).toBeNull();
  });
});
