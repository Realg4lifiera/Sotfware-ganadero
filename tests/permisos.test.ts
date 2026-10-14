import { describe, expect, it } from "vitest";
import { MATRIZ_PERMISOS, PERMISOS, puede, puedeAlguno } from "@/lib/permisos";

describe("matriz de permisos", () => {
  it("el ADMIN puede todo", () => {
    for (const p of PERMISOS) expect(puede("ADMIN", p)).toBe(true);
  });

  it("el CONTADOR es solo lectura", () => {
    const escritura = PERMISOS.filter((p) =>
      /:(crear|editar|eliminar|importar|registrar|gestionar|trasladar|movimiento)$/.test(p),
    );
    for (const p of escritura) expect(puede("CONTADOR", p), p).toBe(false);
    expect(puede("CONTADOR", "costos:leer")).toBe(true);
    expect(puede("CONTADOR", "reportes:costos")).toBe(true);
    expect(puede("CONTADOR", "animal:leer")).toBe(true);
    expect(puede("CONTADOR", "animal:exportar")).toBe(true);
    expect(puede("CONTADOR", "reproduccion:leer")).toBe(false);
  });

  it("el MAYORDOMO registra eventos de campo pero no administra", () => {
    for (const p of [
      "reproduccion:registrar",
      "produccion:registrar",
      "leche:registrar",
      "gasto:registrar",
      "animal:trasladar",
      "sanidad:leer",
    ] as const)
      expect(puede("MAYORDOMO", p), p).toBe(true);
    for (const p of [
      "animal:crear",
      "animal:movimiento",
      "sanidad:registrar",
      "costos:leer",
      "configuracion:gestionar",
      "usuario:gestionar",
      "reportes:costos",
    ] as const)
      expect(puede("MAYORDOMO", p), p).toBe(false);
  });

  it("el VETERINARIO maneja reproducción y sanidad", () => {
    expect(puede("VETERINARIO", "reproduccion:gestionar")).toBe(true);
    expect(puede("VETERINARIO", "sanidad:registrar")).toBe(true);
    expect(puede("VETERINARIO", "costos:leer-sanidad")).toBe(true);
    expect(puede("VETERINARIO", "reportes:reproductivos")).toBe(true);
    expect(puede("VETERINARIO", "costos:leer")).toBe(false);
    expect(puede("VETERINARIO", "produccion:registrar")).toBe(false);
    expect(puede("VETERINARIO", "animal:trasladar")).toBe(false);
  });

  it("sin rol no hay permisos", () => {
    expect(puede(null, "tablero:ver")).toBe(false);
    expect(puedeAlguno(undefined, ["tablero:ver"])).toBe(false);
    expect(puedeAlguno("CONTADOR", ["sanidad:leer", "costos:leer"])).toBe(true);
  });

  it("todos los permisos tienen al menos al ADMIN", () => {
    for (const roles of Object.values(MATRIZ_PERMISOS)) expect(roles).toContain("ADMIN");
  });
});
