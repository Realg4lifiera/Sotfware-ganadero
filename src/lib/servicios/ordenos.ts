import "server-only";
import { z } from "zod";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import type { Jornada } from "@/generated/prisma/enums";
import { ErrorNegocio } from "@/lib/errores";
import { fechaDesdeISO, formatoFecha, hoy, rangoMes } from "@/lib/fechas";
import { parsearNumeroCO } from "@/lib/formato";
import { esquemaOrdenoLote } from "@/lib/validaciones/ordenos";

/** Litros máximos razonables por vaca en una jornada (control de digitación). */
export const MAX_LITROS_VACA = 60;

const JORNADAS = ["MANANA", "TARDE", "DIA"] as const;

/** Vacas con lactancia abierta en la fecha (para la planilla de control lechero). */
export async function vacasEnLactancia(fecha: Date) {
  const lactancias = await prismaBase.lactancia.findMany({
    where: {
      deletedAt: null,
      fechaInicio: { lte: fecha },
      OR: [{ fechaFin: null }, { fechaFin: { gte: fecha } }],
      vaca: {
        deletedAt: null,
        OR: [{ estado: "ACTIVO" }, { fechaSalida: { gt: fecha } }],
      },
    },
    include: {
      vaca: {
        select: {
          id: true,
          numero: true,
          nombre: true,
          loteId: true,
          lote: { select: { nombre: true } },
        },
      },
    },
    orderBy: { vaca: { numero: "asc" } },
  });
  return lactancias.map((l) => ({
    animalId: l.vaca.id,
    numero: l.vaca.numero,
    nombre: l.vaca.nombre,
    loteId: l.vaca.loteId,
    lote: l.vaca.lote?.nombre ?? "Sin lote",
    lactanciaId: l.id,
    diasEnLeche: Math.round((fecha.getTime() - l.fechaInicio.getTime()) / 86_400_000),
  }));
}

const esquemaControl = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  filas: z
    .array(
      z.object({
        animalId: z.string().min(1),
        jornada: z.enum(JORNADAS),
        litros: z.string(),
      }),
    )
    .max(2000),
});

/**
 * Guarda la planilla de control lechero de un día: litros por vaca y jornada. Una casilla
 * vacía borra el registro que hubiera. Devuelve cuántas casillas quedaron con litros.
 */
export async function guardarControl(tx: Tx, entrada: unknown): Promise<number> {
  const d = esquemaControl.parse(entrada);
  const fecha = fechaDesdeISO(d.fecha);
  if (fecha > hoy()) throw new ErrorNegocio("La fecha no puede ser futura.");
  const vacas = new Map((await vacasEnLactancia(fecha)).map((v) => [v.animalId, v]));
  const errores: Record<string, string> = {};
  const validas: { animalId: string; jornada: Jornada; litros: number | null }[] = [];
  for (const f of d.filas) {
    const clave = `${f.animalId}_${f.jornada}`;
    const litros = f.litros.trim() === "" ? null : parsearNumeroCO(f.litros);
    if (litros !== null && (litros < 0 || litros > MAX_LITROS_VACA)) {
      errores[clave] = `Entre 0 y ${MAX_LITROS_VACA} L.`;
      continue;
    }
    if (f.litros.trim() !== "" && litros === null) {
      errores[clave] = "Número no válido.";
      continue;
    }
    if (litros !== null && !vacas.has(f.animalId)) {
      errores[clave] = "La vaca no estaba en lactancia ese día.";
      continue;
    }
    validas.push({ animalId: f.animalId, jornada: f.jornada, litros });
  }
  if (Object.keys(errores).length) throw new ErrorNegocio("Revisa los valores marcados.", errores);

  // Un mismo ordeño no se registra por vaca y por lote (se contaría dos veces).
  const porLote = await tx.registroOrdeno.findMany({
    where: { fecha, deletedAt: null, animalId: null },
    select: { loteId: true, jornada: true, lote: { select: { nombre: true } } },
  });
  for (const v of validas) {
    if (v.litros === null) continue;
    const vaca = vacas.get(v.animalId)!;
    const choque = porLote.find((l) => l.loteId === vaca.loteId && l.jornada === v.jornada);
    if (choque)
      throw new ErrorNegocio(
        `El ${formatoFecha(fecha)} ya hay un total registrado para ${choque.lote?.nombre} en esa jornada: bórralo o no registres sus vacas una por una.`,
      );
  }

  let guardadas = 0;
  for (const v of validas) {
    // La restricción única incluye registros borrados: se reutiliza la fila si existe.
    const existente = await tx.registroOrdeno.findUnique({
      where: { animalId_fecha_jornada: { animalId: v.animalId, fecha, jornada: v.jornada } },
    });
    if (v.litros === null) {
      if (existente && !existente.deletedAt)
        await tx.registroOrdeno.update({
          where: { id: existente.id },
          data: { deletedAt: new Date() },
        });
      continue;
    }
    guardadas++;
    const litros = v.litros.toFixed(2);
    if (existente) {
      if (!existente.deletedAt && Number(existente.litros) === v.litros) continue;
      await tx.registroOrdeno.update({
        where: { id: existente.id },
        data: { litros, deletedAt: null, lactanciaId: vacas.get(v.animalId)!.lactanciaId },
      });
    } else {
      await tx.registroOrdeno.create({
        data: {
          fecha,
          jornada: v.jornada,
          litros,
          animalId: v.animalId,
          lactanciaId: vacas.get(v.animalId)!.lactanciaId,
        },
      });
    }
  }
  return guardadas;
}

