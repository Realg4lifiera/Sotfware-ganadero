/** Error de regla de negocio: su mensaje (en español) se muestra tal cual al usuario. */
export class ErrorNegocio extends Error {
  constructor(
    mensaje: string,
    public readonly erroresCampo?: Record<string, string>,
  ) {
    super(mensaje);
    this.name = "ErrorNegocio";
  }
}

/** El usuario no tiene permiso para la operación. */
export class ErrorPermiso extends Error {
  constructor(mensaje = "No tienes permiso para realizar esta acción.") {
    super(mensaje);
    this.name = "ErrorPermiso";
  }
}

/** Resultado de una server action, serializable para el cliente. */
export type ResultadoAccion<T = void> =
  | { ok: true; datos: T; mensaje?: string }
  | { ok: false; error: string; erroresCampo?: Record<string, string> };
