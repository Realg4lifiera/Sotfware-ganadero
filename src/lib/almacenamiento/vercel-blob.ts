import "server-only";
import { del, get, put } from "@vercel/blob";
import { claveValida, type Almacenamiento } from "./tipos";

/** Adaptador de Vercel Blob (almacén privado: los archivos solo se sirven con sesión). */
export class AlmacenamientoVercelBlob implements Almacenamiento {
  async guardar(clave: string, datos: Uint8Array, tipoMime: string) {
    if (!claveValida(clave)) throw new Error(`Clave de archivo inválida: ${clave}`);
    await put(clave, Buffer.from(datos), {
      access: "private",
      contentType: tipoMime,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }

  async obtener(clave: string) {
    if (!claveValida(clave)) return null;
    const r = await get(clave, { access: "private" });
    if (!r || r.statusCode !== 200) return null;
    return { cuerpo: r.stream, tipoMime: r.blob.contentType, tamano: r.blob.size };
  }

  async eliminar(clave: string) {
    if (!claveValida(clave)) return;
    await del(clave);
  }
}
