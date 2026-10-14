"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import { eliminarPago as eliminar, guardarPago } from "@/lib/servicios/nomina";

const RUTA = "/costos/nomina";

export async function crearPago(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarPago(tx, null, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarPago(id: string, valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarPago(tx, id, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function eliminarPago(id: string): Promise<ResultadoAccion> {
  const r = await accion("costos:gestionar", ({ tx }) => eliminar(tx, id));
  if (r.ok) revalidatePath(RUTA);
  return r;
}
