import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { errorRegla } from "@/lib/dominio/prorrateo";
import { ErrorNegocio } from "@/lib/errores";
import type { Opcion } from "@/lib/formularios/campos";
import { esquemaCostoIndirecto, esquemaRegla } from "@/lib/validaciones/costos-indirectos";

export async function guardarCostoIndirecto(
  tx: Tx,
  id: string | null,
  valores: unknown,
): Promise<string> {
  const d = esquemaCostoIndirecto.parse(valores) as Record<string, unknown>;
  const errores: Record<string, string> = {};
  const cat = await tx.categoriaGasto.findFirst({
    where: { id: String(d.categoriaId), deletedAt: null },
  });
  if (!cat) errores.categoriaId = "El concepto no existe.";
  if (
    d.centroCostoId &&
    !(await tx.centroCosto.findFirst({ where: { id: String(d.centroCostoId), deletedAt: null } }))
  )
    errores.centroCostoId = "El centro de costo no existe.";
  if (
    d.reglaProrrateoId &&
    !(await tx.reglaProrrateo.findFirst({
      where: { id: String(d.reglaProrrateoId), deletedAt: null },
    }))
  )
    errores.reglaProrrateoId = "La regla no existe.";
  if (
    d.proveedorId &&
    !(await tx.proveedor.findFirst({ where: { id: String(d.proveedorId), deletedAt: null } }))
  )
    errores.proveedorId = "El proveedor no existe.";
  if (Object.keys(errores).length) throw new ErrorNegocio("Revisa los datos.", errores);

  const data = {
    categoriaId: String(d.categoriaId),
    fecha: d.fecha as Date,
    periodicidad: d.periodicidad as "MENSUAL",
    valorTotal: String(d.valorTotal),
    litros: (d.litros as string | null) ?? null,
    centroCostoId: (d.centroCostoId as string | null) ?? null,
    reglaProrrateoId: (d.reglaProrrateoId as string | null) ?? null,
    proveedorId: (d.proveedorId as string | null) ?? null,
    nota: (d.nota as string | null) ?? null,
  };
  if (id) {
    if (!(await tx.costoIndirecto.findFirst({ where: { id, deletedAt: null } })))
      throw new ErrorNegocio("El registro no existe o fue eliminado.");
    await tx.costoIndirecto.update({ where: { id }, data });
    return id;
  }
  return (await tx.costoIndirecto.create({ data })).id;
}

export async function eliminarCostoIndirecto(tx: Tx, id: string): Promise<void> {
  if (!(await tx.costoIndirecto.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("El registro no existe o ya fue eliminado.");
  await tx.costoIndirecto.update({ where: { id }, data: { deletedAt: new Date() } });
}

/**
 * Crea o actualiza una regla de prorrateo. Los centros que salen de la regla se marcan
 * como eliminados; los que vuelven se reactivan (la pareja regla-centro es única).
 */
export async function guardarRegla(tx: Tx, id: string | null, valores: unknown): Promise<string> {
  const d = esquemaRegla.parse(valores);
  const error = errorRegla(d.detalles);
  if (error) throw new ErrorNegocio(error);
  for (const det of d.detalles) {
    if (!(await tx.centroCosto.findFirst({ where: { id: det.centroCostoId, deletedAt: null } })))
      throw new ErrorNegocio("Uno de los centros de costo no existe.");
  }
  let reglaId = id;
  if (reglaId) {
    if (!(await tx.reglaProrrateo.findFirst({ where: { id: reglaId, deletedAt: null } })))
      throw new ErrorNegocio("La regla no existe o fue eliminada.");
    await tx.reglaProrrateo.update({
      where: { id: reglaId },
      data: { nombre: d.nombre, descripcion: d.descripcion },
    });
  } else {
    reglaId = (
      await tx.reglaProrrateo.create({ data: { nombre: d.nombre, descripcion: d.descripcion } })
    ).id;
  }
  const actuales = await tx.reglaProrrateoDetalle.findMany({
    where: { reglaProrrateoId: reglaId },
  });
  const nuevos = new Map(d.detalles.map((x) => [x.centroCostoId, String(x.porcentaje)]));
  for (const a of actuales) {
    if (!nuevos.has(a.centroCostoId) && !a.deletedAt)
      await tx.reglaProrrateoDetalle.update({
        where: { id: a.id },
        data: { deletedAt: new Date() },
      });
  }
  for (const [centroCostoId, porcentaje] of nuevos) {
    await tx.reglaProrrateoDetalle.upsert({
      where: { reglaProrrateoId_centroCostoId: { reglaProrrateoId: reglaId, centroCostoId } },
      create: { reglaProrrateoId: reglaId, centroCostoId, porcentaje },
      update: { porcentaje, deletedAt: null },
    });
  }
  return reglaId;
}

export async function eliminarRegla(tx: Tx, id: string): Promise<void> {
  const r = await tx.reglaProrrateo.findFirst({
    where: { id, deletedAt: null },
    include: { _count: { select: { costosIndirectos: { where: { deletedAt: null } } } } },
  });
  if (!r) throw new ErrorNegocio("La regla no existe o ya fue eliminada.");
  if (r._count.costosIndirectos > 0)
    throw new ErrorNegocio(
      `No se puede eliminar: la usan ${r._count.costosIndirectos} gasto(s) administrativo(s).`,
    );
  await tx.reglaProrrateo.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      activo: false,
      nombre: `${r.nombre} · eliminada ${id.slice(-6)}`,
    },
  });
}

/** Reglas activas con sus detalles vigentes. */
export function reglasVigentes() {
  return prismaBase.reglaProrrateo.findMany({
    where: { deletedAt: null },
    orderBy: { nombre: "asc" },
    include: {
      detalles: {
        where: { deletedAt: null },
        include: { centroCosto: { select: { nombre: true } } },
        orderBy: { porcentaje: "desc" },
      },
    },
  });
}

export async function opcionesCostoIndirecto(): Promise<Record<string, Opcion[]>> {
  const activo = { deletedAt: null, activo: true } as const;
  const [categorias, centros, reglas, proveedores] = await Promise.all([
    prismaBase.categoriaGasto.findMany({
      // La depreciación se calcula sola desde los activos (subpaso 1.4).
      where: { ...activo, tipo: "INDIRECTO", rubro: { nombre: { not: "Depreciaciones" } } },
      include: { rubro: { select: { nombre: true, orden: true } } },
      orderBy: [{ rubro: { orden: "asc" } }, { nombre: "asc" }],
    }),
    prismaBase.centroCosto.findMany({ where: activo, orderBy: { nombre: "asc" } }),
    reglasVigentes(),
    prismaBase.proveedor.findMany({ where: activo, orderBy: { nombre: "asc" } }),
  ]);
  return {
    categorias: categorias.map((c) => ({
      valor: c.id,
      etiqueta: c.nombre === c.rubro.nombre ? c.nombre : `${c.nombre} · ${c.rubro.nombre}`,
    })),
    centros: centros.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
    reglas: reglas
      .filter((r) => r.activo)
      .map((r) => ({
        valor: r.id,
        etiqueta: `${r.nombre} (${r.detalles.map((d) => `${d.centroCosto.nombre} ${Number(d.porcentaje)} %`).join(", ")})`,
      })),
    proveedores: proveedores.map((p) => ({ valor: p.id, etiqueta: p.nombre })),
  };
}
