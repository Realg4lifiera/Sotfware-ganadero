"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import { eliminarEntrega as eliminar, guardarEntrega } from "@/lib/servicios/leche";

const RUTA = "/produccion/entregas";

export async function crearEntrega(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("leche:registrar", ({ tx }) => guardarEntrega(tx, null, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarEntrega(
  id: string,
  valores: unknown,
): Promise<ResultadoAccion<string>> {
  const r = await accion("leche:registrar", ({ tx }) => guardarEntrega(tx, id, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function eliminarEntrega(id: string): Promise<ResultadoAccion> {
  const r = await accion("leche:registrar", ({ tx }) => eliminar(tx, id));
  if (r.ok) revalidatePath(RUTA);
  return r;
}
