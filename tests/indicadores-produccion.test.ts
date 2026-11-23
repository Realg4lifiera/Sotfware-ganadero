import { describe, expect, it } from "vitest";
import {
  diasSolapados,
  dividir,
  generalesDeCarne,
  kilosGanadosEnPeriodo,
  sumaDias,
} from "@/lib/indicadores/produccion";

const f = (s: string) => new Date(`${s}T00:00:00Z`);
const octubre = [f("2026-10-01"), f("2026-11-01")] as const;

describe("indicadores productivos", () => {
  it("días solapados con el período", () => {
    expect(diasSolapados(f("2026-09-20"), f("2026-10-11"), ...octubre)).toBe(10);
    expect(diasSolapados(f("2026-10-05"), null, ...octubre)).toBe(27);
    expect(diasSolapados(f("2026-11-05"), null, ...octubre)).toBe(0);
  });

  it("kilos ganados repartidos por días", () => {
    // 30 kg entre el 16/09 y el 16/10 (30 días): a octubre le tocan 15 días = 15 kg;
    // luego 20 kg entre el 16/10 y el 15/11 (30 días): a octubre 16 días = 10,7 kg.
    const pesajes = [
      { fecha: f("2026-09-16"), pesoKg: 200 },
      { fecha: f("2026-10-16"), pesoKg: 230 },
      { fecha: f("2026-11-15"), pesoKg: 250 },
    ];
    expect(kilosGanadosEnPeriodo(pesajes, ...octubre)).toBe(25.7);
    expect(kilosGanadosEnPeriodo([pesajes[0]], ...octubre)).toBe(0);
  });

  it("animales-día del período", () => {
    expect(
      sumaDias(
        [
          { inicio: f("2025-01-01"), fin: null },
          { inicio: f("2026-10-11"), fin: null },
          { inicio: f("2025-01-01"), fin: f("2026-10-06") },
        ],
        ...octubre,
      ),
    ).toBe(31 + 21 + 5);
  });

  it("división protegida", () => {
    expect(dividir(10, 4)).toBe(2.5);
    expect(dividir(10, 0)).toBeNull();
  });
});

describe("generalesDeCarne", () => {
  it("reparte los gastos generales según los animales-día de carne", () => {
    // 300 de 1.200 animales-día son de cría, levante o ceba: les toca el 25 %.
    expect(generalesDeCarne(2_000_000, 300, 1_200)).toBe(500_000);
  });

  it("no asigna nada sin gastos generales ni animales de carne", () => {
    expect(generalesDeCarne(0, 300, 1_200)).toBe(0);
    expect(generalesDeCarne(2_000_000, 0, 1_200)).toBe(0);
    expect(generalesDeCarne(2_000_000, 300, 0)).toBe(0);
  });
});
