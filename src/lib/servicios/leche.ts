import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { ErrorNegocio } from "@/lib/errores";
import type { Opcion } from "@/lib/formularios/campos";
import { esquemaConsumo, esquemaConsumoLote, esquemaEntrega } from "@/lib/validaciones/leche";
import type { DestinoConsumoLeche } from "@/generated/prisma/enums";

export const DESTINOS: DestinoConsumoLeche[] = ["TRABAJADORES", "TERNERAS", "RETIRO", "ARRIENDO"];

export async function guardarEntrega(tx: Tx, id: string | null, valores: unknown): Promise<string> {
  const d = esquemaEntrega.parse(valores) as Record<string, unknown>;
  if (!(await tx.comprador.findFirst({ where: { id: String(d.compradorId), deletedAt: null } })))
    throw new ErrorNegocio("Revisa los datos.", { compradorId: "El comprador no existe." });
  const data = {
    fecha: d.fecha as Date,
    compradorId: String(d.compradorId),
    litros: String(d.litros),
    precioLitro: (d.precioLitro as string | null) ?? null,
    nota: (d.nota as string | null) ?? null,
  };
  if (id) {
    if (!(await tx.entregaLeche.findFirst({ where: { id, deletedAt: null } })))
      throw new ErrorNegocio("La entrega no existe o fue eliminada.");
    await tx.entregaLeche.update({ where: { id }, data });
    return id;
  }
  return (await tx.entregaLeche.create({ data })).id;
}

export async function eliminarEntrega(tx: Tx, id: string) {
  if (!(await tx.entregaLeche.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("La entrega no existe o ya fue eliminada.");
  await tx.entregaLeche.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Registra varios destinos de una vez (un registro por destino con litros > 0). */
export async function registrarConsumos(tx: Tx, valores: unknown): Promise<number> {
  const d = esquemaConsumoLote.parse(valores) as Record<string, unknown>;
  let creados = 0;
  for (const destino of DESTINOS) {
    const litros = Number(d[destino] ?? 0);
    if (!(litros > 0)) continue;
    await tx.consumoInternoLeche.create({
      data: {
        fecha: d.fecha as Date,
        destino,
        litros: String(litros),
        valor:
          destino === "ARRIENDO" && Number(d.valorArriendo) > 0 ? String(d.valorArriendo) : null,
        nota: (d.nota as string | null) ?? null,
      },
    });
    creados++;
  }
  return creados;
}

export async function editarConsumo(tx: Tx, id: string, valores: unknown) {
  const d = esquemaConsumo.parse(valores) as Record<string, unknown>;
  if (!(await tx.consumoInternoLeche.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("El registro no existe o fue eliminado.");
  await tx.consumoInternoLeche.update({
    where: { id },
    data: {
      fecha: d.fecha as Date,
      destino: d.destino as DestinoConsumoLeche,
      litros: String(d.litros),
      valor: (d.valor as string | null) ?? null,
      nota: (d.nota as string | null) ?? null,
    },
  });
}

export async function eliminarConsumo(tx: Tx, id: string) {
  if (!(await tx.consumoInternoLeche.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("El registro no existe o ya fue eliminado.");
  await tx.consumoInternoLeche.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function opcionesCompradores(): Promise<Record<string, Opcion[]>> {
  const c = await prismaBase.comprador.findMany({
    where: { deletedAt: null, activo: true },
    orderBy: { nombre: "asc" },
  });
  return { compradores: c.map((x) => ({ valor: x.id, etiqueta: x.nombre })) };
}

/** Litros del mes: vendidos (entregas), consumo interno por destino y producidos. */
export async function litrosDelPeriodo(desde: Date, hasta: Date) {
  const [entregas, consumos] = await Promise.all([
    prismaBase.entregaLeche.aggregate({
      where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
      _sum: { litros: true },
    }),
    prismaBase.consumoInternoLeche.groupBy({
      by: ["destino"],
      where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
      _sum: { litros: true, valor: true },
    }),
  ]);
  const vendidos = Number(entregas._sum.litros ?? 0);
  const porDestino = Object.fromEntries(DESTINOS.map((d) => [d, 0])) as Record<
    DestinoConsumoLeche,
    number
  >;
  let valorArriendo = 0;
  for (const c of consumos) {
    porDestino[c.destino] = Number(c._sum.litros ?? 0);
    if (c.destino === "ARRIENDO") valorArriendo = Number(c._sum.valor ?? 0);
  }
  const consumo = Object.values(porDestino).reduce((s, x) => s + x, 0);
  // Como en Colanta: producidos = vendidos + autoconsumo.
  return { vendidos, consumo, porDestino, valorArriendo, producidos: vendidos + consumo };
}
