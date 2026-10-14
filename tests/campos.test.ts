import { describe, expect, it } from "vitest";
import { esquemaDesdeCampos, valoresDesdeRegistro, type DefCampo } from "@/lib/formularios/campos";

const campos: DefCampo[] = [
  { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
  { nombre: "area", etiqueta: "Área", tipo: "decimal", min: 0 },
  { nombre: "orden", etiqueta: "Orden", tipo: "entero" },
  {
    nombre: "tipo",
    etiqueta: "Tipo",
    tipo: "opcion",
    requerido: true,
    opciones: [{ valor: "A", etiqueta: "A" }],
  },
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha" },
  { nombre: "activo", etiqueta: "Activo", tipo: "booleano" },
  { nombre: "correo", etiqueta: "Correo", tipo: "email" },
];
const esquema = esquemaDesdeCampos(campos);

describe("esquemaDesdeCampos", () => {
  it("normaliza valores válidos", () => {
    const r = esquema.parse({
      nombre: "  P1 El Alto ",
      area: "8,5",
      orden: "3",
      tipo: "A",
      fecha: "2025-02-14",
      activo: true,
      correo: "",
    });
    expect(r).toEqual({
      nombre: "P1 El Alto",
      area: "8.5",
      orden: 3,
      tipo: "A",
      fecha: new Date("2025-02-14T00:00:00Z"),
      activo: true,
      correo: null,
    });
  });

  it("devuelve mensajes en español", () => {
    const r = esquema.safeParse({
      nombre: "",
      area: "-1",
      orden: "1,5",
      tipo: "Z",
      fecha: "2025-02-30",
      correo: "x",
    });
    expect(r.success).toBe(false);
    const msj = Object.fromEntries(r.error!.issues.map((i) => [i.path[0], i.message]));
    expect(msj).toMatchObject({
      nombre: "Este dato es obligatorio.",
      area: "Debe ser mayor o igual a 0.",
      orden: "Debe ser un número entero.",
      tipo: "Opción no válida.",
      fecha: "Fecha no válida.",
      correo: "Correo electrónico no válido.",
    });
  });

  it("convierte registros de la BD en valores de formulario", () => {
    expect(
      valoresDesdeRegistro(campos, {
        nombre: "X",
        area: { toString: () => "8.5" },
        orden: null,
        fecha: new Date("2025-02-14T00:00:00Z"),
        activo: 1,
      }),
    ).toMatchObject({ nombre: "X", area: "8.5", orden: "", fecha: "2025-02-14", activo: true });
  });
});
