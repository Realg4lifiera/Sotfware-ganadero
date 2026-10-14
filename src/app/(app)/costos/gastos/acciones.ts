"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import { almacenamiento, SOPORTES_PERMITIDOS, TAMANO_MAXIMO_SOPORTE } from "@/lib/almacenamiento";
import { ErrorNegocio, ErrorPermiso, type ResultadoAccion } from "@/lib/errores";
import { puede } from "@/lib/permisos";
import { eliminarGasto as eliminar, guardarGasto } from "@/lib/servicios/gastos";
import { traducirError } from "@/lib/traducir-error";

const RUTA = "/costos/gastos";

export async function crearGasto(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("gasto:registrar", ({ tx }) => guardarGasto(tx, null, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarGasto(id: string, valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarGasto(tx, id, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function eliminarGasto(id: string): Promise<ResultadoAccion> {
  const r = await accion("costos:gestionar", ({ tx }) => eliminar(tx, id));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

/**
 * Sube la foto o el PDF del soporte. El administrador puede hacerlo en cualquier gasto;
 * quien registra gastos de campo, solo en los que creó.
 */
export async function subirSoporte(gastoId: string, formData: FormData): Promise<ResultadoAccion> {
  try {
    const archivo = formData.get("archivo");
    if (!(archivo instanceof File) || archivo.size === 0)
      throw new ErrorNegocio("Selecciona el archivo.");
    const extension = SOPORTES_PERMITIDOS[archivo.type];
    if (!extension)
      throw new ErrorNegocio("El soporte debe ser una foto (JPG, PNG, WebP) o un PDF.");
    if (archivo.size > TAMANO_MAXIMO_SOPORTE)
      throw new ErrorNegocio("El archivo no puede pesar más de 10 MB.");

    const clave = `gastos/${gastoId}/${randomUUID()}.${extension}`;
    let guardado = false;
    const r = await accion(
      ["costos:gestionar", "gasto:registrar"],
      async ({ tx, usuario }) => {
        const gasto = await tx.gasto.findFirst({ where: { id: gastoId, deletedAt: null } });
        if (!gasto) throw new ErrorNegocio("El gasto no existe.");
        if (!puede(usuario.rol, "costos:gestionar") && gasto.createdById !== usuario.id)
          throw new ErrorPermiso();
        await almacenamiento().guardar(
          clave,
          new Uint8Array(await archivo.arrayBuffer()),
          archivo.type,
        );
        guardado = true;
        await tx.adjunto.create({
          data: {
            clave,
            nombreArchivo: archivo.name.slice(0, 200) || `soporte.${extension}`,
            tipoMime: archivo.type,
            tamano: archivo.size,
            entidad: "Gasto",
            entidadId: gastoId,
          },
        });
      },
      { timeoutMs: 60_000 },
    );
    // Si la transacción falló después de guardar, se borra el archivo huérfano.
    if (!r.ok && guardado)
      await almacenamiento()
        .eliminar(clave)
        .catch(() => {});
    if (r.ok) revalidatePath(`${RUTA}/${gastoId}`);
    return r;
  } catch (e) {
    return traducirError(e);
  }
}

/** Quita un soporte (borrado lógico: el archivo se conserva por auditoría). */
export async function eliminarSoporte(adjuntoId: string): Promise<ResultadoAccion> {
  const r = await accion("costos:gestionar", async ({ tx }) => {
    const a = await tx.adjunto.findFirst({
      where: { id: adjuntoId, deletedAt: null, entidad: "Gasto" },
    });
    if (!a) throw new ErrorNegocio("El soporte no existe.");
    await tx.adjunto.update({ where: { id: adjuntoId }, data: { deletedAt: new Date() } });
    return a.entidadId;
  });
  if (r.ok) revalidatePath(`${RUTA}/${r.datos}`);
  return r.ok ? { ok: true, datos: undefined } : r;
}
