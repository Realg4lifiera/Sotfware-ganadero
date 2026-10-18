import "server-only";
import { prismaBase } from "@/lib/db";
import { agruparCostos, mesesEntre, type Agrupacion } from "@/lib/dominio/reporte-costos";
import { costosDelMes, rubrosOrdenados } from "@/lib/servicios/costos";

/** Reporte de costos de `desde` a `hasta` ("AAAA-MM", incluidos; máx. 24 meses). */
export async function reporteCostos(desde: string, hasta: string, por: Agrupacion) {
  const meses = mesesEntre(desde, hasta);
  const lineas = await Promise.all(meses.map((m) => costosDelMes(m)));
  const todas = lineas.flat();
  const ids = (k: "loteId" | "animalId") => [
    ...new Set(todas.map((l) => l[k]).filter((x): x is string => !!x)),
  ];
  const [rubros, categorias, centros, lotes, animales] = await Promise.all([
    rubrosOrdenados(),
    prismaBase.categoriaGasto.findMany({ select: { id: true, nombre: true } }),
    prismaBase.centroCosto.findMany({ select: { id: true, nombre: true } }),
    prismaBase.lote.findMany({
      where: { id: { in: ids("loteId") } },
      select: { id: true, nombre: true },
    }),
    prismaBase.animal.findMany({
      where: { id: { in: ids("animalId") } },
      select: { id: true, numero: true, nombre: true },
    }),
  ]);
  const nombres = new Map<string, string>([
    ...rubros.map((r) => [r.id, r.nombre] as [string, string]),
    ...categorias.map((c) => [c.id, c.nombre] as [string, string]),
    ...centros.map((c) => [c.id, c.nombre] as [string, string]),
    ...lotes.map((l) => [l.id, l.nombre] as [string, string]),
    ...animales.map(
      (a) => [a.id, a.nombre ? `${a.numero} · ${a.nombre}` : a.numero] as [string, string],
    ),
  ]);
  const ordenRubro = new Map(rubros.map((r, i) => [r.id, i]));
  return {
    meses,
    ...agruparCostos(
      meses.map((mes, i) => ({ mes, lineas: lineas[i] })),
      por,
      nombres,
      por === "rubro" ? (k) => ordenRubro.get(k) ?? 99 : undefined,
    ),
  };
}

export type ReporteCostos = Awaited<ReturnType<typeof reporteCostos>>;
