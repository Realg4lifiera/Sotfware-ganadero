"use server";

import { revalidatePath } from "next/cache";
import { crearCentrosFinca } from "@/lib/catalogos/centros-finca";
import { accion } from "@/lib/accion";
import { ErrorNegocio, type ResultadoAccion } from "@/lib/errores";
import { conFinca } from "@/lib/finca";
import { crearFincaSchema, fincaSchema } from "@/lib/validaciones/fincas";
import type { Prisma } from "@/generated/prisma/client";

const GLOBAL = { global: true } as const;

function revalidar() {
  revalidatePath("/fincas", "layout");
}

/**
 * Crea una finca con sus centros de costo y, si se pide, los parámetros (reglas de
 * categoría, % ideal, reproducción, costos) de otra finca.
 */
export async function crearFinca(valores: unknown): Promise<ResultadoAccion<{ id: number }>> {
  const r = await accion(
    "finca:gestionar",
    async ({ tx }) => {
      const { copiarDe, ...d } = crearFincaSchema.parse(valores);
      const origen = copiarDe
        ? await tx.finca.findFirst({ where: { id: copiarDe, deletedAt: null } })
        : null;
      if (copiarDe && !origen)
        throw new ErrorNegocio("La finca de origen no existe.", { copiarDe: "Elige otra finca." });
      const nueva = await tx.finca.create({
        data: {
          ...d,
          configuracion: (origen?.configuracion ?? {}) as Prisma.InputJsonValue,
          tipoOrdeno: origen?.tipoOrdeno ?? null,
        },
      });
      // Los catálogos propios de la finca se crean dentro de ella.
      await conFinca(nueva.id, () => crearCentrosFinca(tx));
      return { id: nueva.id };
    },
    GLOBAL,
  );
  if (r.ok) revalidar();
  return r;
}

export async function editarFinca(id: number, valores: unknown): Promise<ResultadoAccion> {
  const r = await accion(
    "finca:gestionar",
    async ({ tx }) => {
      const d = fincaSchema.parse(valores);
      const actual = await tx.finca.findFirst({ where: { id, deletedAt: null } });
      if (!actual) throw new ErrorNegocio("La finca no existe.");
      await tx.finca.update({ where: { id }, data: d });
    },
    GLOBAL,
  );
  if (r.ok) revalidar();
  return r;
}

/** Una finca inactiva sale de "Mis fincas" sin perder sus datos; se puede reactivar. */
export async function cambiarEstadoFinca(id: number, activa: boolean): Promise<ResultadoAccion> {
  const r = await accion(
    "finca:gestionar",
    async ({ tx }) => {
      const actual = await tx.finca.findFirst({ where: { id, deletedAt: null } });
      if (!actual) throw new ErrorNegocio("La finca no existe.");
      if (!activa) {
        const otras = await tx.finca.count({
          where: { activa: true, deletedAt: null, id: { not: id } },
        });
        if (otras === 0) throw new ErrorNegocio("Debe quedar al menos una finca activa.");
      }
      await tx.finca.update({ where: { id }, data: { activa } });
    },
    GLOBAL,
  );
  if (r.ok) revalidar();
  return r;
}
