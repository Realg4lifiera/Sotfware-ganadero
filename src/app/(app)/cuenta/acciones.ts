"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import { ErrorNegocio, type ResultadoAccion } from "@/lib/errores";
import { cambiarMiClaveSchema } from "@/lib/validaciones/usuarios";

/** Cualquier usuario con sesión puede cambiar su propia contraseña. */
export async function cambiarMiClave(valores: unknown): Promise<ResultadoAccion> {
  const r = await accion("tablero:ver", async ({ tx, usuario }) => {
    const d = cambiarMiClaveSchema.parse(valores);
    const u = await tx.usuario.findUniqueOrThrow({ where: { id: usuario.id } });
    if (!(await bcrypt.compare(d.actual, u.passwordHash))) {
      throw new ErrorNegocio("La contraseña actual no es correcta.", {
        actual: "La contraseña actual no es correcta.",
      });
    }
    await tx.usuario.update({
      where: { id: usuario.id },
      data: { passwordHash: await bcrypt.hash(d.nueva, 10), debeCambiarClave: false },
    });
  });
  if (r.ok) revalidatePath("/", "layout");
  return r;
}
