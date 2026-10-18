import "server-only";
import { z } from "zod";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import type { MetodoPesaje } from "@/generated/prisma/enums";
import { ErrorNegocio } from "@/lib/errores";
import { fechaDesdeISO, formatoFecha, hoy } from "@/lib/fechas";
import { parsearNumeroCO } from "@/lib/formato";
import type { Opcion } from "@/lib/formularios/campos";
import { esquemaPesaje, MAX_PESO_KG } from "@/lib/validaciones/pesajes";

/**
 * Guarda el peso de un animal en una fecha. Si ya tenía pesaje ese día, lo corrige (un
 * pesaje por animal y día). Devuelve el id del pesaje.
 */
async function fijarPeso(
  tx: Tx,
  animalId: string,
  fecha: Date,
  pesoKg: number,
  metodo: MetodoPesaje,
  observaciones: string | null,
): Promise<string> {
  const a = await tx.animal.findFirst({ where: { id: animalId, deletedAt: null } });
  if (!a) throw new ErrorNegocio("El animal no existe.");
  const minimo = a.fechaNacimiento ?? a.fechaIngreso;
  if (fecha < minimo)
    throw new ErrorNegocio(`La fecha es anterior al nacimiento o ingreso del animal ${a.numero}.`, {
      fecha: `Desde el ${formatoFecha(minimo)}.`,
    });
  const existente = await tx.pesaje.findFirst({ where: { animalId, fecha, deletedAt: null } });
  const data = { pesoKg: pesoKg.toFixed(2), metodo, observaciones };
  if (existente) {
    await tx.pesaje.update({ where: { id: existente.id }, data });
    return existente.id;
  }
  return (await tx.pesaje.create({ data: { animalId, fecha, loteId: a.loteId, ...data } })).id;
}

export async function registrarPesaje(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaPesaje.parse(valores) as Record<string, unknown>;
  return fijarPeso(
    tx,
    String(d.animalId),
    d.fecha as Date,
    Number(d.pesoKg),
    d.metodo as MetodoPesaje,
    (d.observaciones as string | null) ?? null,
  );
}

const esquemaPlanilla = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metodo: z.enum(["BASCULA", "CINTA"]),
  filas: z.array(z.object({ animalId: z.string().min(1), pesoKg: z.string() })).max(2000),
});

/** Pesaje de un lote: una fila por animal; las vacías se ignoran. */
export async function registrarPesajeLote(tx: Tx, entrada: unknown): Promise<number> {
  const d = esquemaPlanilla.parse(entrada);
  const fecha = fechaDesdeISO(d.fecha);
  if (fecha > hoy()) throw new ErrorNegocio("La fecha no puede ser futura.");
  const errores: Record<string, string> = {};
  const validas: { animalId: string; peso: number }[] = [];
  for (const f of d.filas) {
    if (f.pesoKg.trim() === "") continue;
    const peso = parsearNumeroCO(f.pesoKg);
    if (peso === null || peso <= 0 || peso > MAX_PESO_KG)
      errores[f.animalId] = `Entre 1 y ${MAX_PESO_KG} kg.`;
    else validas.push({ animalId: f.animalId, peso });
  }
  if (Object.keys(errores).length) throw new ErrorNegocio("Revisa los pesos marcados.", errores);
  if (validas.length === 0) throw new ErrorNegocio("Escribe al menos un peso.");
  for (const v of validas) await fijarPeso(tx, v.animalId, fecha, v.peso, d.metodo, null);
  return validas.length;
}

export async function eliminarPesaje(tx: Tx, id: string): Promise<void> {
  if (!(await tx.pesaje.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("El pesaje no existe o ya fue eliminado.");
  await tx.pesaje.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function opcionesPesaje(): Promise<Record<string, Opcion[]>> {
  const animales = await prismaBase.animal.findMany({
    where: { deletedAt: null, estado: "ACTIVO" },
    orderBy: { numero: "asc" },
    select: { id: true, numero: true, nombre: true, lote: { select: { nombre: true } } },
  });
  return {
    animales: animales.map((a) => ({
      valor: a.id,
      etiqueta: [a.numero, a.nombre, a.lote?.nombre].filter(Boolean).join(" · "),
    })),
  };
}

/** Animales activos de un lote con su último pesaje (para la planilla). */
export async function animalesParaPesar(loteId: string) {
  const animales = await prismaBase.animal.findMany({
    where: { deletedAt: null, estado: "ACTIVO", loteId },
    orderBy: { numero: "asc" },
    select: {
      id: true,
      numero: true,
      nombre: true,
      pesajes: {
        where: { deletedAt: null },
        orderBy: { fecha: "desc" },
        take: 1,
        select: { fecha: true, pesoKg: true },
      },
    },
  });
  return animales.map((a) => ({
    animalId: a.id,
    numero: a.numero,
    nombre: a.nombre,
    ultimo: a.pesajes[0]
      ? {
          fecha: a.pesajes[0].fecha.toISOString().slice(0, 10),
          pesoKg: Number(a.pesajes[0].pesoKg),
        }
      : null,
  }));
}
