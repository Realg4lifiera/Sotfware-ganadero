import "server-only";
import { contextoAuditoria, db, type Tx } from "@/lib/auditoria";
import { ErrorPermiso, type ResultadoAccion } from "@/lib/errores";
import { traducirError } from "@/lib/traducir-error";
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
