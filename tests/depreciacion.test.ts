import { describe, expect, it } from "vitest";
import {
  depreciacionEnMes,
  estadoActivo,
  type ActivoDepreciable,
} from "@/lib/dominio/depreciacion";
import { fechaDesdeISO } from "@/lib/fechas";

const ordeno: ActivoDepreciable = {
  valorCompra: 18000000,
  valorResidual: 2000000,
  fechaCompra: fechaDesdeISO("2024-01-15"),
  vidaUtilMeses: 120,
  activo: true,
};

describe("depreciación en línea recta", () => {
  it("cuota mensual = (compra − residual) / vida útil", () => {
    expect(depreciacionEnMes(ordeno, "2024-01")).toBe(133333.34);
    // 16.000.000 / 120 deja 40 centavos: van en los primeros 40 meses.
    expect(depreciacionEnMes(ordeno, "2027-04")).toBe(133333.34);
    expect(depreciacionEnMes(ordeno, "2027-05")).toBe(133333.33);
  });

  it("no deprecia antes de comprarse, después de su vida útil ni si está inactivo", () => {
    expect(depreciacionEnMes(ordeno, "2023-12")).toBe(0);
    expect(depreciacionEnMes(ordeno, "2033-12")).toBeGreaterThan(0);
    expect(depreciacionEnMes(ordeno, "2034-01")).toBe(0);
    expect(depreciacionEnMes({ ...ordeno, activo: false }, "2024-06")).toBe(0);
  });

  it("acumulada y valor en libros; al final queda el valor residual", () => {
    expect(estadoActivo(ordeno, "2024-12")).toMatchObject({
      acumulada: 1600000.08,
      valorEnLibros: 16399999.92,
      mesesRestantes: 108,
    });
    expect(estadoActivo(ordeno, "2040-01")).toMatchObject({
      acumulada: 16000000,
      valorEnLibros: 2000000,
      mesesRestantes: 0,
    });
    expect(estadoActivo(ordeno, "2023-01").acumulada).toBe(0);
  });
});
