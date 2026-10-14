/**
 * Prueba de integración de la extensión de auditoría contra PostgreSQL.
 * Requiere la BD local migrada: `PRUEBAS_BD=1 npm test`.
 * Todo corre dentro de una transacción que se revierte al final.
 */
import { describe, expect, it } from "vitest";
import { contextoAuditoria, db } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";

const habilitada = process.env.PRUEBAS_BD === "1";

class Revertir extends Error {}

describe.skipIf(!habilitada)("extensión de auditoría (BD)", () => {
  it("audita crear, editar y eliminar dentro de la transacción", async () => {
    const usuario = await prismaBase.usuario.findFirstOrThrow({ where: { rol: "ADMIN" } });
    const nombre = `Raza prueba ${Date.now()}`;
    let comprobado = false;

    await expect(
      contextoAuditoria.run({ usuarioId: usuario.id, usuarioNombre: usuario.nombre }, () =>
        db.$transaction(async (tx) => {
          contextoAuditoria.getStore()!.tx = tx;

          const raza = await tx.raza.create({ data: { nombre } });
          expect(raza.createdById).toBe(usuario.id);

          await tx.raza.update({ where: { id: raza.id }, data: { nombre: `${nombre} (editada)` } });
          await tx.raza.update({ where: { id: raza.id }, data: { activo: true } }); // sin cambios
          await tx.raza.update({ where: { id: raza.id }, data: { deletedAt: new Date() } });

          const registros = await tx.auditoria.findMany({
            where: { entidad: "Raza", entidadId: raza.id },
            orderBy: { fecha: "asc" },
          });
          expect(registros.map((r) => r.accion)).toEqual(["CREAR", "EDITAR", "ELIMINAR"]);
          expect(registros[1].antes).toEqual({ nombre });
          expect(registros[1].despues).toEqual({ nombre: `${nombre} (editada)` });
          expect(registros.every((r) => r.usuarioId === usuario.id)).toBe(true);

          await expect(tx.raza.delete({ where: { id: raza.id } })).rejects.toThrow(
            /no está permitido/,
          );
          await expect(tx.raza.updateMany({ data: { activo: false } })).rejects.toThrow(
            /no está permitido/,
          );
          comprobado = true;
          throw new Revertir();
        }),
      ),
    ).rejects.toBeInstanceOf(Revertir);

    expect(comprobado).toBe(true);
    expect(await prismaBase.raza.count({ where: { nombre: { startsWith: nombre } } })).toBe(0);
  });

  it("rechaza escrituras fuera de accion()", async () => {
    await expect(
      db.raza.create({ data: { nombre: `Sin contexto ${Date.now()}` } }),
    ).rejects.toThrow(/fuera de accion/);
  });

  it("la tabla de auditoría es inmutable", async () => {
    let error: unknown;
    await prismaBase
      .$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `INSERT INTO "Auditoria" (id, entidad, "entidadId", accion) VALUES ('prueba-inmutable', 'Prueba', 'x', 'CREAR')`,
        );
        try {
          await tx.$executeRawUnsafe(
            `UPDATE "Auditoria" SET entidad = 'y' WHERE id = 'prueba-inmutable'`,
          );
        } catch (e) {
          error = e;
        }
        throw new Revertir();
      })
      .catch((e) => {
        if (!(e instanceof Revertir)) throw e;
      });
    expect(String(error)).toMatch(/no se puede modificar/);
  });
});
