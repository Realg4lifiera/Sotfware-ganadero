import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { sumarDias } from "@/lib/dominio/gestacion";
import { animalesEnRetiro } from "@/lib/dominio/retiros";
import { ErrorNegocio } from "@/lib/errores";
import { hoy } from "@/lib/fechas";
import type { Opcion } from "@/lib/formularios/campos";
import { esquemaSanitario } from "@/lib/validaciones/sanidad";

export async function registrarEventoSanitario(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaSanitario.parse(valores) as Record<string, unknown>;
  const fecha = d.fecha as Date;
  const aLote = d.aplicaA === "LOTE";
  if (aLote) {
    if (!(await tx.lote.findFirst({ where: { id: String(d.loteId), deletedAt: null } })))
      throw new ErrorNegocio("Revisa los datos.", { loteId: "El lote no existe." });
  } else {
    const a = await tx.animal.findFirst({ where: { id: String(d.animalId), deletedAt: null } });
    if (!a) throw new ErrorNegocio("Revisa los datos.", { animalId: "El animal no existe." });
    if (fecha < (a.fechaNacimiento ?? a.fechaIngreso))
      throw new ErrorNegocio("Revisa los datos.", {
        fecha: "Es anterior al nacimiento o ingreso del animal.",
      });
  }
  const insumoId = (d.insumoId as string | null) ?? null;
  if (insumoId && !(await tx.insumo.findFirst({ where: { id: insumoId, deletedAt: null } })))
    throw new ErrorNegocio("Revisa los datos.", { insumoId: "El producto no existe." });
  const retiro = (dias: unknown) => (dias == null ? null : sumarDias(fecha, Number(dias)));
  const e = await tx.eventoSanitario.create({
    data: {
      tipo: d.tipo as "VACUNA" | "DESPARASITACION" | "TRATAMIENTO",
      fecha,
      animalId: aLote ? null : String(d.animalId),
      loteId: aLote ? String(d.loteId) : null,
      insumoId,
      producto: String(d.producto),
      dosis: (d.dosis as string | null) ?? null,
      via: (d.via as string | null) ?? null,
      diagnostico: d.tipo === "TRATAMIENTO" ? ((d.diagnostico as string | null) ?? null) : null,
      retiroLecheHasta: retiro(d.diasRetiroLeche),
      retiroCarneHasta: retiro(d.diasRetiroCarne),
      veterinario: (d.veterinario as string | null) ?? null,
      observaciones: (d.observaciones as string | null) ?? null,
    },
  });
  return e.id;
}

export async function eliminarEventoSanitario(tx: Tx, id: string): Promise<void> {
  if (!(await tx.eventoSanitario.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("El evento no existe o ya fue eliminado.");
  await tx.eventoSanitario.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function opcionesSanidad(): Promise<Record<string, Opcion[]>> {
  const [animales, lotes, insumos] = await Promise.all([
    prismaBase.animal.findMany({
      where: { deletedAt: null, estado: "ACTIVO" },
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, nombre: true, lote: { select: { nombre: true } } },
    }),
    prismaBase.lote.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prismaBase.insumo.findMany({
      where: { deletedAt: null, activo: true, tipo: "MEDICAMENTO" },
      orderBy: { nombre: "asc" },
    }),
  ]);
  return {
    animales: animales.map((a) => ({
      valor: a.id,
      etiqueta: [a.numero, a.nombre, a.lote?.nombre].filter(Boolean).join(" · "),
    })),
    lotes: lotes.map((l) => ({ valor: l.id, etiqueta: l.nombre })),
    insumos: insumos.map((i) => ({ valor: i.id, etiqueta: i.nombre })),
  };
}

/** Animales activos en retiro de leche o carne hoy, con sus datos. */
export async function retirosVigentes() {
  const ref = hoy();
  const [eventos, animales] = await Promise.all([
    prismaBase.eventoSanitario.findMany({
      where: {
        deletedAt: null,
        OR: [{ retiroLecheHasta: { gte: ref } }, { retiroCarneHasta: { gte: ref } }],
      },
      select: {
        fecha: true,
        producto: true,
        animalId: true,
        loteId: true,
        retiroLecheHasta: true,
        retiroCarneHasta: true,
      },
    }),
    prismaBase.animal.findMany({
      where: { deletedAt: null, estado: "ACTIVO" },
      select: {
        id: true,
        numero: true,
        nombre: true,
        loteId: true,
        lactancias: { where: { deletedAt: null, fechaFin: null }, select: { id: true } },
      },
    }),
  ]);
  const porLote = new Map<string, string[]>();
  for (const a of animales)
    if (a.loteId) porLote.set(a.loteId, [...(porLote.get(a.loteId) ?? []), a.id]);
  const datos = new Map(animales.map((a) => [a.id, a]));
  return animalesEnRetiro(eventos, porLote, ref)
    .filter((r) => datos.has(r.animalId))
    .map((r) => {
      const a = datos.get(r.animalId)!;
      return {
        ...r,
        animal: a.nombre ? `${a.numero} · ${a.nombre}` : a.numero,
        // El retiro de leche solo importa si la vaca está en producción.
        enProduccion: a.lactancias.length > 0,
      };
    })
    .sort((x, y) => x.animal.localeCompare(y.animal, "es", { numeric: true }));
}
