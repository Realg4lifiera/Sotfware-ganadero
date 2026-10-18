"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import {
  eliminarPesaje as eliminar,
  registrarPesaje as registrar,
  registrarPesajeLote as registrarLote,
} from "@/lib/servicios/pesajes";

const refrescar = () => {
  revalidatePath("/produccion", "layout");
  revalidatePath("/animales", "layout");
};

export async function registrarPesaje(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("produccion:registrar", ({ tx }) => registrar(tx, valores));
  if (r.ok) refrescar();
  return r;
}

export async function registrarPesajeLote(entrada: unknown): Promise<ResultadoAccion<number>> {
  const r = await accion("produccion:registrar", ({ tx }) => registrarLote(tx, entrada));
  if (r.ok) refrescar();
  return r;
}

export async function eliminarPesaje(id: string): Promise<ResultadoAccion> {
  const r = await accion("produccion:registrar", ({ tx }) => eliminar(tx, id));
  if (r.ok) refrescar();
  return r;
}
