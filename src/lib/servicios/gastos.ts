import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { calcularCompra } from "@/lib/dominio/compras";
import { ErrorNegocio } from "@/lib/errores";
import type { Opcion } from "@/lib/formularios/campos";
import { esquemaGasto } from "@/lib/validaciones/gastos";

type DatosGasto = {
  fecha: Date;
  descripcion: string;
  categoriaId: string;
  centroCostoId: string;
  cantidad: string;
  valorUnitario: string;
  proveedorId: string | null;
  descuento: string | null;
  ivaPorcentaje: string | null;
  origen: "COOPERATIVA" | "EXTERNA";
  numeroFactura: string | null;
  insumoId: string | null;
  presentacion: string | null;
  marca: string | null;
  contenido: string | null;
  animalId: string | null;
  loteId: string | null;
  notas: string | null;
};

/** Verifica que las referencias existan y no estén eliminadas. */
async function erroresReferencias(tx: Tx, d: DatosGasto): Promise<Record<string, string>> {
  const errores: Record<string, string> = {};
  const existe = async (modelo: string, id: string | null) =>
    !id ||
    !!(await (tx as unknown as Record<string, { findFirst(a: object): Promise<unknown> }>)[
      modelo
    ].findFirst({
      where: { id, deletedAt: null },
    }));
  if (!(await existe("categoriaGasto", d.categoriaId)))
    errores.categoriaId = "La categoría no existe.";
  if (!(await existe("centroCosto", d.centroCostoId)))
    errores.centroCostoId = "El centro de costo no existe.";
  if (!(await existe("proveedor", d.proveedorId))) errores.proveedorId = "El proveedor no existe.";
  if (!(await existe("insumo", d.insumoId))) errores.insumoId = "El insumo no existe.";
  if (!(await existe("animal", d.animalId))) errores.animalId = "El animal no existe.";
  if (!(await existe("lote", d.loteId))) errores.loteId = "El lote no existe.";
  return errores;
}

/** Crea o actualiza un gasto. Los totales siempre se calculan en el servidor. */
export async function guardarGasto(tx: Tx, id: string | null, valores: unknown): Promise<string> {
  const d = esquemaGasto.parse(valores) as unknown as DatosGasto;
  const errores = await erroresReferencias(tx, d);
  if (Object.keys(errores).length) throw new ErrorNegocio("Revisa los datos del gasto.", errores);

  const t = calcularCompra({
    cantidad: Number(d.cantidad),
    valorUnitario: Number(d.valorUnitario),
    descuento: Number(d.descuento ?? 0),
    ivaPorcentaje: Number(d.ivaPorcentaje ?? 0),
  });
  const data = {
    fecha: d.fecha,
    descripcion: d.descripcion,
    categoriaId: d.categoriaId,
    centroCostoId: d.centroCostoId,
    proveedorId: d.proveedorId,
    insumoId: d.insumoId,
    presentacion: d.presentacion,
    marca: d.marca,
    contenido: d.contenido,
    cantidad: d.cantidad,
    valorUnitario: d.valorUnitario,
    descuento: String(t.descuento),
    ivaPorcentaje: d.ivaPorcentaje ?? "0",
    valorIva: String(t.valorIva),
    valorTotal: String(t.total),
    numeroFactura: d.numeroFactura,
    origen: d.origen,
    notas: d.notas,
    animalId: d.animalId,
    loteId: d.loteId,
  };
  if (id) {
    const actual = await tx.gasto.findFirst({ where: { id, deletedAt: null } });
    if (!actual) throw new ErrorNegocio("El gasto no existe o fue eliminado.");
    await tx.gasto.update({ where: { id }, data });
    return id;
  }
  return (await tx.gasto.create({ data })).id;
}

export async function eliminarGasto(tx: Tx, id: string): Promise<void> {
  const g = await tx.gasto.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { suministros: true, eventosSanitarios: true, movimientosPajilla: true } },
    },
  });
  if (!g) throw new ErrorNegocio("El gasto no existe o ya fue eliminado.");
  const c = g._count;
  if (c.suministros + c.eventosSanitarios + c.movimientosPajilla > 0)
    throw new ErrorNegocio(
      "No se puede eliminar: el gasto está enlazado a suministros, sanidad o pajillas.",
    );
  await tx.gasto.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Opciones de los selects del formulario de gastos. */
export async function opcionesGasto(): Promise<Record<string, Opcion[]>> {
  const activo = { deletedAt: null, activo: true } as const;
  const [categorias, centros, proveedores, insumos, animales, lotes] = await Promise.all([
    prismaBase.categoriaGasto.findMany({
      where: activo,
      include: { rubro: { select: { nombre: true, orden: true } } },
      orderBy: [{ rubro: { orden: "asc" } }, { nombre: "asc" }],
    }),
    prismaBase.centroCosto.findMany({ where: activo, orderBy: { nombre: "asc" } }),
    prismaBase.proveedor.findMany({ where: activo, orderBy: { nombre: "asc" } }),
    prismaBase.insumo.findMany({ where: activo, orderBy: { nombre: "asc" } }),
    prismaBase.animal.findMany({
      where: { deletedAt: null, estado: "ACTIVO" },
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, nombre: true },
    }),
    prismaBase.lote.findMany({ where: activo, orderBy: { nombre: "asc" } }),
  ]);
  return {
    categorias: categorias.map((c) => ({
      valor: c.id,
      etiqueta: c.nombre === c.rubro.nombre ? c.nombre : `${c.nombre} · ${c.rubro.nombre}`,
    })),
    centros: centros.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
    proveedores: proveedores.map((p) => ({
      valor: p.id,
      etiqueta: p.nit ? `${p.nombre} (${p.nit})` : p.nombre,
    })),
    insumos: insumos.map((i) => ({
      valor: i.id,
      etiqueta: i.presentacion ? `${i.nombre} · ${i.presentacion}` : i.nombre,
    })),
    animales: animales.map((a) => ({
      valor: a.id,
      etiqueta: a.nombre ? `${a.numero} · ${a.nombre}` : a.numero,
    })),
    lotes: lotes.map((l) => ({ valor: l.id, etiqueta: l.nombre })),
  };
}
