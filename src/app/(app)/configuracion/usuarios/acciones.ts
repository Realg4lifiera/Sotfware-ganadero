"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { Tx } from "@/lib/auditoria";
import { ErrorNegocio, type ResultadoAccion } from "@/lib/errores";
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  restablecerClaveSchema,
} from "@/lib/validaciones/usuarios";

const RUTA = "/configuracion/usuarios";
/** Usuarios y fincas son de toda la instalación: las acciones no dependen de la finca. */
const GLOBAL = { global: true } as const;

/**
 * Deja al usuario con acceso exactamente a `fincaIds` (el administrador entra a todas: no
 * se tocan sus filas). Quitar un acceso es borrado lógico; volver a darlo lo reactiva.
 */
async function sincronizarFincas(tx: Tx, usuarioId: string, rol: string, fincaIds: number[]) {
  if (rol === "ADMIN") return;
  const deseadas = new Set(fincaIds);
  const validas = await tx.finca.count({ where: { id: { in: [...deseadas] }, deletedAt: null } });
  if (validas !== deseadas.size)
    throw new ErrorNegocio("Alguna de las fincas elegidas no existe.", {
      fincaIds: "Revisa las fincas elegidas.",
    });
  const filas = await tx.usuarioFinca.findMany({ where: { usuarioId } });
  for (const f of filas) {
    const quiere = deseadas.delete(f.fincaId);
    if (quiere && f.deletedAt)
      await tx.usuarioFinca.update({ where: { id: f.id }, data: { deletedAt: null } });
    if (!quiere && !f.deletedAt)
      await tx.usuarioFinca.update({ where: { id: f.id }, data: { deletedAt: new Date() } });
  }
  for (const fincaId of deseadas) await tx.usuarioFinca.create({ data: { usuarioId, fincaId } });
}

/** Evita quedarse sin administradores activos. */
async function exigirOtroAdmin(tx: Tx, excluirId: string) {
  const otros = await tx.usuario.count({
    where: { rol: "ADMIN", activo: true, id: { not: excluirId } },
  });
  if (otros === 0) throw new ErrorNegocio("Debe quedar al menos un administrador activo.");
}

export async function crearUsuario(valores: unknown): Promise<ResultadoAccion> {
  const r = await accion(
    "usuario:gestionar",
    async ({ tx }) => {
      const d = crearUsuarioSchema.parse(valores);
      const nuevo = await tx.usuario.create({
        data: {
          nombre: d.nombre,
          usuario: d.usuario,
          email: d.email,
          rol: d.rol,
          passwordHash: await bcrypt.hash(d.clave, 10),
          debeCambiarClave: true,
        },
      });
      await sincronizarFincas(tx, nuevo.id, d.rol, d.fincaIds);
    },
    GLOBAL,
  );
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarUsuario(id: string, valores: unknown): Promise<ResultadoAccion> {
  const r = await accion(
    "usuario:gestionar",
    async ({ tx, usuario }) => {
      const d = editarUsuarioSchema.parse(valores);
      const actual = await tx.usuario.findUnique({ where: { id } });
      if (!actual) throw new ErrorNegocio("El usuario no existe.");
      if (actual.rol === "ADMIN" && d.rol !== "ADMIN") {
        if (id === usuario.id)
          throw new ErrorNegocio("No puedes quitarte el rol de administrador.");
        await exigirOtroAdmin(tx, id);
      }
      await tx.usuario.update({
        where: { id },
        data: { nombre: d.nombre, email: d.email, rol: d.rol },
      });
      await sincronizarFincas(tx, id, d.rol, d.fincaIds);
    },
    GLOBAL,
  );
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function cambiarEstadoUsuario(id: string, activo: boolean): Promise<ResultadoAccion> {
  const r = await accion(
    "usuario:gestionar",
    async ({ tx, usuario }) => {
      if (!activo && id === usuario.id)
        throw new ErrorNegocio("No puedes desactivar tu propio usuario.");
      const actual = await tx.usuario.findUnique({ where: { id } });
      if (!actual) throw new ErrorNegocio("El usuario no existe.");
      if (!activo && actual.rol === "ADMIN") await exigirOtroAdmin(tx, id);
      await tx.usuario.update({ where: { id }, data: { activo } });
    },
    GLOBAL,
  );
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function restablecerClave(id: string, valores: unknown): Promise<ResultadoAccion> {
  const r = await accion(
    "usuario:gestionar",
    async ({ tx }) => {
      const { clave } = restablecerClaveSchema.parse(valores);
      const actual = await tx.usuario.findUnique({ where: { id } });
      if (!actual) throw new ErrorNegocio("El usuario no existe.");
      await tx.usuario.update({
        where: { id },
        data: { passwordHash: await bcrypt.hash(clave, 10), debeCambiarClave: true },
      });
    },
    GLOBAL,
  );
  if (r.ok) revalidatePath(RUTA);
  return r;
}
