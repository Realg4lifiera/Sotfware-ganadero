import { describe, expect, it } from "vitest";
import {
  cuotaEnMes,
  errorRegla,
  mesesCubiertos,
  prorratear,
  repartir,
} from "@/lib/dominio/prorrateo";
import { fechaDesdeISO } from "@/lib/fechas";

describe("reparto por meses", () => {
  it("lista los meses del período, cruzando el año", () => {
    expect(mesesCubiertos(fechaDesdeISO("2025-11-15"), "TRIMESTRAL")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
    expect(mesesCubiertos(fechaDesdeISO("2025-03-01"), "MENSUAL")).toEqual(["2025-03"]);
  });

  it("reparte el predial anual en 12 cuotas que suman exacto", () => {
    const predial = {
      fecha: fechaDesdeISO("2025-01-10"),
      periodicidad: "ANUAL" as const,
      valorTotal: 1000000,
    };
    const cuotas = Array.from({ length: 12 }, (_, i) =>
      cuotaEnMes(predial, `2025-${String(i + 1).padStart(2, "0")}`),
    );
    expect(cuotas[0]).toBe(83333.34);
    expect(cuotas[11]).toBe(83333.33);
    expect(Math.round(cuotas.reduce((s, c) => s + c, 0) * 100) / 100).toBe(1000000);
    expect(cuotaEnMes(predial, "2026-01")).toBe(0);
    expect(cuotaEnMes(predial, "2024-12")).toBe(0);
  });
});

describe("prorrateo entre centros de costo", () => {
  it("reparte sin perder centavos", () => {
    expect(repartir(100, [1, 1, 1])).toEqual([33.34, 33.33, 33.33]);
    expect(repartir(0, [50, 50])).toEqual([0, 0]);
    const r = prorratear(10300000, [
      { centroCostoId: "lecheria", porcentaje: 75 },
      { centroCostoId: "cria", porcentaje: 15 },
      { centroCostoId: "pasturas", porcentaje: 10 },
    ]);
    expect(Object.fromEntries(r)).toEqual({ lecheria: 7725000, cria: 1545000, pasturas: 1030000 });
  });

  it("valida que la regla sume 100 % sin repetidos", () => {
    expect(
      errorRegla([
        { centroCostoId: "a", porcentaje: 60 },
        { centroCostoId: "b", porcentaje: 40 },
      ]),
    ).toBeNull();
    expect(
      errorRegla([
        { centroCostoId: "a", porcentaje: 33.33 },
        { centroCostoId: "b", porcentaje: 66.67 },
      ]),
    ).toBeNull();
    expect(errorRegla([{ centroCostoId: "a", porcentaje: 60 }])).toMatch(/suman 60/);
    expect(
      errorRegla([
        { centroCostoId: "a", porcentaje: 50 },
        { centroCostoId: "a", porcentaje: 50 },
      ]),
    ).toMatch(/repetidos/);
    expect(errorRegla([])).toMatch(/al menos/);
  });
});
