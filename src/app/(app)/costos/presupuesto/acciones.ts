"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import {
  copiarMesAnterior as copiar,
  guardarPresupuesto as guardar,
} from "@/lib/servicios/presupuesto";

const RUTA = "/costos/presupuesto";

export async function guardarPresupuesto(entrada: unknown): Promise<ResultadoAccion> {
  const r = await accion("costos:gestionar", ({ tx }) => guardar(tx, entrada));
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function copiarMesAnterior(mes: string): Promise<ResultadoAccion<number>> {
  const r = await accion("costos:gestionar", ({ tx }) => copiar(tx, mes));
  if (r.ok) revalidatePath(RUTA);
  return r;
}
