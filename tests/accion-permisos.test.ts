/**
 * La validación de permisos ocurre en el servidor (accion), no solo ocultando botones:
 * aunque alguien invoque la server action directamente, se rechaza sin ejecutar nada.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioActual } from "@/lib/sesion";

let usuarioActual: UsuarioActual | null = null;
vi.mock("@/lib/sesion", () => ({ obtenerUsuarioActual: async () => usuarioActual }));
vi.mock("@/lib/auditoria", () => ({
  contextoAuditoria: { run: (_c: unknown, fn: () => unknown) => fn(), getStore: () => ({}) },
  db: { $transaction: (fn: (tx: unknown) => unknown) => fn({}) },
}));

const { accion } = await import("@/lib/accion");

const usuario = (rol: UsuarioActual["rol"]): UsuarioActual => ({
  id: "u1",
  nombre: "Prueba",
  usuario: "prueba",
  rol,
  debeCambiarClave: false,
});

describe("accion(): permisos en el servidor", () => {
  const fn = vi.fn(async () => "hecho");
  beforeEach(() => fn.mockClear());

  it("rechaza sin sesión", async () => {
    usuarioActual = null;
    expect(await accion("animal:crear", fn)).toEqual({
      ok: false,
      error: "Tu sesión expiró. Inicia sesión de nuevo.",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it.each([
    ["MAYORDOMO", "animal:crear"],
    ["CONTADOR", "gasto:registrar"],
    ["VETERINARIO", "animal:trasladar"],
    ["MAYORDOMO", "usuario:gestionar"],
  ] as const)("%s no puede %s", async (rol, permiso) => {
    usuarioActual = usuario(rol);
    expect(await accion(permiso, fn)).toEqual({
      ok: false,
      error: "No tienes permiso para realizar esta acción.",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it("ejecuta cuando el rol tiene el permiso (o uno de varios)", async () => {
    usuarioActual = usuario("MAYORDOMO");
    expect(await accion("animal:trasladar", fn)).toEqual({ ok: true, datos: "hecho" });
    usuarioActual = usuario("VETERINARIO");
    expect(await accion(["configuracion:gestionar", "reproduccion:gestionar"], fn)).toMatchObject({
      ok: true,
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
