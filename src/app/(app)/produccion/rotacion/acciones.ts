"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import { rotarLote as rotar } from "@/lib/servicios/rotacion";

export async function rotarLote(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("produccion:registrar", ({ tx }) => rotar(tx, valores));
  if (r.ok) {
    revalidatePath("/produccion", "layout");
    revalidatePath("/animales", "layout");
  }
  return r;
}
