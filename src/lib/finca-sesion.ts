import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prismaBase } from "@/lib/db";
import { contextoFinca } from "@/lib/finca";
import { obtenerUsuarioActual, type UsuarioActual } from "@/lib/sesion";

/** Cookie con la finca elegida (se valida siempre contra el acceso del usuario). */
export const COOKIE_FINCA = "finca";

export interface FincaAccesible {
  id: number;
  nombre: string;
}

/** Fincas activas a las que el usuario tiene acceso (el ADMIN, a todas). */
export const fincasAccesibles = cache(async (u: UsuarioActual): Promise<FincaAccesible[]> => {
  const activa = { deletedAt: null, activa: true } as const;
  if (u.rol === "ADMIN")
    return prismaBase.finca.findMany({
      where: activa,
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    });
  const filas = await prismaBase.usuarioFinca.findMany({
    where: { usuarioId: u.id, deletedAt: null, finca: activa },
    select: { finca: { select: { id: true, nombre: true } } },
    orderBy: { finca: { nombre: "asc" } },
  });
  return filas.map((f) => f.finca);
});

/**
 * Finca activa de la solicitud: la de la cookie si el usuario tiene acceso; si solo tiene
 * una, esa. Si no, null (debe elegir en "Mis fincas").
 */
export const fincaActual = cache(async (): Promise<FincaAccesible | null> => {
  const u = await obtenerUsuarioActual();
  if (!u) return null;
  const fincas = await fincasAccesibles(u);
  const id = Number((await cookies()).get(COOKIE_FINCA)?.value);
  return fincas.find((f) => f.id === id) ?? (fincas.length === 1 ? fincas[0] : null);
});

export async function idFincaActual(): Promise<number | null> {
  return (await fincaActual())?.id ?? null;
}

/**
 * Envuelve un manejador de ruta (exportaciones, archivos) para que corra en la finca
 * activa del usuario; sin finca responde 403.
 */
export function enFinca<A extends unknown[]>(
  manejar: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    const finca = await fincaActual();
    if (!finca) return new Response("Elige una finca en «Mis fincas».", { status: 403 });
    return contextoFinca.run({ fincaId: finca.id }, async () => await manejar(...args));
  };
}
