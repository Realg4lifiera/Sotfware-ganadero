import { describe, expect, it } from "vitest";
import { gananciaDiariaGramos, pesajesConGanancia, resumenGanancia } from "@/lib/indicadores/peso";
import { fechaDesdeISO } from "@/lib/fechas";

const p = (iso: string, pesoKg: number) => ({ fecha: fechaDesdeISO(iso), pesoKg });

describe("ganancia diaria de peso", () => {
  it("calcula g/día entre dos pesajes", () => {
    expect(gananciaDiariaGramos(p("2025-01-01", 100), p("2025-01-31", 118))).toBe(600);
    expect(gananciaDiariaGramos(p("2025-01-01", 100), p("2025-01-01", 118))).toBeNull();
    expect(gananciaDiariaGramos(p("2025-01-01", 120), p("2025-01-11", 118))).toBe(-200);
  });

  it("ordena por fecha y calcula desde el pesaje anterior", () => {
    const r = pesajesConGanancia([
      p("2025-03-02", 130),
      p("2025-01-01", 100),
      p("2025-01-31", 115),
    ]);
    expect(r.map((x) => x.gdpGramos)).toEqual([null, 500, 500]);
  });
});

describe("resumenGanancia", () => {
  const f = (s: string) => new Date(`${s}T00:00:00Z`);
  it("último intervalo y total", () => {
    const r = resumenGanancia([
      { fecha: f("2026-03-01"), pesoKg: 200 },
      { fecha: f("2026-01-01"), pesoKg: 170 },
      { fecha: f("2026-04-10"), pesoKg: 230 },
    ]);
    // Último: 30 kg en 40 días = 750 g/día; total: 60 kg en 99 días = 606 g/día.
    expect(r).toMatchObject({ pesoActual: 230, gdpUltimo: 750, gdpTotal: 606, pesajes: 3 });
  });
  it("sin pesajes o con uno solo", () => {
    expect(resumenGanancia([])).toBeNull();
    expect(resumenGanancia([{ fecha: f("2026-01-01"), pesoKg: 100 }])).toMatchObject({
      gdpUltimo: null,
      gdpTotal: null,
    });
  });
});
