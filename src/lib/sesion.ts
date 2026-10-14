import "server-only";
import { cache } from "react";
import { forbidden, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prismaBase } from "@/lib/db";
import { puede, type Permiso } from "@/lib/permisos";
import type { Rol } from "@/generated/prisma/enums";

export interface UsuarioActual {
  id: string;
  nombre: string;
  usuario: string;
  rol: Rol;
}

/**
 * Usuario de la sesión, releído de la BD en cada solicitud: si lo desactivan o le cambian
 * el rol, aplica de inmediato aunque su JWT siga vigente.
 */
export const obtenerUsuarioActual = cache(async (): Promise<UsuarioActual | null> => {
  const sesion = await auth();
  const id = sesion?.user?.id;
  if (!id) return null;
  const u = await prismaBase.usuario.findUnique({
    where: { id },
    select: { id: true, nombre: true, usuario: true, rol: true, activo: true },
  });
  if (!u || !u.activo) return null;
  return { id: u.id, nombre: u.nombre, usuario: u.usuario, rol: u.rol };
});

/** Para páginas: exige sesión (o redirige a /login) y el permiso (o responde 403). */
export async function requierePermiso(permiso: Permiso): Promise<UsuarioActual> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  if (!puede(usuario.rol, permiso)) forbidden();
  return usuario;
}

/** Para páginas que solo requieren sesión. */
export async function requiereSesion(): Promise<UsuarioActual> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}
