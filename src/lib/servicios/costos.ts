import "server-only";
import { prismaBase } from "@/lib/db";
import { informeProductor, type InformeProductor } from "@/lib/dominio/informe-productor";
import { lineasDelMes, type EntradaCostos, type LineaCosto } from "@/lib/dominio/motor-costos";
import { rangoMes } from "@/lib/fechas";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { litrosDelPeriodo } from "@/lib/servicios/leche";

const n = (x: { toString(): string } | null | undefined) => (x == null ? 0 : Number(x));

/** Carga de la BD todo lo que el motor necesita para calcular un mes. */
async function cargarEntrada(mes: string): Promise<EntradaCostos> {
  const { desde, hasta } = rangoMes(mes);
  // Un gasto administrativo anual iniciado hasta 11 meses antes aún tiene cuota.
  const haceUnAnio = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() - 11, 1));
  const [config, rubrosClave, gastos, indirectos, nomina, activos] = await Promise.all([
    obtenerConfiguracionFinca(),
    prismaBase.rubroCosto.findMany({
      where: { clave: { not: null }, deletedAt: null },
      select: { id: true, clave: true },
    }),
    prismaBase.gasto.findMany({
      where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
      select: {
        fecha: true,
        categoriaId: true,
        centroCostoId: true,
        valorTotal: true,
        valorIva: true,
        categoria: { select: { rubroId: true } },
      },
    }),
    prismaBase.costoIndirecto.findMany({
      where: { deletedAt: null, fecha: { gte: haceUnAnio, lt: hasta } },
      include: {
        categoria: { select: { rubroId: true } },
        reglaProrrateo: { include: { detalles: { where: { deletedAt: null } } } },
      },
    }),
    prismaBase.pagoNomina.findMany({
      where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
      select: { fecha: true, costoTotal: true, centroCostoId: true },
    }),
    prismaBase.activo.findMany({ where: { deletedAt: null, fechaCompra: { lt: hasta } } }),
  ]);
  const clave = (c: string) => rubrosClave.find((r) => r.clave === c)?.id ?? null;
  return {
    ivaEsCosto: config.costos.ivaEsCosto,
    rubroManoObraId: clave("MANO_OBRA"),
    rubroDepreciacionId: clave("DEPRECIACIONES"),
    gastos: gastos.map((g) => ({
      fecha: g.fecha,
      categoriaId: g.categoriaId,
      rubroId: g.categoria.rubroId,
      centroCostoId: g.centroCostoId,
      valorTotal: n(g.valorTotal),
      valorIva: n(g.valorIva),
    })),
    indirectos: indirectos.map((c) => ({
      fecha: c.fecha,
      periodicidad: c.periodicidad,
      valorTotal: n(c.valorTotal),
      categoriaId: c.categoriaId,
      rubroId: c.categoria.rubroId,
      centroCostoId: c.centroCostoId,
      regla:
        c.reglaProrrateo?.detalles.map((d) => ({
          centroCostoId: d.centroCostoId,
          porcentaje: n(d.porcentaje),
        })) ?? null,
    })),
    nomina: nomina.map((p) => ({
      fecha: p.fecha,
      costoTotal: n(p.costoTotal),
      centroCostoId: p.centroCostoId,
    })),
    activos: activos.map((a) => ({
      valorCompra: n(a.valorCompra),
      valorResidual: n(a.valorResidual),
      fechaCompra: a.fechaCompra,
      vidaUtilMeses: a.vidaUtilMeses,
      activo: a.activo,
      centroCostoId: a.centroCostoId,
    })),
  };
}

/** Líneas de costo del mes ("AAAA-MM"). */
export async function costosDelMes(mes: string): Promise<LineaCosto[]> {
  return lineasDelMes(await cargarEntrada(mes), mes);
}

/** Rubros ordenados como el informe de Colanta (grupo y orden). */
export function rubrosOrdenados() {
  return prismaBase.rubroCosto.findMany({
    where: { deletedAt: null },
    orderBy: [{ grupo: "asc" }, { orden: "asc" }, { nombre: "asc" }],
  });
}

/** Informe del productor del mes ("AAAA-MM"). */
export async function informeDelMes(mes: string): Promise<InformeProductor> {
  const { desde, hasta } = rangoMes(mes);
  const [rubros, lineas, lecheria, litros, ingresos] = await Promise.all([
    rubrosOrdenados(),
    costosDelMes(mes),
    prismaBase.centroCosto.findFirst({
      where: { clave: "LECHERIA", deletedAt: null },
      select: { id: true },
    }),
    litrosDelPeriodo(desde, hasta),
    prismaBase.ingreso.groupBy({
      by: ["tipo"],
      where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
      _sum: { total: true },
    }),
  ]);
  const leche = n(ingresos.find((i) => i.tipo === "VENTA_LECHE")?._sum.total);
  const total = ingresos.reduce((s, i) => s + n(i._sum.total), 0);
  return informeProductor({
    rubros,
    lineas,
    centroLecheriaId: lecheria?.id ?? null,
    litros: { producidos: litros.producidos, vendidos: litros.vendidos, consumo: litros.consumo },
    ingresos: { leche, otros: Math.round((total - leche) * 100) / 100 },
  });
}
