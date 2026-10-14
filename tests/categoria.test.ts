import { describe, expect, it } from "vitest";
import {
  calcularCategoria,
  composicionHato,
  configuracionHatoSchema,
  leerConfiguracion,
  type DatosCategoria,
} from "@/lib/dominio/categoria";
import { fechaDesdeISO } from "@/lib/fechas";

const ref = fechaDesdeISO("2025-06-30");
const base: DatosCategoria = {
  especie: "BOVINO",
  sexo: "HEMBRA",
  fechaNacimiento: null,
  numeroPartos: 0,
  lactanciaAbierta: false,
  esToro: false,
};
const nacida = (iso: string) => ({ ...base, fechaNacimiento: fechaDesdeISO(iso) });

describe("calcularCategoria", () => {
  it("clasifica hembras por edad, partos y lactancia", () => {
    expect(calcularCategoria(nacida("2025-01-15"), ref)).toBe("TERNERA_LACTANTE"); // 5 meses
    expect(calcularCategoria(nacida("2024-10-30"), ref)).toBe("TERNERA"); // 8 meses
    expect(calcularCategoria(nacida("2024-06-30"), ref)).toBe("NOVILLA"); // 12 meses
    expect(calcularCategoria({ ...nacida("2021-01-01"), numeroPartos: 2 }, ref)).toBe("VACA_SECA");
    expect(
      calcularCategoria({ ...nacida("2021-01-01"), numeroPartos: 2, lactanciaAbierta: true }, ref),
    ).toBe("VACA_PRODUCCION");
  });

  it("una hembra sin fecha de nacimiento ni partos es novilla", () => {
    expect(calcularCategoria(base, ref)).toBe("NOVILLA");
  });

  it("clasifica machos y otras especies", () => {
    expect(calcularCategoria({ ...nacida("2025-05-01"), sexo: "MACHO" }, ref)).toBe(
      "MACHO_LEVANTE_CEBA",
    );
    expect(calcularCategoria({ ...base, sexo: "MACHO", esToro: true }, ref)).toBe("TORO");
    expect(calcularCategoria({ ...base, especie: "EQUINO" }, ref)).toBe("OTRA_ESPECIE");
  });

  it("respeta edades configurables", () => {
    const config = configuracionHatoSchema.parse({ edadDesteteMeses: 6, edadNovillaMeses: 18 });
    expect(calcularCategoria(nacida("2024-10-30"), ref, config)).toBe("TERNERA");
    expect(calcularCategoria(nacida("2024-06-30"), ref, config)).toBe("TERNERA");
    expect(calcularCategoria(nacida("2023-12-30"), ref, config)).toBe("NOVILLA");
  });
});

describe("configuración", () => {
  it("completa valores por defecto y tolera JSON inválido", () => {
    expect(leerConfiguracion({}).hato.edadDesteteMeses).toBe(8);
    expect(leerConfiguracion({ hato: { edadNovillaMeses: 15 } }).hato.edadNovillaMeses).toBe(15);
    expect(leerConfiguracion({ hato: { edadNovillaMeses: "x" } }).hato.edadNovillaMeses).toBe(12);
    expect(leerConfiguracion(null).hato.porcentajeIdeal.VACA_PRODUCCION).toBe(50);
  });
});

describe("composicionHato", () => {
  it("calcula % real vs ideal por grupo", () => {
    const r = composicionHato([
      "VACA_PRODUCCION",
      "VACA_PRODUCCION",
      "VACA_PRODUCCION",
      "VACA_SECA",
      "TORO",
      "OTRA_ESPECIE",
    ]);
    expect(r.totalHato).toBe(4);
    expect(r.totalOtras).toBe(2);
    expect(r.hato[0]).toMatchObject({ cantidad: 3, porcentajeReal: 0.75, porcentajeIdeal: 0.5 });
    expect(r.otras.find((f) => f.categoria === "TORO")?.porcentajeReal).toBe(0.5);
  });
});
