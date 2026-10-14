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

/** Evita quedarse sin administradores activos. */
async function exigirOtroAdmin(tx: Tx, excluirId: string) {
  const otros = await tx.usuario.count({
    where: { rol: "ADMIN", activo: true, id: { not: excluirId } },
  });
  if (otros === 0) throw new ErrorNegocio("Debe quedar al menos un administrador activo.");
}

export async function crearUsuario(valores: unknown): Promise<ResultadoAccion> {
  const r = await accion("usuario:gestionar", async ({ tx }) => {
    const d = crearUsuarioSchema.parse(valores);
    await tx.usuario.create({
      data: {
        nombre: d.nombre,
        usuario: d.usuario,
        email: d.email,
        rol: d.rol,
        passwordHash: await bcrypt.hash(d.clave, 10),
        debeCambiarClave: true,
      },
    });
  });
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarUsuario(id: string, valores: unknown): Promise<ResultadoAccion> {
  const r = await accion("usuario:gestionar", async ({ tx, usuario }) => {
    const d = editarUsuarioSchema.parse(valores);
    const actual = await tx.usuario.findUnique({ where: { id } });
    if (!actual) throw new ErrorNegocio("El usuario no existe.");
    if (actual.rol === "ADMIN" && d.rol !== "ADMIN") {
      if (id === usuario.id) throw new ErrorNegocio("No puedes quitarte el rol de administrador.");
      await exigirOtroAdmin(tx, id);
    }
    await tx.usuario.update({
      where: { id },
      data: { nombre: d.nombre, email: d.email, rol: d.rol },
    });
  });
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function cambiarEstadoUsuario(id: string, activo: boolean): Promise<ResultadoAccion> {
  const r = await accion("usuario:gestionar", async ({ tx, usuario }) => {
    if (!activo && id === usuario.id)
      throw new ErrorNegocio("No puedes desactivar tu propio usuario.");
    const actual = await tx.usuario.findUnique({ where: { id } });
    if (!actual) throw new ErrorNegocio("El usuario no existe.");
    if (!activo && actual.rol === "ADMIN") await exigirOtroAdmin(tx, id);
    await tx.usuario.update({ where: { id }, data: { activo } });
  });
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function restablecerClave(id: string, valores: unknown): Promise<ResultadoAccion> {
  const r = await accion("usuario:gestionar", async ({ tx }) => {
    const { clave } = restablecerClaveSchema.parse(valores);
    const actual = await tx.usuario.findUnique({ where: { id } });
    if (!actual) throw new ErrorNegocio("El usuario no existe.");
    await tx.usuario.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(clave, 10), debeCambiarClave: true },
    });
  });
  if (r.ok) revalidatePath(RUTA);
  return r;
}
