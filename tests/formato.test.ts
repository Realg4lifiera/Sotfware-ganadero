import { describe, expect, it } from "vitest";
import {
  formatoCOP,
  formatoKg,
  formatoLitros,
  formatoNumero,
  formatoPorcentaje,
  parsearNumeroCO,
} from "@/lib/formato";

describe("formato es-CO", () => {
  it("formatea pesos colombianos", () => {
    expect(formatoCOP(1250000)).toBe("$ 1.250.000");
    expect(formatoCOP("95109.17")).toBe("$ 95.109,17");
    expect(formatoCOP(-5000)).toBe("-$ 5.000");
    expect(formatoCOP(null)).toBe("—");
  });

  it("formatea litros, kilos y números", () => {
    expect(formatoLitros(12.5)).toBe("12,5 L");
    expect(formatoKg("450.00")).toBe("450 kg");
    expect(formatoNumero(45777)).toBe("45.777");
    expect(formatoPorcentaje(0.128)).toBe("12,8 %");
  });

  it("acepta objetos tipo Decimal", () => {
    expect(formatoCOP({ toString: () => "1823.34" })).toBe("$ 1.823,34");
  });

  it("parsea números escritos en formato colombiano", () => {
    expect(parsearNumeroCO("1.250.000")).toBe(1250000);
    expect(parsearNumeroCO("$ 1.250.000")).toBe(1250000);
    expect(parsearNumeroCO("12,5")).toBe(12.5);
    expect(parsearNumeroCO("1.250,75")).toBe(1250.75);
    expect(parsearNumeroCO("12.5")).toBe(12.5);
    expect(parsearNumeroCO("")).toBeNull();
    expect(parsearNumeroCO("abc")).toBeNull();
  });
});
