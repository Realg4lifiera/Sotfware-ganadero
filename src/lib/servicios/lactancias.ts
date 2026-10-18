import "server-only";
import { prismaBase } from "@/lib/db";
import { hoy } from "@/lib/fechas";
import { produccionLactancia } from "@/lib/indicadores/lactancia";

/** Lactancias abiertas, o cerradas en los últimos 12 meses, con su producción estimada. */
export async function lactanciasConProduccion(abiertas: boolean) {
  const ref = hoy();
  const haceUnAnio = new Date(
    Date.UTC(ref.getUTCFullYear() - 1, ref.getUTCMonth(), ref.getUTCDate()),
  );
  const lactancias = await prismaBase.lactancia.findMany({
    where: {
      deletedAt: null,
      vaca: { deletedAt: null },
      ...(abiertas ? { fechaFin: null } : { fechaFin: { gte: haceUnAnio } }),
    },
    orderBy: abiertas ? { fechaInicio: "asc" } : { fechaFin: "desc" },
    include: {
      vaca: {
        select: { id: true, numero: true, nombre: true, lote: { select: { nombre: true } } },
      },
      ordenos: {
        where: { deletedAt: null, animalId: { not: null } },
        select: { fecha: true, litros: true },
      },
    },
  });
  return lactancias.map((l) => ({
    id: l.id,
    vacaId: l.vaca.id,
    vaca: l.vaca.nombre ? `${l.vaca.numero} · ${l.vaca.nombre}` : l.vaca.numero,
    lote: l.vaca.lote?.nombre ?? null,
    numero: l.numero,
    inicio: l.fechaInicio,
    fin: l.fechaFin,
    ...produccionLactancia(
      { inicio: l.fechaInicio, fin: l.fechaFin },
      l.ordenos.map((o) => ({ fecha: o.fecha, litros: Number(o.litros) })),
      ref,
    ),
  }));
}
