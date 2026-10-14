import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ErrorNegocio, ErrorPermiso } from "@/lib/errores";

/** Convierte cualquier error de una acción en un mensaje en español para el usuario. */
export function traducirError(e: unknown): {
  ok: false;
  error: string;
  erroresCampo?: Record<string, string>;
} {
  if (e instanceof ErrorNegocio)
    return { ok: false, error: e.message, erroresCampo: e.erroresCampo };
  if (e instanceof ErrorPermiso) return { ok: false, error: e.message };
  if (e instanceof ZodError) {
    const erroresCampo: Record<string, string> = {};
    for (const issue of e.issues) {
      const campo = issue.path.join(".");
      if (!erroresCampo[campo]) erroresCampo[campo] = issue.message;
    }
    return { ok: false, error: "Revisa los datos del formulario.", erroresCampo };
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      const campo = campoUnico(e.meta);
      const nombre = campo ? (ETIQUETA_CAMPO_UNICO[campo] ?? `ese valor de ${campo}`) : "ese valor";
      return {
        ok: false,
        error: `Ya existe un registro con ${nombre}.`,
        erroresCampo: campo ? { [campo]: `Ya existe un registro con ${nombre}.` } : undefined,
      };
    }
    if (e.code === "P2003") {
      return {
        ok: false,
        error: "El registro está relacionado con otro que no existe o no se puede quitar.",
      };
    }
    if (e.code === "P2025") return { ok: false, error: "El registro no existe o fue eliminado." };
  }
  console.error("[accion] error inesperado", e);
  return { ok: false, error: "Ocurrió un error inesperado. Intenta de nuevo." };
}

const ETIQUETA_CAMPO_UNICO: Record<string, string> = {
  nombre: "ese nombre",
  numero: "ese número de chapeta",
  usuario: "ese nombre de usuario",
  email: "ese correo",
  animalId: "ese animal",
};

/** Campo de una violación de unicidad (Prisma 7 con adaptador entrega el índice). */
export function campoUnico(meta: Record<string, unknown> | undefined): string | null {
  const target = meta?.target;
  if (Array.isArray(target) && target.length === 1) return String(target[0]);
  const causa = (
    meta?.driverAdapterError as { cause?: { constraint?: { index?: string; fields?: string[] } } }
  )?.cause?.constraint;
  if (causa?.fields?.length === 1) return causa.fields[0].replace(/"/g, "");
  const m = causa?.index ? /^[A-Za-z]+_(.+)_key$/.exec(causa.index) : null;
  return m && !m[1].includes("_") ? m[1] : null;
}
