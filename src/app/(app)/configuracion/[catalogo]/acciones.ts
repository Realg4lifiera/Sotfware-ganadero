"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import {
  cambiarActivoCatalogo,
  eliminarDeCatalogo,
  guardarEnCatalogo,
  obtenerCatalogo,
} from "@/lib/catalogos/servidor";
import type { ResultadoAccion } from "@/lib/errores";

function permisosDe(clave: string) {
  return obtenerCatalogo(clave)?.def.permisos ?? null;
}

export async function guardarRegistroCatalogo(
  clave: string,
  id: string | null,
  valores: unknown,
): Promise<ResultadoAccion<string>> {
  const permisos = permisosDe(clave);
  if (!permisos) return { ok: false, error: "Catálogo desconocido." };
  const r = await accion(permisos, ({ tx }) => guardarEnCatalogo(tx, clave, id, valores));
  if (r.ok) revalidatePath(`/configuracion/${clave}`);
  return r;
}

export async function eliminarRegistroCatalogo(
  clave: string,
  id: string,
): Promise<ResultadoAccion> {
  const permisos = permisosDe(clave);
  if (!permisos) return { ok: false, error: "Catálogo desconocido." };
  const r = await accion(permisos, ({ tx }) => eliminarDeCatalogo(tx, clave, id));
  if (r.ok) revalidatePath(`/configuracion/${clave}`);
  return r;
}

export async function cambiarActivoRegistro(
  clave: string,
  id: string,
  activo: boolean,
): Promise<ResultadoAccion> {
  const permisos = permisosDe(clave);
  if (!permisos) return { ok: false, error: "Catálogo desconocido." };
  const r = await accion(permisos, ({ tx }) => cambiarActivoCatalogo(tx, clave, id, activo));
  if (r.ok) revalidatePath(`/configuracion/${clave}`);
  return r;
}
