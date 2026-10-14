"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import { eliminarActivo as eliminar, guardarActivo } from "@/lib/servicios/activos";

const RUTA = "/costos/activos";

export async function crearActivo(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarActivo(tx, null, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarActivo(id: string, valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarActivo(tx, id, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function eliminarActivo(id: string): Promise<ResultadoAccion> {
  const r = await accion("costos:gestionar", ({ tx }) => eliminar(tx, id));
  if (r.ok) revalidatePath(RUTA);
  return r;
}
