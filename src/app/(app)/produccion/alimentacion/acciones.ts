"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import {
  eliminarSuministro as eliminar,
  registrarSuministro as registrar,
} from "@/lib/servicios/alimentacion";

const RUTA = "/produccion/alimentacion";

export async function registrarSuministro(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("produccion:registrar", ({ tx }) => registrar(tx, valores));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function eliminarSuministro(id: string): Promise<ResultadoAccion> {
  const r = await accion("produccion:registrar", ({ tx }) => eliminar(tx, id));
  if (r.ok) revalidatePath(RUTA);
  return r;
}
