"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export interface EstadoLogin {
  error?: string;
}

/** Solo permite volver a rutas internas (evita redirecciones abiertas). */
function destinoSeguro(desde: FormDataEntryValue | null): string {
  const d = typeof desde === "string" ? desde : "";
  return d.startsWith("/") && !d.startsWith("//") && !d.startsWith("/login") ? d : "/tablero";
}

export async function iniciarSesion(
  _previo: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  try {
    await signIn("credentials", {
      usuario: formData.get("usuario"),
      clave: formData.get("clave"),
      redirectTo: destinoSeguro(formData.get("desde")),
    });
    return {};
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Usuario o contraseña incorrectos, o el usuario está desactivado." };
    }
    throw e; // la redirección de éxito viaja como excepción
  }
}
