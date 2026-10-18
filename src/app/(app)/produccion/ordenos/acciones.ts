"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import {
  eliminarOrdenoLote as eliminar,
  guardarControl as guardar,
  registrarOrdenoLote as registrar,
} from "@/lib/servicios/ordenos";

const refrescar = () => {
  revalidatePath("/produccion", "layout");
  revalidatePath("/animales", "layout");
};

export async function guardarControl(entrada: unknown): Promise<ResultadoAccion<number>> {
  const r = await accion("produccion:registrar", ({ tx }) => guardar(tx, entrada));
  if (r.ok) refrescar();
  return r;
}

export async function registrarOrdenoLote(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("produccion:registrar", ({ tx }) => registrar(tx, valores));
  if (r.ok) refrescar();
  return r;
}

export async function eliminarOrdenoLote(id: string): Promise<ResultadoAccion> {
  const r = await accion("produccion:registrar", ({ tx }) => eliminar(tx, id));
  if (r.ok) refrescar();
  return r;
}
