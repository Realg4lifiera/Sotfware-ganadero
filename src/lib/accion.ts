import "server-only";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { contextoAuditoria, db, type Tx } from "@/lib/auditoria";
import { ErrorNegocio, ErrorPermiso, type ResultadoAccion } from "@/lib/errores";
import { puede, type Permiso } from "@/lib/permisos";
import { obtenerUsuarioActual, type UsuarioActual } from "@/lib/sesion";

export interface ContextoAccion {
  usuario: UsuarioActual;
  /** Cliente transaccional y auditado: úsalo para TODA escritura de la acción. */
  tx: Tx;
}

/**
 * Envoltura obligatoria de toda server action que escribe:
 * 1. Relee el usuario de la BD (activo + rol actual).
 * 2. Valida el permiso con la matriz de lib/permisos.ts.
 * 3. Abre una transacción con contexto de auditoría y ejecuta `fn`.
 * 4. Convierte errores conocidos en mensajes en español.
 */
export async function accion<T>(
  permiso: Permiso | Permiso[],
  fn: (ctx: ContextoAccion) => Promise<T>,
  opciones: { timeoutMs?: number } = {},
): Promise<ResultadoAccion<T>> {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) return { ok: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
    const permisos = Array.isArray(permiso) ? permiso : [permiso];
    if (!permisos.some((p) => puede(usuario.rol, p))) throw new ErrorPermiso();

    const datos = await contextoAuditoria.run(
      { usuarioId: usuario.id, usuarioNombre: usuario.nombre },
      () =>
        db.$transaction(
          async (tx) => {
            contextoAuditoria.getStore()!.tx = tx;
            return fn({ usuario, tx });
          },
          { timeout: opciones.timeoutMs ?? 15_000, maxWait: 10_000 },
        ),
    );
    return { ok: true, datos };
  } catch (e) {
    return traducirError(e);
  }
}

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
      const campos = (e.meta?.target as string[] | undefined)?.join(", ");
      return {
        ok: false,
        error: `Ya existe un registro con ese valor${campos ? ` (${campos})` : ""}.`,
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
