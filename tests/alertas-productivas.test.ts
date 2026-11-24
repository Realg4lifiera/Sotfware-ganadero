import { describe, expect, it } from "vitest";
import { avisosProductivos, type SituacionProductiva } from "@/lib/dominio/alertas-productivas";
import { configuracionProduccionSchema } from "@/lib/dominio/categoria";

const f = (s: string) => new Date(`${s}T00:00:00Z`);
const hoy = f("2026-11-23");
const c = configuracionProduccionSchema.parse({});

const base: SituacionProductiva = {
  id: "a",
  numero: "205",
  nombre: null,
  categoria: "TERNERA",
  loteId: "l3",
  lote: "Levante",
  fechaIngreso: f("2026-01-01"),
  ultimoPesaje: null,
  inicioLactancia: null,
  ultimoControl: null,
};

describe("avisos de pesaje", () => {
  it("avisa a los 30 días del último pesaje de terneras, levante y ceba", () => {
    const avisos = avisosProductivos(
      [
        { ...base, id: "t1", ultimoPesaje: f("2026-10-24") }, // 30 días
        { ...base, id: "t2", ultimoPesaje: f("2026-10-25") }, // 29 días
        { ...base, id: "m1", categoria: "MACHO_LEVANTE_CEBA", ultimoPesaje: f("2026-09-01") },
      ],
      c,
      hoy,
    );
    expect(avisos.map((a) => a.animalId)).toEqual(["m1", "t1"]);
    expect(avisos[1].detalle).toContain("último pesaje hace 30 días");
  });

  it("cuenta desde el ingreso si el animal nunca se ha pesado", () => {
    const [a] = avisosProductivos([{ ...base, fechaIngreso: f("2026-10-01") }], c, hoy);
    expect(a.detalle).toContain("sin pesajes (ingresó hace 53 días)");
  });

  it("no avisa en categorías que no se pesan (vacas, toros)", () => {
    const avisos = avisosProductivos(
      [
        { ...base, categoria: "VACA_SECA" },
        { ...base, categoria: "TORO" },
      ],
      c,
      hoy,
    );
    expect(avisos).toEqual([]);
  });
});

describe("avisos de control lechero", () => {
  const vaca: SituacionProductiva = {
    ...base,
    id: "v",
    categoria: "VACA_PRODUCCION",
    inicioLactancia: f("2026-09-01"),
  };

  it("avisa a los 8 días del último control", () => {
    const avisos = avisosProductivos(
      [
        { ...vaca, id: "v1", ultimoControl: f("2026-11-15") }, // 8 días
        { ...vaca, id: "v2", ultimoControl: f("2026-11-16") }, // 7 días
      ],
      c,
      hoy,
    );
    expect(avisos.map((a) => a.animalId)).toEqual(["v1"]);
    expect(avisos[0].tipo).toBe("CONTROL_LECHERO");
  });

  it("ignora controles de la lactancia anterior y cuenta desde el parto", () => {
    const [a] = avisosProductivos(
      [{ ...vaca, inicioLactancia: f("2026-11-10"), ultimoControl: f("2026-08-01") }],
      c,
      hoy,
    );
    expect(a.detalle).toContain("Sin control en esta lactancia (parió hace 13 días)");
  });

  it("no avisa en vacas recién paridas", () => {
    expect(avisosProductivos([{ ...vaca, inicioLactancia: f("2026-11-20") }], c, hoy)).toEqual([]);
  });
});
