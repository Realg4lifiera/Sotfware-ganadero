import { describe, expect, it } from "vitest";
import {
  indicadoresLeche,
  lineasDelMes,
  sumarPor,
  totalLineas,
  type EntradaCostos,
} from "@/lib/dominio/motor-costos";
import { fechaDesdeISO } from "@/lib/fechas";

const f = fechaDesdeISO;
const entrada: EntradaCostos = {
  ivaEsCosto: true,
  rubroManoObraId: "r-mano",
  rubroDepreciacionId: "r-dep",
  gastos: [
    { fecha: f("2025-06-05"), categoriaId: "c-conc", rubroId: "r-alim", centroCostoId: "lech", valorTotal: 298410, valorIva: 14210 },
    { fecha: f("2025-07-01"), categoriaId: "c-conc", rubroId: "r-alim", centroCostoId: "lech", valorTotal: 999, valorIva: 0 },
  ],
  indirectos: [
    // Predial anual repartido con regla 75/15/10
    {
      fecha: f("2025-01-10"),
      periodicidad: "ANUAL",
      valorTotal: 1200000,
      categoriaId: "c-pred",
      rubroId: "r-serv",
      centroCostoId: null,
      regla: [
        { centroCostoId: "lech", porcentaje: 75 },
        { centroCostoId: "cria", porcentaje: 15 },
        { centroCostoId: "past", porcentaje: 10 },
      ],
    },
    // Transporte de leche del mes, directo a lechería
    { fecha: f("2025-06-30"), periodicidad: "MENSUAL", valorTotal: 95109.17, categoriaId: "c-trans", rubroId: "r-trans", centroCostoId: "lech", regla: null },
  ],
  nomina: [
    { fecha: f("2025-06-15"), costoTotal: 2175000, centroCostoId: "lech" },
    { fecha: f("2025-05-31"), costoTotal: 1000000, centroCostoId: "lech" },
  ],
  activos: [
    { valorCompra: 18000000, valorResidual: 2000000, fechaCompra: f("2024-01-15"), vidaUtilMeses: 120, activo: true, centroCostoId: "lech" },
  ],
};

describe("motor de costos", () => {
  const lineas = lineasDelMes(entrada, "2025-06");

  it("incluye solo lo del mes, con cuotas, prorrateo, nómina y depreciación", () => {
    expect(lineas.map((l) => [l.origen, l.centroCostoId, l.monto])).toEqual([
      ["COMPRA", "lech", 298410],
      ["ADMINISTRATIVO", "lech", 75000],
      ["ADMINISTRATIVO", "cria", 15000],
      ["ADMINISTRATIVO", "past", 10000],
      ["ADMINISTRATIVO", "lech", 95109.17],
      ["NOMINA", "lech", 2175000],
      ["DEPRECIACION", "lech", 133333.34],
    ]);
    expect(totalLineas(lineas)).toBe(2801852.51);
  });

  it("agrupa por rubro y por centro de costo", () => {
    expect(sumarPor(lineas, "rubroId").get("r-serv")).toBe(100000);
    expect(sumarPor(lineas, "rubroId").get("r-mano")).toBe(2175000);
    expect(sumarPor(lineas, "centroCostoId").get("cria")).toBe(15000);
    expect(sumarPor(lineas, "centroCostoId").get("lech")).toBe(2776852.51);
  });

  it("respeta la configuración del IVA", () => {
    const sinIva = lineasDelMes({ ...entrada, ivaEsCosto: false }, "2025-06");
    expect(sinIva[0].monto).toBe(284200);
  });
});

describe("indicadores del informe del productor", () => {
  it("reproduce el informe de La Arboleda (junio)", () => {
    const r = indicadoresLeche({
      costoTotal: 83466842.41,
      costoLecheria: 83466842.41,
      ingresos: 95723728.62,
      litrosProducidos: 45777,
      litrosVendidos: 43257,
    });
    expect(r.costoPorLitroVendido).toBe(1929.56);
    expect(r.costoPorLitroProducido).toBe(1823.34);
    expect(r.utilidad).toBe(12256886.21);
    expect(r.rentabilidad).toBeCloseTo(0.12804, 4);
  });

  it("sin litros ni ingresos no divide por cero", () => {
    const r = indicadoresLeche({ costoTotal: 100, costoLecheria: 0, ingresos: 0, litrosProducidos: 0, litrosVendidos: 0 });
    expect(r.costoPorLitroProducido).toBeNull();
    expect(r.rentabilidad).toBeNull();
    expect(r.utilidad).toBe(-100);
  });
});
