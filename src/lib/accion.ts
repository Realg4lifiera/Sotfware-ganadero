import "server-only";
import { contextoAuditoria, db, type Tx } from "@/lib/auditoria";
import { contextoFinca } from "@/lib/finca";
import { fincaActual } from "@/lib/finca-sesion";
import { ErrorPermiso, type ResultadoAccion } from "@/lib/errores";
import { traducirError } from "@/lib/traducir-error";
import { puede, type Permiso } from "@/lib/permisos";
import { obtenerUsuarioActual, type UsuarioActual } from "@/lib/sesion";

export interface ContextoAccion {
  usuario: UsuarioActual;
  /** Finca activa (null solo en acciones globales). */
  fincaId: number | null;
  /** Cliente transaccional y auditado: úsalo para TODA escritura de la acción. */
  tx: Tx;
}

/**
 * Envoltura obligatoria de toda server action que escribe:
 * 1. Relee el usuario de la BD (activo + rol actual).
 * 2. Valida el permiso con la matriz de lib/permisos.ts.
 * 3. Fija la finca activa (validada contra el acceso del usuario): toda lectura y escritura
 *    de `fn` queda dentro de esa finca. Las acciones globales (fincas, usuarios) pasan
 *    `{ global: true }` y no exigen finca.
 * 4. Abre una transacción con contexto de auditoría y ejecuta `fn`.
 * 5. Convierte errores conocidos en mensajes en español.
 */
export async function accion<T>(
  permiso: Permiso | Permiso[],
  fn: (ctx: ContextoAccion) => Promise<T>,
  opciones: { timeoutMs?: number; global?: boolean } = {},
): Promise<ResultadoAccion<T>> {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) return { ok: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
    const permisos = Array.isArray(permiso) ? permiso : [permiso];
    if (!permisos.some((p) => puede(usuario.rol, p))) throw new ErrorPermiso();
    const finca = await fincaActual();
    if (!finca && !opciones.global)
      return { ok: false, error: "Elige una finca en «Mis fincas» antes de continuar." };

    const ejecutar = () =>
      contextoAuditoria.run({ usuarioId: usuario.id, usuarioNombre: usuario.nombre }, () =>
        db.$transaction(
          async (tx) => {
            contextoAuditoria.getStore()!.tx = tx;
            return fn({ usuario, fincaId: opciones.global ? null : finca!.id, tx });
          },
          { timeout: opciones.timeoutMs ?? 15_000, maxWait: 10_000 },
        ),
      );
    // Las acciones globales corren sin finca (su auditoría queda sin finca).
    const fincaId = opciones.global ? null : finca!.id;
    const datos = await contextoFinca.run({ fincaId }, async () => await ejecutar());
    return { ok: true, datos };
  } catch (e) {
    return traducirError(e);
  }
}
