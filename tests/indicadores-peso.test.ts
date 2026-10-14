import { describe, expect, it } from "vitest";
import { gananciaDiariaGramos, pesajesConGanancia } from "@/lib/indicadores/peso";
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
