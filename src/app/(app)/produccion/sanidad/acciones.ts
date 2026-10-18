"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import {
  eliminarEventoSanitario as eliminar,
  registrarEventoSanitario as registrar,
} from "@/lib/servicios/sanidad";

const refrescar = () => {
  revalidatePath("/produccion/sanidad");
  revalidatePath("/animales", "layout");
  revalidatePath("/tablero");
};

export async function registrarEventoSanitario(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("sanidad:registrar", ({ tx }) => registrar(tx, valores));
  if (r.ok) refrescar();
  return r;
}

export async function eliminarEventoSanitario(id: string): Promise<ResultadoAccion> {
  const r = await accion("sanidad:registrar", ({ tx }) => eliminar(tx, id));
  if (r.ok) refrescar();
  return r;
}
