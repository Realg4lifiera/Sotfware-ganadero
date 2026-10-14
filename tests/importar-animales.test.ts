import { describe, expect, it } from "vitest";
import {
  fechaCeldaISO,
  normalizar,
  ordenarParaInsertar,
  siNo,
  validarFilas,
  type CatalogosImportacion,
  type FilaCruda,
} from "@/lib/excel/validar-animales";

const cat: CatalogosImportacion = {
  razas: new Map([
    ["holstein", "raza-ho"],
    ["normando", "raza-no"],
  ]),
  lotes: new Map([[normalizar("Lote 1 · Producción"), "lote-1"]]),
  potreros: new Map([["p1 el alto", "pot-1"]]),
  toros: new Map<string, string | null>([
    ["ebano", "toro-1"],
    ["ho-1187", "toro-1"],
    ["galan", null],
  ]),
  animales: new Map([
    [
      "101",
      {
        id: "a-101",
        sexo: "HEMBRA",
        especie: "BOVINO",
        fechaNacimiento: new Date("2016-01-01T00:00:00Z"),
      },
    ],
    ["401", { id: "a-401", sexo: "MACHO", especie: "BOVINO", fechaNacimiento: null }],
  ]),
};

let n = 2;
const fila = (celdas: FilaCruda["celdas"]): FilaCruda => ({ fila: n++, celdas });
const base = {
  sexo: "Hembra",
  origen: "Comprado",
  fechaIngreso: new Date("2024-05-02T00:00:00Z"),
  fechaNacimiento: "10/03/2021",
};

describe("utilidades de celdas", () => {
  it("lee fechas de Excel, texto colombiano e ISO", () => {
    expect(fechaCeldaISO(new Date("2021-03-10T00:00:00Z"))).toBe("2021-03-10");
    expect(fechaCeldaISO("10/03/2021")).toBe("2021-03-10");
    expect(fechaCeldaISO("1/2/24")).toBe("2024-02-01");
    expect(fechaCeldaISO("2021-03-10")).toBe("2021-03-10");
    expect(fechaCeldaISO(44265)).toBe("2021-03-10"); // número de serie de Excel
    expect(fechaCeldaISO("31/02/2021")).toBeNull();
    expect(fechaCeldaISO("")).toBeUndefined();
  });

  it("entiende Sí/No y normaliza texto", () => {
    expect(siNo("Sí")).toBe(true);
    expect(siNo("si")).toBe(true);
    expect(siNo("")).toBe(false);
    expect(siNo("tal vez")).toBeNull();
    expect(normalizar("  Lote 1 ·  Producción ")).toBe(normalizar("lote 1 produccion"));
  });
});

describe("validarFilas", () => {
  it("acepta una vaca comprada y resuelve catálogos por nombre", () => {
    const r = validarFilas(
      [
        fila({
          ...base,
          numero: "601",
          raza: "HOLSTEIN",
          lote: "Lote 1 · Produccion",
          potrero: "P1 El Alto",
          padre: "HO-1187",
          madre: "101",
          estadoReproductivo: "Preñada",
          numeroPartos: 2,
          enProduccion: "Sí",
          valorCompra: "4.500.000",
        }),
      ],
      cat,
    );
    expect(r.conError).toBe(0);
    expect(r.filas[0].animal).toMatchObject({
      numero: "601",
      sexo: "HEMBRA",
      especie: "BOVINO",
      razaId: "raza-ho",
      loteId: "lote-1",
      potreroId: "pot-1",
      padreId: "toro-1",
      madreId: "a-101",
      estadoReproductivo: "PRENADA",
      numeroPartos: 2,
      enProduccion: true,
      valorCompra: "4500000",
      fechaIngreso: new Date("2024-05-02T00:00:00Z"),
    });
  });

  it("una hembra sin estado ni partos queda como novilla; nacido usa la fecha de nacimiento", () => {
    const r = validarFilas(
      [fila({ numero: "602", sexo: "hembra", origen: "nacido", fechaNacimiento: "01/06/2025" })],
      cat,
    );
    expect(r.filas[0].errores).toEqual([]);
    expect(r.filas[0].animal).toMatchObject({
      estadoReproductivo: "NOVILLA",
      fechaIngreso: new Date("2025-06-01T00:00:00Z"),
    });
  });

  it("reporta errores claros en español por columna", () => {
    const r = validarFilas(
      [
        fila({
          numero: "101",
          sexo: "Vaca",
          origen: "Comprado",
          fechaIngreso: "31/02/2024",
          raza: "Cebú azul",
          padre: "Galán",
          madre: "401",
        }),
        fila({
          numero: "",
          sexo: "Macho",
          origen: "Comprado",
          fechaIngreso: "2024-01-01",
          estadoReproductivo: "Preñada",
        }),
      ],
      cat,
    );
    expect(r.validas).toBe(0);
    expect(r.filas[0].errores).toEqual(
      expect.arrayContaining([
        "Número / chapeta: ya existe un animal con el número 101.",
        "Sexo: «Vaca» no es válido (Hembra o Macho).",
        "Fecha de ingreso: fecha no válida (usa dd/mm/aaaa).",
        "Raza: «Cebú azul» no existe en Razas.",
        "Padre (toro): hay varios toros llamados «Galán»; usa el código.",
        "Número de la madre: el animal 401 no es hembra.",
      ]),
    );
    expect(r.filas[1].errores).toEqual(
      expect.arrayContaining([
        "Número / chapeta: Este dato es obligatorio.",
        "Estado reproductivo: Solo aplica a hembras bovinas.",
      ]),
    );
  });

  it("valida madres dentro del archivo y ordena la inserción", () => {
    const r = validarFilas(
      [
        fila({
          ...base,
          numero: "702",
          madre: "701",
          origen: "Nacido",
          fechaNacimiento: "01/01/2025",
          fechaIngreso: "",
        }),
        fila({ ...base, numero: "701", estadoReproductivo: "Vacía", numeroPartos: 1 }),
        fila({ ...base, numero: "703", madre: "799" }),
        fila({
          ...base,
          numero: "704",
          madre: "705",
          origen: "Nacido",
          fechaNacimiento: "01/01/2025",
          fechaIngreso: "",
        }),
        fila({ numero: "705", sexo: "Macho", origen: "Comprado", fechaIngreso: "2024-01-01" }),
      ],
      cat,
    );
    const porNumero = Object.fromEntries(r.filas.map((f) => [f.numero, f]));
    expect(porNumero["702"].errores).toEqual([]);
    expect(porNumero["703"].errores).toEqual([
      "Número de la madre: 799 no existe en la finca ni en este archivo.",
    ]);
    expect(porNumero["704"].errores[0]).toMatch(/no es una hembra bovina/);
    expect(
      ordenarParaInsertar(r.filas.filter((f) => f.animal))
        .map((f) => f.numero)
        .slice(0, 2),
    ).toEqual(["701", "702"]);
  });

  it("detecta números repetidos en el archivo", () => {
    const r = validarFilas(
      [fila({ ...base, numero: "801" }), fila({ ...base, numero: "801" })],
      cat,
    );
    expect(r.filas[0].errores).toEqual([]);
    expect(r.filas[1].errores[0]).toMatch(/repetido \(también en la fila/);
  });
});
