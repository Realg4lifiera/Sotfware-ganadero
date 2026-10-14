import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { claveValida, type Almacenamiento } from "./tipos";

/** Adaptador de disco para desarrollo local (carpeta .almacenamiento/). */
export class AlmacenamientoLocal implements Almacenamiento {
  constructor(private readonly raiz = path.join(process.cwd(), ".almacenamiento")) {}

  private ruta(clave: string) {
    if (!claveValida(clave)) throw new Error(`Clave de archivo inválida: ${clave}`);
    return path.join(this.raiz, clave);
  }

  async guardar(clave: string, datos: Uint8Array, tipoMime: string) {
    const ruta = this.ruta(clave);
    await mkdir(path.dirname(ruta), { recursive: true });
    await writeFile(ruta, datos);
    await writeFile(`${ruta}.mime`, tipoMime);
  }

  async obtener(clave: string) {
    try {
      const ruta = this.ruta(clave);
      const [cuerpo, tipoMime] = await Promise.all([
        readFile(ruta),
        readFile(`${ruta}.mime`, "utf8"),
      ]);
      return { cuerpo: new Uint8Array(cuerpo), tipoMime, tamano: cuerpo.byteLength };
    } catch {
      return null;
    }
  }

  async eliminar(clave: string) {
    const ruta = this.ruta(clave);
    await rm(ruta, { force: true });
    await rm(`${ruta}.mime`, { force: true });
  }
}
