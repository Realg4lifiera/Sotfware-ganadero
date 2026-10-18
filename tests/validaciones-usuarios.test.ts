import { describe, expect, it } from "vitest";
import { crearUsuarioSchema, editarUsuarioSchema } from "@/lib/validaciones/usuarios";

const base = { nombre: "Ana Pérez", email: "", rol: "MAYORDOMO" as const };

describe("usuarios: acceso por finca", () => {
  it("exige al menos una finca a quien no es administrador", () => {
    const r = editarUsuarioSchema.safeParse({ ...base, fincaIds: [] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]).toMatchObject({
      path: ["fincaIds"],
      message: "Elige al menos una finca.",
    });
  });

  it("el administrador no necesita fincas (entra a todas)", () => {
    expect(editarUsuarioSchema.safeParse({ ...base, rol: "ADMIN" }).success).toBe(true);
  });

  it("acepta varias fincas al crear", () => {
    const r = crearUsuarioSchema.parse({
      ...base,
      rol: "PROPIETARIO",
      usuario: "Ana.P",
      clave: "segura123",
      fincaIds: [1, 2],
    });
    expect(r).toMatchObject({ usuario: "ana.p", fincaIds: [1, 2], email: null });
  });
});
