import { describe, expect, it } from "vitest";
import { campoUnico } from "@/lib/traducir-error";

describe("campoUnico", () => {
  it("extrae el campo del índice único del adaptador", () => {
    expect(
      campoUnico({
        driverAdapterError: { cause: { constraint: { index: "Potrero_nombre_key" } } },
      }),
    ).toBe("nombre");
    expect(campoUnico({ target: ["numero"] })).toBe("numero");
    expect(
      campoUnico({
        driverAdapterError: { cause: { constraint: { index: "Presupuesto_anio_mes_key" } } },
      }),
    ).toBeNull();
    expect(campoUnico(undefined)).toBeNull();
  });
});

describe("campoUnico con únicos por finca", () => {
  it("ignora fincaId en el target, los campos y el nombre del índice", () => {
    expect(campoUnico({ target: ["fincaId", "numero"] })).toBe("numero");
    expect(
      campoUnico({
        driverAdapterError: { cause: { constraint: { fields: ['"fincaId"', '"nombre"'] } } },
      }),
    ).toBe("nombre");
    expect(
      campoUnico({
        driverAdapterError: { cause: { constraint: { index: "Animal_fincaId_numero_key" } } },
      }),
    ).toBe("numero");
  });
});
