"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import {
  eliminarCostoIndirecto,
  eliminarRegla as eliminarR,
  guardarCostoIndirecto,
  guardarRegla as guardarR,
} from "@/lib/servicios/costos-indirectos";

const RUTA = "/costos/administrativos";

export async function crearCosto(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarCostoIndirecto(tx, null, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarCosto(id: string, valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarCostoIndirecto(tx, id, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function eliminarCosto(id: string): Promise<ResultadoAccion> {
  const r = await accion("costos:gestionar", ({ tx }) => eliminarCostoIndirecto(tx, id));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function guardarRegla(
  id: string | null,
  valores: unknown,
): Promise<ResultadoAccion<string>> {
  const r = await accion("costos:gestionar", ({ tx }) => guardarR(tx, id, valores));
  if (r.ok) revalidatePath(`${RUTA}/reglas`);
  return r;
}

export async function eliminarRegla(id: string): Promise<ResultadoAccion> {
  const r = await accion("costos:gestionar", ({ tx }) => eliminarR(tx, id));
  if (r.ok) revalidatePath(`${RUTA}/reglas`);
  return r;
}
