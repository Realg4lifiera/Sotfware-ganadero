import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { ErrorNegocio } from "@/lib/errores";
import type { Opcion } from "@/lib/formularios/campos";
import { esquemaIngreso, totalIngreso } from "@/lib/validaciones/ingresos";

/** Los ingresos de venta de animales vienen del movimiento: se corrigen desde el animal. */
async function exigirEditable(tx: Tx, id: string) {
  const i = await tx.ingreso.findFirst({ where: { id, deletedAt: null } });
  if (!i) throw new ErrorNegocio("El ingreso no existe o fue eliminado.");
  if (i.movimientoAnimalId)
    throw new ErrorNegocio(
      "Este ingreso viene de la venta de un animal: se maneja desde su hoja de vida.",
    );
  return i;
}

export async function guardarIngreso(tx: Tx, id: string | null, valores: unknown): Promise<string> {
  const d = esquemaIngreso.parse(valores) as Record<string, unknown>;
  if (
    d.compradorId &&
    !(await tx.comprador.findFirst({ where: { id: String(d.compradorId), deletedAt: null } }))
  )
    throw new ErrorNegocio("Revisa los datos.", { compradorId: "El comprador no existe." });
  if (
    d.centroCostoId &&
    !(await tx.centroCosto.findFirst({ where: { id: String(d.centroCostoId), deletedAt: null } }))
  )
    throw new ErrorNegocio("Revisa los datos.", { centroCostoId: "El centro de costo no existe." });
  const data = {
    tipo: d.tipo as "VENTA_LECHE" | "OTRO",
    concepto: String(d.concepto),
    fecha: d.fecha as Date,
    compradorId: (d.compradorId as string | null) ?? null,
    cantidad: String(d.cantidad),
    precioUnitario: String(d.precioUnitario),
    total: String(totalIngreso(Number(d.cantidad), Number(d.precioUnitario))),
    centroCostoId: (d.centroCostoId as string | null) ?? null,
    nota: (d.nota as string | null) ?? null,
  };
  if (id) {
    await exigirEditable(tx, id);
    await tx.ingreso.update({ where: { id }, data });
    return id;
  }
  return (await tx.ingreso.create({ data })).id;
}

export async function eliminarIngreso(tx: Tx, id: string): Promise<void> {
  await exigirEditable(tx, id);
  await tx.ingreso.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function opcionesIngreso(): Promise<Record<string, Opcion[]>> {
  const activo = { deletedAt: null, activo: true } as const;
  const [compradores, centros] = await Promise.all([
    prismaBase.comprador.findMany({ where: activo, orderBy: { nombre: "asc" } }),
    prismaBase.centroCosto.findMany({ where: activo, orderBy: { nombre: "asc" } }),
  ]);
  return {
    compradores: compradores.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
    centros: centros.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
  };
}
