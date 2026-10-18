"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import {
  crearPajilla as crear,
  editarPajilla as editar,
  eliminarPajilla as eliminar,
  registrarMovimientoPajilla,
} from "@/lib/servicios/pajillas";

const RUTA = "/reproduccion/pajillas";

export async function crearPajilla(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("reproduccion:gestionar", ({ tx }) => crear(tx, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarPajilla(
  id: string,
  valores: unknown,
): Promise<ResultadoAccion<string>> {
  const r = await accion("reproduccion:gestionar", ({ tx }) => editar(tx, id, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function moverPajilla(id: string, valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("reproduccion:gestionar", async ({ tx }) => {
    await registrarMovimientoPajilla(tx, id, valores);
    return id;
  });
  if (r.ok) revalidatePath(RUTA, "layout");
  return r;
}

export async function eliminarPajilla(id: string): Promise<ResultadoAccion> {
  const r = await accion("reproduccion:gestionar", ({ tx }) => eliminar(tx, id));
  if (r.ok) revalidatePath(RUTA);
  return r;
}
