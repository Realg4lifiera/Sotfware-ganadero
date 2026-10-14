"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import {
  editarConsumo as editar,
  eliminarConsumo as eliminar,
  registrarConsumos,
} from "@/lib/servicios/leche";

const RUTA = "/produccion/consumo-interno";

export async function crearConsumos(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("leche:registrar", async ({ tx }) => {
    await registrarConsumos(tx, valores);
    return "";
  });
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function editarConsumo(
  id: string,
  valores: unknown,
): Promise<ResultadoAccion<string>> {
  const r = await accion("leche:registrar", async ({ tx }) => {
    await editar(tx, id, valores);
    return id;
  });
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function eliminarConsumo(id: string): Promise<ResultadoAccion> {
  const r = await accion("leche:registrar", ({ tx }) => eliminar(tx, id));
  if (r.ok) revalidatePath(RUTA);
  return r;
}
