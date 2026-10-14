import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { AlmacenamientoLocal } from "@/lib/almacenamiento/local";
import { claveValida } from "@/lib/almacenamiento/tipos";

describe("almacenamiento", () => {
  it("valida claves seguras", () => {
    expect(claveValida("animales/abc123/foto-1.jpg")).toBe(true);
    expect(claveValida("../etc/passwd")).toBe(false);
    expect(claveValida("/abs/ruta.jpg")).toBe(false);
    expect(claveValida("animales/a/../../x.jpg")).toBe(false);
    expect(claveValida("animales/sin-extension")).toBe(false);
  });

  let dir = "";
  afterAll(() => rm(dir, { recursive: true, force: true }));

  it("guarda, lee y elimina en disco", async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "almac-"));
    const a = new AlmacenamientoLocal(dir);
    await a.guardar("animales/x1/foto.png", new Uint8Array([1, 2, 3]), "image/png");
    const leido = await a.obtener("animales/x1/foto.png");
    expect(leido?.tipoMime).toBe("image/png");
    expect([...(leido!.cuerpo as Uint8Array)]).toEqual([1, 2, 3]);
    await a.eliminar("animales/x1/foto.png");
    expect(await a.obtener("animales/x1/foto.png")).toBeNull();
    await expect(a.guardar("../fuera.png", new Uint8Array(), "image/png")).rejects.toThrow();
  });
});
