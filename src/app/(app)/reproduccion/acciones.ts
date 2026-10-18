"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import type { ResultadoAccion } from "@/lib/errores";
import { ETIQUETA_TIPO_EVENTO_REPRODUCTIVO } from "@/lib/etiquetas";
import {
  anularUltimoEvento as anular,
  registrarCelo as celo,
  registrarDiagnostico as diagnostico,
  registrarServicio as servicio,
} from "@/lib/servicios/reproduccion";

function refrescar() {
  revalidatePath("/reproduccion", "layout");
  revalidatePath("/animales", "layout");
  revalidatePath("/tablero");
}

export async function registrarCelo(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("reproduccion:registrar", ({ tx }) => celo(tx, valores));
  if (r.ok) refrescar();
  return r;
}

export async function registrarServicio(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("reproduccion:registrar", ({ tx }) => servicio(tx, valores));
  if (r.ok) refrescar();
  return r;
}

export async function registrarDiagnostico(valores: unknown): Promise<ResultadoAccion<string>> {
  const r = await accion("reproduccion:registrar", ({ tx }) => diagnostico(tx, valores));
  if (r.ok) refrescar();
  return r;
}

export async function anularUltimoEvento(hembraId: string): Promise<ResultadoAccion<string>> {
  const r = await accion("reproduccion:registrar", async ({ tx }) => {
    const tipo = await anular(tx, hembraId);
    return ETIQUETA_TIPO_EVENTO_REPRODUCTIVO[
      tipo as keyof typeof ETIQUETA_TIPO_EVENTO_REPRODUCTIVO
    ];
  });
  if (r.ok) refrescar();
  return r;
}
