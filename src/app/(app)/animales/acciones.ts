"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import { almacenamiento, IMAGENES_PERMITIDAS, TAMANO_MAXIMO_IMAGEN } from "@/lib/almacenamiento";
import { ErrorNegocio, type ResultadoAccion } from "@/lib/errores";
import { prismaBase } from "@/lib/db";
import {
  crearAnimal as crear,
  editarAnimal as editar,
  eliminarAnimal as eliminar,
  registrarMovimiento as mover,
} from "@/lib/servicios/animales";
import type { TipoMovimientoRegistrable } from "@/lib/validaciones/animales";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { puede } from "@/lib/permisos";
import { traducirError } from "@/lib/traducir-error";

function refrescar(id?: string) {
  revalidatePath("/animales");
  revalidatePath("/tablero");
  if (id) revalidatePath(`/animales/${id}`);
}

export async function crearAnimal(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("animal:crear", ({ tx }) => crear(tx, valores));
  if (r.ok) refrescar();
  return r;
}

export async function editarAnimal(id: string, valores: unknown): Promise<ResultadoAccion> {
  const r = await accion("animal:editar", ({ tx }) => editar(tx, id, valores));
  if (r.ok) refrescar(id);
  return r;
}

const TRASLADOS: TipoMovimientoRegistrable[] = ["TRASLADO_LOTE", "TRASLADO_POTRERO"];

export async function registrarMovimiento(
  animalId: string,
  valores: { tipo?: string } & Record<string, unknown>,
): Promise<ResultadoAccion> {
  // Traslados: ADMIN y MAYORDOMO. Venta, muerte y descarte: solo ADMIN.
  const permiso = TRASLADOS.includes(valores?.tipo as TipoMovimientoRegistrable)
    ? "animal:trasladar"
    : "animal:movimiento";
  const r = await accion(permiso, async ({ tx }) => {
    await mover(tx, animalId, valores);
  });
  if (r.ok) refrescar(animalId);
  return r;
}

export async function eliminarAnimal(id: string): Promise<ResultadoAccion> {
  const r = await accion("animal:eliminar", ({ tx }) => eliminar(tx, id));
  if (r.ok) refrescar(id);
  return r;
}

/** Sube o reemplaza la foto del animal (JPG, PNG o WebP de hasta 5 MB). */
export async function subirFotoAnimal(id: string, formData: FormData): Promise<ResultadoAccion> {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario || !puede(usuario.rol, "animal:editar"))
      throw new ErrorNegocio("No tienes permiso para cambiar la foto.");
    const archivo = formData.get("foto");
    if (!(archivo instanceof File) || archivo.size === 0)
      throw new ErrorNegocio("Selecciona una imagen.");
    const extension = IMAGENES_PERMITIDAS[archivo.type];
    if (!extension) throw new ErrorNegocio("La foto debe ser JPG, PNG o WebP.");
    if (archivo.size > TAMANO_MAXIMO_IMAGEN)
      throw new ErrorNegocio("La foto no puede pesar más de 5 MB.");
    const animal = await prismaBase.animal.findFirst({
      where: { id, deletedAt: null },
      select: { fotoClave: true },
    });
    if (!animal) throw new ErrorNegocio("El animal no existe.");

    // 1) Guardar el archivo; 2) registrar la clave (auditado); 3) borrar la foto anterior.
    const clave = `animales/${id}/${randomUUID()}.${extension}`;
    await almacenamiento().guardar(
      clave,
      new Uint8Array(await archivo.arrayBuffer()),
      archivo.type,
    );
    const r = await accion("animal:editar", async ({ tx }) => {
      await tx.animal.update({ where: { id }, data: { fotoClave: clave } });
    });
    if (!r.ok) {
      await almacenamiento()
        .eliminar(clave)
        .catch(() => {});
      return r;
    }
    if (animal.fotoClave)
      await almacenamiento()
        .eliminar(animal.fotoClave)
        .catch(() => {});
    refrescar(id);
    return r;
  } catch (e) {
    return traducirError(e);
  }
}
