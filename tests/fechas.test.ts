import { describe, expect, it } from "vitest";
import {
  diasEntre,
  edadTexto,
  fechaAISO,
  fechaDesdeISO,
  formatoFecha,
  hoyISO,
  mesesEntre,
} from "@/lib/fechas";

describe("fechas America/Bogota", () => {
  it("usa la fecha civil de Bogotá para 'hoy'", () => {
    // 2025-03-01 03:00 UTC = 2025-02-28 22:00 en Bogotá
    expect(hoyISO(new Date("2025-03-01T03:00:00Z"))).toBe("2025-02-28");
    expect(hoyISO(new Date("2025-03-01T06:00:00Z"))).toBe("2025-03-01");
  });

  it("convierte ida y vuelta fechas de un día", () => {
    const f = fechaDesdeISO("2025-02-14");
    expect(fechaAISO(f)).toBe("2025-02-14");
    expect(formatoFecha(f)).toBe("14/02/2025");
    expect(() => fechaDesdeISO("2025-02-30")).toThrow();
    expect(() => fechaDesdeISO("14/02/2025")).toThrow();
  });

  it("calcula días y meses cumplidos", () => {
    const a = fechaDesdeISO("2024-01-31");
    expect(diasEntre(a, fechaDesdeISO("2024-03-01"))).toBe(30);
    expect(mesesEntre(a, fechaDesdeISO("2024-02-29"))).toBe(0);
    expect(mesesEntre(a, fechaDesdeISO("2024-03-31"))).toBe(2);
    expect(mesesEntre(fechaDesdeISO("2023-06-15"), fechaDesdeISO("2025-06-14"))).toBe(23);
  });

  it("describe la edad", () => {
    const ref = fechaDesdeISO("2025-06-15");
    expect(edadTexto(fechaDesdeISO("2023-04-15"), ref)).toBe("2 años y 2 meses");
    expect(edadTexto(fechaDesdeISO("2025-06-03"), ref)).toBe("12 días");
    expect(edadTexto(fechaDesdeISO("2024-06-15"), ref)).toBe("1 año");
  });
});
