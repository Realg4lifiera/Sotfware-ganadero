import { describe, expect, it } from "vitest";
import { animalesEnRetiro, type EventoRetiro } from "@/lib/dominio/retiros";

const f = (s: string) => new Date(`${s}T00:00:00Z`);
const hoy = f("2026-10-18");
const ev = (e: Partial<EventoRetiro>): EventoRetiro => ({
  fecha: f("2026-10-15"),
  producto: "Oxitetraciclina",
  animalId: null,
  loteId: null,
  retiroLecheHasta: null,
  retiroCarneHasta: null,
  ...e,
});

describe("animalesEnRetiro", () => {
  it("animal individual con retiro vigente y vencido", () => {
    const r = animalesEnRetiro(
      [
        ev({
          animalId: "a1",
          retiroLecheHasta: f("2026-10-20"),
          retiroCarneHasta: f("2026-11-10"),
        }),
        ev({ animalId: "a2", retiroLecheHasta: f("2026-10-17") }),
      ],
      new Map(),
      hoy,
    );
    expect(r).toEqual([
      {
        animalId: "a1",
        lecheHasta: f("2026-10-20"),
        carneHasta: f("2026-11-10"),
        productos: ["Oxitetraciclina"],
      },
    ]);
  });

  it("el último día del retiro todavía cuenta", () => {
    expect(
      animalesEnRetiro([ev({ animalId: "a1", retiroLecheHasta: hoy })], new Map(), hoy),
    ).toHaveLength(1);
  });

  it("evento de lote cubre a sus animales y combina retiros", () => {
    const r = animalesEnRetiro(
      [
        ev({ loteId: "L1", producto: "Ivermectina", retiroCarneHasta: f("2026-11-30") }),
        ev({ animalId: "a1", retiroLecheHasta: f("2026-10-25") }),
      ],
      new Map([["L1", ["a1", "a2"]]]),
      hoy,
    );
    expect(r.find((x) => x.animalId === "a1")).toEqual({
      animalId: "a1",
      lecheHasta: f("2026-10-25"),
      carneHasta: f("2026-11-30"),
      productos: ["Ivermectina", "Oxitetraciclina"],
    });
    expect(r.find((x) => x.animalId === "a2")?.lecheHasta).toBeNull();
  });
});
