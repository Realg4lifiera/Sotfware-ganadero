import "server-only";
import type { Tx } from "@/lib/auditoria";
import { ErrorNegocio } from "@/lib/errores";
import { esquemaActivo } from "@/lib/validaciones/activos";

export async function guardarActivo(tx: Tx, id: string | null, valores: unknown): Promise<string> {
  const d = esquemaActivo.parse(valores) as Record<string, unknown>;
  if (
    !(await tx.centroCosto.findFirst({ where: { id: String(d.centroCostoId), deletedAt: null } }))
  )
    throw new ErrorNegocio("Revisa los datos.", { centroCostoId: "El centro de costo no existe." });
  const data = {
    nombre: String(d.nombre),
    descripcion: (d.descripcion as string | null) ?? null,
    fechaCompra: d.fechaCompra as Date,
    valorCompra: String(d.valorCompra),
    vidaUtilMeses: Number(d.vidaUtilMeses),
    valorResidual: String(d.valorResidual ?? "0"),
    centroCostoId: String(d.centroCostoId),
    activo: d.activo === true,
  };
  if (id) {
    if (!(await tx.activo.findFirst({ where: { id, deletedAt: null } })))
      throw new ErrorNegocio("El activo no existe o fue eliminado.");
    await tx.activo.update({ where: { id }, data });
    return id;
  }
  return (await tx.activo.create({ data })).id;
}

export async function eliminarActivo(tx: Tx, id: string): Promise<void> {
  if (!(await tx.activo.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("El activo no existe o ya fue eliminado.");
  await tx.activo.update({ where: { id }, data: { deletedAt: new Date(), activo: false } });
}
