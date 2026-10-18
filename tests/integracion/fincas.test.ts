/**
 * Aislamiento entre fincas (lib/finca.ts) contra PostgreSQL. Requiere la BD local con el
 * seed (dos fincas): `PRUEBAS_BD=1 npm test`. Las escrituras se revierten al final.
 */
import { describe, expect, it } from "vitest";
import { contextoAuditoria, db, type Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { conFinca, contextoFinca, ErrorSinFinca } from "@/lib/finca";

const habilitada = process.env.PRUEBAS_BD === "1";

class Revertir extends Error {}

/** Corre `fn` en una transacción auditada dentro de la finca, y la revierte. */
async function enTransaccion(fincaId: number | null, fn: (tx: Tx) => Promise<void>) {
  const usuario = await prismaBase.usuario.findFirstOrThrow({ where: { rol: "ADMIN" } });
  let corrio = false;
  await contextoFinca
    .run({ fincaId }, () =>
      contextoAuditoria.run({ usuarioId: usuario.id, usuarioNombre: usuario.nombre }, () =>
        db.$transaction(async (tx) => {
          contextoAuditoria.getStore()!.tx = tx;
          await fn(tx);
          corrio = true;
          throw new Revertir();
        }),
      ),
    )
    .catch((e) => {
      if (!(e instanceof Revertir)) throw e;
    });
  expect(corrio).toBe(true);
}

describe.skipIf(!habilitada)("aislamiento entre fincas (BD)", () => {
  it("cada finca solo ve sus animales", async () => {
    const fincas = await prismaBase.finca.findMany({ orderBy: { id: "asc" }, take: 2 });
    expect(fincas).toHaveLength(2);
    const ids = new Set<string>();
    for (const f of fincas) {
      const animales = await conFinca(f.id, () => prismaBase.animal.findMany());
      // Coincide con el conteo directo en SQL de esa finca.
      const [{ n }] = await prismaBase.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM "Animal" WHERE "fincaId" = ${f.id}`;
      expect(animales.length).toBe(Number(n));
      expect(animales.every((a) => a.fincaId === f.id)).toBe(true);
      for (const a of animales) ids.add(a.id);
    }
    expect(ids.size).toBeGreaterThan(0);
  });

  it("sin finca, las consultas a datos de finca fallan", async () => {
    await expect(prismaBase.animal.count()).rejects.toBeInstanceOf(ErrorSinFinca);
    // Los catálogos compartidos sí se leen.
    expect(await prismaBase.raza.count()).toBeGreaterThan(0);
  });

  it("crea en la finca del contexto y no toca registros de otra", async () => {
    const [a, b] = await prismaBase.finca.findMany({ orderBy: { id: "asc" }, take: 2 });
    const deB = await conFinca(b.id, () => prismaBase.lote.findFirstOrThrow());
    await enTransaccion(a.id, async (tx) => {
      // El mismo nombre se permite en otra finca (único por finca).
      const nombre = `Lote prueba ${Date.now()}`;
      await contextoFinca.run({ fincaId: b.id }, async () => {
        await tx.lote.create({ data: { nombre, proposito: deB.proposito } });
      });
      const lote = await tx.lote.create({ data: { nombre, proposito: deB.proposito } });
      expect(lote.fincaId).toBe(a.id);
      expect(await tx.lote.findUnique({ where: { id: deB.id } })).toBeNull();
      await expect(
        tx.lote.update({ where: { id: deB.id }, data: { nombre: "Intruso" } }),
      ).rejects.toThrow();
    });
    const intacto = await conFinca(b.id, () =>
      prismaBase.lote.findUniqueOrThrow({ where: { id: deB.id } }),
    );
    expect(intacto.nombre).toBe(deB.nombre);
  });

  it("la auditoría de acciones globales se ve desde todas las fincas", async () => {
    const [a, b] = await prismaBase.finca.findMany({ orderBy: { id: "asc" }, take: 2 });
    const nombre = `Raza global ${Date.now()}`;
    await enTransaccion(null, async (tx) => {
      const raza = await tx.raza.create({ data: { nombre } });
      // Dentro de la misma transacción, desde cada finca.
      for (const f of [a, b]) {
        // Se espera dentro del contexto (las consultas de Prisma son perezosas).
        const n = await contextoFinca.run(
          { fincaId: f.id },
          async () => await tx.auditoria.count({ where: { entidad: "Raza", entidadId: raza.id } }),
        );
        expect(n).toBe(1);
      }
    });
  });
});
