import { describe, expect, it } from "vitest";
import {
  diasGestacionA,
  fechaHoraBogota,
  numeroServicio,
  partoDesdeDiagnostico,
  partoDesdeServicio,
} from "@/lib/dominio/gestacion";

const f = (s: string) => new Date(`${s}T00:00:00Z`);
const iso = (d: Date | null) => d?.toISOString().slice(0, 10) ?? null;

describe("gestación", () => {
  it("parto probable a 283 días del servicio", () => {
    expect(iso(partoDesdeServicio(f("2026-01-10"), 283))).toBe("2026-10-20");
  });

  it("desde el diagnóstico usa los días estimados por el veterinario", () => {
    // 60 días de gestación el 2026-03-11 → faltan 223 días.
    expect(
      iso(
        partoDesdeDiagnostico(
          { fecha: f("2026-03-11"), diasGestacion: 60, fechaServicio: f("2026-01-01") },
          283,
        ),
      ),
    ).toBe("2026-10-20");
    expect(
      iso(
        partoDesdeDiagnostico(
          { fecha: f("2026-03-11"), diasGestacion: null, fechaServicio: f("2026-01-10") },
          283,
        ),
      ),
    ).toBe("2026-10-20");
    expect(
      partoDesdeDiagnostico(
        { fecha: f("2026-03-11"), diasGestacion: null, fechaServicio: null },
        283,
      ),
    ).toBeNull();
  });

  it("días de gestación a una fecha", () => {
    expect(diasGestacionA(f("2026-10-20"), f("2026-08-21"), 283)).toBe(223);
  });

  it("número de servicio en el ciclo", () => {
    const previos = [f("2025-05-01"), f("2026-02-01"), f("2026-02-22")];
    expect(numeroServicio(previos, f("2026-01-05"), f("2026-03-15"))).toBe(3);
    expect(numeroServicio(previos, null, f("2026-03-15"))).toBe(4);
    expect(numeroServicio([], f("2026-01-05"), f("2026-03-15"))).toBe(1);
  });

  it("hora de Bogotá", () => {
    expect(fechaHoraBogota(f("2026-10-18"), "06:30").toISOString()).toBe(
      "2026-10-18T11:30:00.000Z",
    );
    expect(fechaHoraBogota(f("2026-10-18"), null).toISOString()).toBe("2026-10-18T17:00:00.000Z");
  });
});
