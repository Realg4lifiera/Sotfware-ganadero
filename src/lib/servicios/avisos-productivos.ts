import "server-only";
import { prismaBase } from "@/lib/db";
import { avisosProductivos, type AvisoProductivo } from "@/lib/dominio/alertas-productivas";
import { hoy } from "@/lib/fechas";
import { animalesConCategoria, obtenerConfiguracionFinca } from "@/lib/servicios/inventario";

const masReciente = (a: Date | undefined, b: Date | undefined) =>
  a && b ? (a > b ? a : b) : (a ?? b ?? null);

/** Pesajes y controles lecheros pendientes de los animales activos de la finca. */
export async function avisosDelHato(): Promise<AvisoProductivo[]> {
  const [animales, config, pesajes, lactancias, porVaca, porLote] = await Promise.all([
    animalesConCategoria(),
    obtenerConfiguracionFinca(),
    prismaBase.pesaje.findMany({
      where: { deletedAt: null },
      orderBy: [{ animalId: "asc" }, { fecha: "desc" }],
      distinct: ["animalId"],
      select: { animalId: true, fecha: true },
    }),
    prismaBase.lactancia.findMany({
      where: { deletedAt: null, fechaFin: null },
      select: { vacaId: true, fechaInicio: true },
    }),
    prismaBase.registroOrdeno.findMany({
      where: { deletedAt: null, animalId: { not: null } },
      orderBy: [{ animalId: "asc" }, { fecha: "desc" }],
      distinct: ["animalId"],
      select: { animalId: true, fecha: true },
    }),
    prismaBase.registroOrdeno.findMany({
      where: { deletedAt: null, loteId: { not: null }, animalId: null },
      orderBy: [{ loteId: "asc" }, { fecha: "desc" }],
      distinct: ["loteId"],
      select: { loteId: true, fecha: true },
    }),
  ]);
  const pesaje = new Map(pesajes.map((p) => [p.animalId, p.fecha]));
  const lactancia = new Map(lactancias.map((l) => [l.vacaId, l.fechaInicio]));
  const controlVaca = new Map(porVaca.map((r) => [r.animalId!, r.fecha]));
  const controlLote = new Map(porLote.map((r) => [r.loteId!, r.fecha]));

  return avisosProductivos(
    animales.map((a) => ({
      id: a.id,
      numero: a.numero,
      nombre: a.nombre,
      categoria: a.categoria,
      loteId: a.lote?.id ?? null,
      lote: a.lote?.nombre ?? null,
      fechaIngreso: a.fechaIngreso,
      ultimoPesaje: pesaje.get(a.id) ?? null,
      inicioLactancia: lactancia.get(a.id) ?? null,
      ultimoControl: masReciente(
        controlVaca.get(a.id),
        a.lote ? controlLote.get(a.lote.id) : undefined,
      ),
    })),
    config.produccion,
    hoy(),
  );
}
