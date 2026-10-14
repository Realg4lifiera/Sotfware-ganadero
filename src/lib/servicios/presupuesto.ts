import "server-only";
import { z } from "zod";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { ErrorNegocio } from "@/lib/errores";
import { rangoMes } from "@/lib/fechas";
import { parsearNumeroCO } from "@/lib/formato";

const esquemaGuardar = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  valores: z.record(z.string(), z.string()),
});

const partes = (mes: string) => {
  const { desde } = rangoMes(mes);
  return { anio: desde.getUTCFullYear(), mes: desde.getUTCMonth() + 1 };
};

/** Presupuesto del mes (finca completa) por categoría. */
export async function presupuestoDelMes(mes: string): Promise<Map<string, number>> {
  const filas = await prismaBase.presupuesto.findMany({
    where: { ...partes(mes), centroCostoId: null, deletedAt: null },
    select: { categoriaGastoId: true, valor: true },
  });
  return new Map(filas.map((f) => [f.categoriaGastoId, Number(f.valor)]));
}

/** Fija el valor de una categoría en el mes (0 o vacío lo quita). */
async function fijar(tx: Tx, anio: number, mes: number, categoriaGastoId: string, valor: number) {
  // centroCostoId es nulo: la restricción única no aplica, se busca a mano.
  const existentes = await tx.presupuesto.findMany({
    where: { anio, mes, categoriaGastoId, centroCostoId: null },
    orderBy: { createdAt: "asc" },
  });
  const vigente = existentes.find((e) => e.deletedAt === null) ?? existentes[0];
  if (valor <= 0) {
    if (vigente && vigente.deletedAt === null)
      await tx.presupuesto.update({ where: { id: vigente.id }, data: { deletedAt: new Date() } });
    return;
  }
  if (vigente) {
    if (vigente.deletedAt === null && Number(vigente.valor) === valor) return;
    await tx.presupuesto.update({
      where: { id: vigente.id },
      data: { valor: valor.toFixed(2), deletedAt: null },
    });
  } else {
    await tx.presupuesto.create({
      data: { anio, mes, categoriaGastoId, centroCostoId: null, valor: valor.toFixed(2) },
    });
  }
}

export async function guardarPresupuesto(tx: Tx, entrada: unknown): Promise<void> {
  const d = esquemaGuardar.parse(entrada);
  const { anio, mes } = partes(d.mes);
  const categorias = new Set(
    (await tx.categoriaGasto.findMany({ where: { deletedAt: null }, select: { id: true } })).map(
      (c) => c.id,
    ),
  );
  const errores: Record<string, string> = {};
  const valores: [string, number][] = [];
  for (const [id, texto] of Object.entries(d.valores)) {
    if (!categorias.has(id)) throw new ErrorNegocio("Una de las categorías ya no existe.");
    const n = texto.trim() === "" ? 0 : parsearNumeroCO(texto);
    if (n === null || n < 0 || n >= 1e14) errores[id] = "Valor no válido.";
    else valores.push([id, Math.round(n * 100) / 100]);
  }
  if (Object.keys(errores).length) throw new ErrorNegocio("Revisa los valores marcados.", errores);
  for (const [id, valor] of valores) await fijar(tx, anio, mes, id, valor);
}

/** Copia al mes el presupuesto del mes anterior (reemplaza lo que haya). */
export async function copiarMesAnterior(tx: Tx, mesDestino: unknown): Promise<number> {
  const mes = z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .parse(mesDestino);
  const destino = partes(mes);
  const { desde } = rangoMes(mes);
  const anterior = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() - 1, 1));
  const origen = await tx.presupuesto.findMany({
    where: {
      anio: anterior.getUTCFullYear(),
      mes: anterior.getUTCMonth() + 1,
      centroCostoId: null,
      deletedAt: null,
      categoriaGasto: { deletedAt: null },
    },
  });
  if (origen.length === 0) throw new ErrorNegocio("El mes anterior no tiene presupuesto.");
  const actuales = await tx.presupuesto.findMany({
    where: { ...destino, centroCostoId: null, deletedAt: null },
    select: { categoriaGastoId: true },
  });
  const nuevos = new Map(origen.map((o) => [o.categoriaGastoId, Number(o.valor)]));
  for (const a of actuales) if (!nuevos.has(a.categoriaGastoId)) nuevos.set(a.categoriaGastoId, 0);
  for (const [id, valor] of nuevos) await fijar(tx, destino.anio, destino.mes, id, valor);
  return origen.length;
}
