/** Almacenamiento de archivos (fotos y soportes) detrás de una interfaz propia. */
export interface ArchivoLeido {
  cuerpo: ReadableStream<Uint8Array> | Uint8Array;
  tipoMime: string;
  tamano?: number;
}

export interface Almacenamiento {
  guardar(clave: string, datos: Uint8Array, tipoMime: string): Promise<void>;
  obtener(clave: string): Promise<ArchivoLeido | null>;
  eliminar(clave: string): Promise<void>;
}

/** Tipos de imagen aceptados y su extensión. */
export const IMAGENES_PERMITIDAS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

/** Soportes de gastos: fotos o PDF de la factura. */
export const SOPORTES_PERMITIDOS: Record<string, string> = {
  ...IMAGENES_PERMITIDAS,
  "application/pdf": "pdf",
};
export const TAMANO_MAXIMO_SOPORTE = 10 * 1024 * 1024;

/** Claves seguras: segmentos alfanuméricos, sin "..", sin rutas absolutas. */
export function claveValida(clave: string): boolean {
  return /^[a-z0-9-]+(\/[a-zA-Z0-9_-]+)*\.[a-z0-9]{2,5}$/.test(clave) && !clave.includes("..");
}