/** Total de un lote en una jornada (cuando no se pesa vaca por vaca). */
export async function registrarOrdenoLote(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaOrdenoLote.parse(valores) as Record<string, unknown>;
  const fecha = d.fecha as Date;
  const jornada = d.jornada as Jornada;
  const loteId = String(d.loteId);
  const lote = await tx.lote.findFirst({ where: { id: loteId, deletedAt: null } });
  if (!lote) throw new ErrorNegocio("Revisa los datos.", { loteId: "El lote no existe." });
  const repetido = await tx.registroOrdeno.findFirst({
    where: { fecha, jornada, loteId, animalId: null, deletedAt: null },
  });
  if (repetido)
    throw new ErrorNegocio(
      "Ese lote ya tiene un total en esa fecha y jornada: elimínalo primero.",
      {
        jornada: "Ya registrado.",
      },
    );
  const porVaca = await tx.registroOrdeno.count({
    where: { fecha, jornada, deletedAt: null, animal: { loteId } },
  });
  if (porVaca > 0)
    throw new ErrorNegocio(
      "Ese día y jornada ya hay vacas de este lote registradas una por una: no se registra también el total.",
    );
  const r = await tx.registroOrdeno.create({
    data: { fecha, jornada, loteId, litros: String(d.litros) },
  });
  return r.id;
}

export async function eliminarOrdenoLote(tx: Tx, id: string): Promise<void> {
  const r = await tx.registroOrdeno.findFirst({ where: { id, deletedAt: null, animalId: null } });
  if (!r) throw new ErrorNegocio("El registro no existe o ya fue eliminado.");
  await tx.registroOrdeno.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Resumen diario del mes: ordeñado vs. entregado + consumo interno (conciliación). */
export async function resumenOrdenosMes(mes: string) {
  const { desde, hasta } = rangoMes(mes);
  const rango = { gte: desde, lt: hasta };
  const [ordenos, entregas, consumos] = await Promise.all([
    prismaBase.registroOrdeno.findMany({
      where: { deletedAt: null, fecha: rango },
      select: { fecha: true, litros: true, animalId: true, loteId: true },
    }),
    prismaBase.entregaLeche.groupBy({
      by: ["fecha"],
      where: { deletedAt: null, fecha: rango },
      _sum: { litros: true },
    }),
    prismaBase.consumoInternoLeche.groupBy({
      by: ["fecha"],
      where: { deletedAt: null, fecha: rango },
      _sum: { litros: true },
    }),
  ]);
  const dias = new Map<
    string,
    {
      fecha: Date;
      ordenado: number;
      litrosVacas: number;
      vacas: Set<string>;
      lotes: number;
      salida: number;
    }
  >();
  const dia = (f: Date) => {
    const k = f.toISOString().slice(0, 10);
    if (!dias.has(k))
      dias.set(k, { fecha: f, ordenado: 0, litrosVacas: 0, vacas: new Set(), lotes: 0, salida: 0 });
    return dias.get(k)!;
  };
  for (const o of ordenos) {
    const x = dia(o.fecha);
    x.ordenado += Number(o.litros);
    if (o.animalId) {
      x.vacas.add(o.animalId);
      x.litrosVacas += Number(o.litros);
    } else x.lotes++;
  }
  // Las salidas solo se comparan en días con ordeño registrado.
  for (const e of [...entregas, ...consumos]) {
    const k = e.fecha.toISOString().slice(0, 10);
    if (dias.has(k)) dias.get(k)!.salida += Number(e._sum.litros ?? 0);
  }
  return [...dias.values()]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .map((x) => ({
      fecha: x.fecha,
      ordenado: Math.round(x.ordenado * 100) / 100,
      /** Litros de las vacas pesadas una por una (para el promedio por vaca). */
      litrosVacas: Math.round(x.litrosVacas * 100) / 100,
      vacas: x.vacas.size,
      lotes: x.lotes,
      salida: Math.round(x.salida * 100) / 100,
    }));
}
