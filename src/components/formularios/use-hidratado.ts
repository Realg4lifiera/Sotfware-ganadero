"use client";

import { useSyncExternalStore } from "react";

const suscribir = () => () => {};

/**
 * Verdadero cuando el componente ya hidrató en el navegador. Se usa para deshabilitar
 * el botón de enviar mientras el formulario aún no es interactivo (conexiones lentas).
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => true,
    () => false,
  );
}
