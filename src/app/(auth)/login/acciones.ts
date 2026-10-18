"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export interface EstadoLogin {
  error?: string;
  /** Se devuelve para no borrar el usuario cuando falla el intento. */
  usuario?: string;
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
  const usuario = String(formData.get("usuario") ?? "");
  try {
    await signIn("credentials", {
      usuario: formData.get("usuario"),
      clave: formData.get("clave"),
      redirectTo: destinoSeguro(formData.get("desde")),
    });
    return {};
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin")
        return {
          error: "Usuario o contraseña incorrectos, o el usuario está desactivado.",
          usuario,
        };
      // Base de datos caída, variables de entorno faltantes…: no culpar al usuario.
      console.error("[login]", e.type, e.cause ?? e);
      return {
        usuario,
        error:
          "No se pudo iniciar sesión por un problema del servidor. Intenta de nuevo o avisa al administrador.",
      };
    }
    throw e; // la redirección de éxito viaja como excepción
  }
}
