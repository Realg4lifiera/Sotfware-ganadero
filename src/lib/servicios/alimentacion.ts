import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { ErrorNegocio } from "@/lib/errores";
import { ETIQUETA_UNIDAD } from "@/lib/etiquetas";
import { formatoFecha, hoy } from "@/lib/fechas";
import { formatoCOP, formatoNumero } from "@/lib/formato";
import type { Opcion } from "@/lib/formularios/campos";
import { esquemaSuministro } from "@/lib/validaciones/alimentacion";

/** Insumos que se suministran como alimento. */
export const TIPOS_ALIMENTO = ["ALIMENTO", "SAL", "SUPLEMENTO"] as const;

export async function registrarSuministro(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaSuministro.parse(valores) as Record<string, unknown>;
  const [lote, insumo] = await Promise.all([
    tx.lote.findFirst({ where: { id: String(d.loteId), deletedAt: null } }),
    tx.insumo.findFirst({ where: { id: String(d.insumoId), deletedAt: null } }),
  ]);
  if (!lote) throw new ErrorNegocio("Revisa los datos.", { loteId: "El lote no existe." });
  if (!insumo) throw new ErrorNegocio("Revisa los datos.", { insumoId: "El insumo no existe." });
  const gastoId = (d.gastoId as string | null) ?? null;
  if (gastoId) {
    const g = await tx.gasto.findFirst({ where: { id: gastoId, deletedAt: null } });
    if (!g || g.insumoId !== insumo.id)
      throw new ErrorNegocio("Revisa los datos.", {
        gastoId: "Esa compra no es de este insumo.",
      });
    if (g.fecha > (d.fecha as Date))
      throw new ErrorNegocio("Revisa los datos.", {
        gastoId: `La compra es del ${formatoFecha(g.fecha)}, posterior al suministro.`,
      });
  }
  const s = await tx.suministroAlimento.create({
    data: {
      fecha: d.fecha as Date,
      loteId: lote.id,
      insumoId: insumo.id,
      cantidad: String(d.cantidad),
      gastoId,
      nota: (d.nota as string | null) ?? null,
    },
  });
  return s.id;
}

export async function eliminarSuministro(tx: Tx, id: string): Promise<void> {
  if (!(await tx.suministroAlimento.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("El suministro no existe o ya fue eliminado.");
  await tx.suministroAlimento.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Costo por unidad de una compra (total / cantidad), si se puede calcular. */
export const costoUnitario = (g: { valorTotal: unknown; cantidad: unknown } | null) =>
  g && g.cantidad && Number(g.cantidad) > 0 ? Number(g.valorTotal) / Number(g.cantidad) : null;

export async function opcionesSuministro(): Promise<{
  opciones: Record<string, Opcion[]>;
  /** insumoId → ids de compras de ese insumo (para filtrar en el formulario). */
  comprasPorInsumo: Record<string, string[]>;
}> {
  const desde = new Date(hoy().getTime() - 180 * 86_400_000);
  const [lotes, insumos, compras] = await Promise.all([
    prismaBase.lote.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prismaBase.insumo.findMany({
      where: { deletedAt: null, activo: true, tipo: { in: [...TIPOS_ALIMENTO] } },
      orderBy: { nombre: "asc" },
    }),
    prismaBase.gasto.findMany({
      where: {
        deletedAt: null,
        fecha: { gte: desde },
        insumo: { tipo: { in: [...TIPOS_ALIMENTO] } },
      },
      orderBy: { fecha: "desc" },
      select: { id: true, fecha: true, insumoId: true, cantidad: true, valorTotal: true },
    }),
  ]);
  const comprasPorInsumo: Record<string, string[]> = {};
  for (const c of compras) (comprasPorInsumo[c.insumoId!] ??= []).push(c.id);
  return {
    opciones: {
      lotes: lotes.map((l) => ({ valor: l.id, etiqueta: l.nombre })),
      insumos: insumos.map((i) => ({
        valor: i.id,
        etiqueta: `${i.nombre} · ${i.presentacion ?? ETIQUETA_UNIDAD[i.unidad]}`,
      })),
      compras: compras.map((c) => {
        const cu = costoUnitario(c);
        return {
          valor: c.id,
          etiqueta: [
            formatoFecha(c.fecha),
            c.cantidad && `${formatoNumero(c.cantidad)} und.`,
            cu != null ? `${formatoCOP(Math.round(cu))} c/u` : formatoCOP(c.valorTotal),
          ]
            .filter(Boolean)
            .join(" · "),
        };
      }),
    },
    comprasPorInsumo,
  };
}
