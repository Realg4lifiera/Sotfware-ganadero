"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import { eliminarIngreso as eliminar, guardarIngreso } from "@/lib/servicios/ingresos";

const RUTA = "/costos/ingresos";

export async function crearIngreso(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarIngreso(tx, null, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarIngreso(
  id: string,
  valores: unknown,
): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarIngreso(tx, id, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function eliminarIngreso(id: string): Promise<ResultadoAccion> {
  const r = await accion("costos:gestionar", ({ tx }) => eliminar(tx, id));
  if (r.ok) revalidatePath(RUTA);
  return r;
}
