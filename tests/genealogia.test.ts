import { describe, expect, it } from "vitest";
import { alertasConsanguinidad } from "@/lib/dominio/genealogia";

const hembra = { id: "h1", madreId: "m1", padreToroId: "t1", abueloMaternoToroId: "t2" };
const externo = (id: string) => ({ id, madreId: null, padreToroId: null });

describe("alertasConsanguinidad", () => {
  it("sin parentesco no alerta", () => {
    expect(alertasConsanguinidad(hembra, externo("t9"))).toEqual([]);
  });
  it("padre y abuelo materno", () => {
    expect(alertasConsanguinidad(hembra, externo("t1"))).toEqual([
      "El toro es el padre de la hembra.",
    ]);
    expect(alertasConsanguinidad(hembra, externo("t2"))).toEqual([
      "El toro es el abuelo materno de la hembra.",
    ]);
  });
  it("toro del hato: hijo y medio hermanos", () => {
    expect(alertasConsanguinidad(hembra, { id: "t5", madreId: "h1", padreToroId: null })).toEqual([
      "El toro es hijo de la hembra.",
    ]);
    expect(alertasConsanguinidad(hembra, { id: "t5", madreId: "m1", padreToroId: "t1" })).toEqual([
      "El toro y la hembra son hijos de la misma vaca.",
      "El toro y la hembra son hijos del mismo toro.",
    ]);
  });
  it("datos desconocidos no generan falsas alertas", () => {
    const sinDatos = { id: "h2", madreId: null, padreToroId: null, abueloMaternoToroId: null };
    expect(alertasConsanguinidad(sinDatos, { id: "t5", madreId: null, padreToroId: null })).toEqual(
      [],
    );
  });
});
