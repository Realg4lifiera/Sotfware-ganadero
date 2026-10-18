import { describe, expect, it } from "vitest";
import { controlesDiarios, produccionLactancia } from "@/lib/indicadores/lactancia";

const parto = new Date("2026-01-01T00:00:00Z");
const dia = (n: number) => new Date(parto.getTime() + n * 86_400_000);

describe("controlesDiarios", () => {
  it("suma mañana y tarde del mismo día", () => {
    expect(
      controlesDiarios([
        { fecha: dia(30), litros: 12.5 },
        { fecha: dia(30), litros: 10 },
        { fecha: dia(60), litros: 20 },
      ]),
    ).toEqual([
      { fecha: dia(30), litros: 22.5 },
      { fecha: dia(60), litros: 20 },
    ]);
  });
});

describe("produccionLactancia", () => {
  it("sin controles no estima", () => {
    const p = produccionLactancia({ inicio: parto, fin: null }, [], dia(40));
    expect(p).toMatchObject({ diasEnLeche: 40, controles: 0, total: null, ajustada305: null });
  });

  it("lactancia abierta: integra hasta el último control y proyecta 305", () => {
    // 20 L constante del parto al día 30; recta de 20 a 30 entre los días 30 y 60.
    const p = produccionLactancia(
      { inicio: parto, fin: null },
      [
        { fecha: dia(30), litros: 20 },
        { fecha: dia(60), litros: 30 },
      ],
      dia(70),
    );
    // 20×30 + (20+30)/2×30 = 600 + 750 = 1350 en 60 días → 22,5 L/día.
    expect(p.diasEnLeche).toBe(70);
    expect(p.diasCubiertos).toBe(60);
    expect(p.total).toBe(1350);
    expect(p.promedioDiario).toBe(22.5);
    expect(p.ajustada305).toBe(6862.5);
    expect(p.proyectada).toBe(true);
    expect(p.pico).toEqual({ litros: 30, diasEnLeche: 60 });
  });

  it("lactancia cerrada de más de 305 días: lo producido hasta el día 305", () => {
    const p = produccionLactancia(
      { inicio: parto, fin: dia(320) },
      [
        { fecha: dia(100), litros: 20 },
        { fecha: dia(300), litros: 10 },
      ],
      dia(400),
    );
    // Total: 20×100 + 15×200 + 10×20 = 2000 + 3000 + 200 = 5200.
    expect(p.total).toBe(5200);
    // Hasta el 305: 2000 + 3000 + 10×5 = 5050.
    expect(p.ajustada305).toBe(5050);
    expect(p.proyectada).toBe(false);
  });

  it("ignora controles fuera de la lactancia", () => {
    const p = produccionLactancia(
      { inicio: parto, fin: dia(100) },
      [
        { fecha: dia(-5), litros: 99 },
        { fecha: dia(50), litros: 10 },
        { fecha: dia(150), litros: 99 },
      ],
      dia(200),
    );
    expect(p.controles).toBe(1);
    expect(p.total).toBe(1000);
  });
});
