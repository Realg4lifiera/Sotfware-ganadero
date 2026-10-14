import "server-only";
import { AlmacenamientoLocal } from "./local";
import type { Almacenamiento } from "./tipos";
import { AlmacenamientoVercelBlob } from "./vercel-blob";

export * from "./tipos";

let instancia: Almacenamiento | null = null;

/** Proveedor según ALMACENAMIENTO ("local" por defecto, "vercel-blob" en producción). */
export function almacenamiento(): Almacenamiento {
  if (!instancia) {
    instancia =
      process.env.ALMACENAMIENTO === "vercel-blob"
        ? new AlmacenamientoVercelBlob()
        : new AlmacenamientoLocal();
  }
  return instancia;
}
