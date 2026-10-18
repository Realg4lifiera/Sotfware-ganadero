import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { ErrorNegocio } from "@/lib/errores";
import { hoy } from "@/lib/fechas";
import type { Opcion } from "@/lib/formularios/campos";
import {
  esquemaMovimientoPajilla,
  esquemaPajilla,
  esquemaPajillaNueva,
} from "@/lib/validaciones/pajillas";

const etiquetaToro = (t: { nombre: string; codigo: string | null }) =>
  t.codigo ? `${t.nombre} (${t.codigo})` : t.nombre;

export async function opcionesPajilla(): Promise<Record<string, Opcion[]>> {
  const activo = { deletedAt: null, activo: true } as const;
  const [toros, razas, proveedores] = await Promise.all([
    prismaBase.toro.findMany({ where: activo, orderBy: { nombre: "asc" } }),
    prismaBase.raza.findMany({ where: activo, orderBy: { nombre: "asc" } }),
    prismaBase.proveedor.findMany({ where: activo, orderBy: { nombre: "asc" } }),
  ]);
  return {
    toros: toros.map((t) => ({ valor: t.id, etiqueta: etiquetaToro(t) })),
    razas: razas.map((r) => ({ valor: r.id, etiqueta: r.nombre })),
    proveedores: proveedores.map((p) => ({ valor: p.id, etiqueta: p.nombre })),
  };
}

function datosPajilla(d: Record<string, unknown>) {
  return {
    toroId: String(d.toroId),
    razaId: (d.razaId as string | null) ?? null,
    codigo: (d.codigo as string | null) ?? null,
    ubicacionTermo: (d.ubicacionTermo as string | null) ?? null,
    proveedorId: (d.proveedorId as string | null) ?? null,
    valorUnitario: (d.valorUnitario as string | null) ?? null,
    activo: d.activo !== false,
  };
}

async function validarToro(tx: Tx, toroId: string) {
  if (!(await tx.toro.findFirst({ where: { id: toroId, deletedAt: null } })))
    throw new ErrorNegocio("Revisa los datos.", { toroId: "El toro no existe." });
}

export async function crearPajilla(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaPajillaNueva.parse(valores) as Record<string, unknown>;
  await validarToro(tx, String(d.toroId));
  const iniciales = Number(d.existenciasIniciales ?? 0);
  const p = await tx.pajilla.create({ data: { ...datosPajilla(d), existencias: iniciales } });
  if (iniciales > 0)
    await tx.movimientoPajilla.create({
      data: {
        pajillaId: p.id,
        tipo: "ENTRADA",
        fecha: hoy(),
        cantidad: iniciales,
        nota: "Existencias iniciales",
      },
    });
  return p.id;
}

export async function editarPajilla(tx: Tx, id: string, valores: unknown): Promise<string> {
  const d = esquemaPajilla.parse(valores) as Record<string, unknown>;
  if (!(await tx.pajilla.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("La pajilla no existe o fue eliminada.");
  await validarToro(tx, String(d.toroId));
  await tx.pajilla.update({ where: { id }, data: datosPajilla(d) });
  return id;
}

/**
 * Suma `cantidad` a las existencias (negativa para usos y ajustes a la baja) sin dejarlas
 * en negativo. La usan los movimientos manuales y los servicios por inseminación.
 */
export async function moverExistencias(tx: Tx, pajillaId: string, cantidad: number) {
  const p = await tx.pajilla.findFirst({ where: { id: pajillaId, deletedAt: null } });
  if (!p) throw new ErrorNegocio("La pajilla no existe o fue eliminada.");
  const nuevas = p.existencias + cantidad;
  if (nuevas < 0)
    throw new ErrorNegocio(`No hay suficientes pajillas en el termo (quedan ${p.existencias}).`, {
      cantidad: `Quedan ${p.existencias}.`,
      pajillaId: `Quedan ${p.existencias}.`,
    });
  await tx.pajilla.update({ where: { id: pajillaId }, data: { existencias: nuevas } });
}

export async function registrarMovimientoPajilla(
  tx: Tx,
  pajillaId: string,
  valores: unknown,
): Promise<void> {
  const d = esquemaMovimientoPajilla.parse(valores) as Record<string, unknown>;
  const cantidad = Number(d.cantidad);
  await moverExistencias(tx, pajillaId, cantidad);
  await tx.movimientoPajilla.create({
    data: {
      pajillaId,
      tipo: d.tipo as "ENTRADA" | "AJUSTE",
      fecha: d.fecha as Date,
      cantidad,
      nota: (d.nota as string | null) ?? null,
    },
  });
}

export async function eliminarPajilla(tx: Tx, id: string): Promise<void> {
  const p = await tx.pajilla.findFirst({
    where: { id, deletedAt: null },
    include: { _count: { select: { servicios: { where: { deletedAt: null } } } } },
  });
  if (!p) throw new ErrorNegocio("La pajilla no existe o ya fue eliminada.");
  if (p._count.servicios > 0)
    throw new ErrorNegocio(
      "Tiene servicios registrados: márcala como inactiva en vez de eliminarla.",
    );
  await tx.pajilla.update({ where: { id }, data: { deletedAt: new Date(), activo: false } });
}
