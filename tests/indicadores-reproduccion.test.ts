import { describe, expect, it } from "vitest";
import {
  diasAbiertos,
  diasAbiertosEnCurso,
  edadPrimerParto,
  indicadoresReproductivos,
  intervalosEntrePartos,
  type HistoriaReproductiva,
} from "@/lib/indicadores/reproduccion";

const f = (s: string) => new Date(`${s}T00:00:00Z`);

// Vaca con dos partos registrados desde novilla.
const lola: HistoriaReproductiva = {
  id: "lola",
  fechaNacimiento: f("2022-01-01"),
  numeroPartos: 2,
  partos: [f("2024-12-20"), f("2024-01-10")],
  servicios: [f("2023-04-01"), f("2024-03-01"), f("2024-03-22"), f("2025-02-15")],
  concepciones: [f("2023-04-01"), f("2024-03-22"), f("2025-02-15")],
};
// Vaca comprada con partos anteriores: su primer parto no está en el sistema.
const rosa: HistoriaReproductiva = {
  id: "rosa",
  fechaNacimiento: f("2019-06-01"),
  numeroPartos: 4,
  partos: [f("2024-06-01")],
  servicios: [f("2024-08-01"), f("2024-08-22"), f("2024-09-12")],
  concepciones: [],
};

describe("indicadores reproductivos", () => {
  it("intervalo entre partos", () => {
    expect(intervalosEntrePartos(lola.partos)).toEqual([345]);
    expect(intervalosEntrePartos([f("2024-06-01")])).toEqual([]);
  });

  it("días abiertos hasta la concepción siguiente", () => {
    // 2024-01-10 → 2024-03-22 = 72; 2024-12-20 → 2025-02-15 = 57
    expect(diasAbiertos(lola.partos, lola.concepciones)).toEqual([72, 57]);
    expect(diasAbiertos(rosa.partos, rosa.concepciones)).toEqual([]);
  });

  it("edad al primer parto solo con todos los partos registrados", () => {
    expect(edadPrimerParto(lola)).toBe(739);
    expect(edadPrimerParto(rosa)).toBeNull();
  });

  it("indicadores del período 2024", () => {
    const r = indicadoresReproductivos([lola, rosa], f("2024-01-01"), f("2025-01-01"));
    expect(r.iepPromedio).toBe(345);
    expect(r.diasAbiertosPromedio).toBe(72);
    // Servicios 2024: lola 2 + rosa 3 = 5; concepciones 2024: 1 (lola, 2024-03-22).
    expect(r.serviciosPorConcepcion).toBe(5);
    // Expuestas: lola y rosa; preñada: lola.
    expect(r.tasaPrenez).toBe(0.5);
    expect(r.edadPrimerPartoMeses).toBe(24.3);
    expect(r.n).toEqual({
      iep: 1,
      diasAbiertos: 1,
      servicios: 5,
      concepciones: 1,
      expuestas: 2,
      primerParto: 1,
    });
  });

  it("sin datos devuelve nulos", () => {
    const r = indicadoresReproductivos([], f("2024-01-01"), f("2025-01-01"));
    expect(r.iepPromedio).toBeNull();
    expect(r.serviciosPorConcepcion).toBeNull();
    expect(r.tasaPrenez).toBeNull();
  });
});

describe("diasAbiertosEnCurso", () => {
  const d = (s: string) => new Date(`${s}T00:00:00Z`);
  const hoy = d("2026-11-23");

  it("cuenta desde el último parto si no ha concebido después", () => {
    expect(diasAbiertosEnCurso([d("2025-01-10"), d("2026-08-25")], [d("2025-04-01")], hoy)).toBe(
      90,
    );
  });

  it("es null si ya concibió después del último parto o nunca ha parido", () => {
    expect(diasAbiertosEnCurso([d("2026-06-01")], [d("2026-09-01")], hoy)).toBeNull();
    expect(diasAbiertosEnCurso([], [], hoy)).toBeNull();
  });
});
