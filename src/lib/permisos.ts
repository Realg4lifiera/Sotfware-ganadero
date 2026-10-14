/**
 * Matriz de permisos: ÚNICO lugar donde se define qué puede hacer cada rol.
 * Se valida en el servidor (accion() y requierePermiso()) y el menú se filtra con ella.
 */
import type { Rol } from "@/generated/prisma/enums";

const TODOS: readonly Rol[] = ["ADMIN", "MAYORDOMO", "VETERINARIO", "CONTADOR"];

export const MATRIZ_PERMISOS = {
  "tablero:ver": TODOS,

  // Animales
  "animal:leer": TODOS,
  "animal:crear": ["ADMIN"],
  "animal:editar": ["ADMIN"],
  "animal:eliminar": ["ADMIN"],
  "animal:importar": ["ADMIN"],
  "animal:exportar": ["ADMIN", "CONTADOR"],
  /** Traslados de lote y potrero. */
  "animal:trasladar": ["ADMIN", "MAYORDOMO"],
  /** Compra, venta, muerte y descarte. */
  "animal:movimiento": ["ADMIN"],

  // Módulo 2 — Reproductivo
  "reproduccion:leer": ["ADMIN", "MAYORDOMO", "VETERINARIO"],
  "reproduccion:registrar": ["ADMIN", "MAYORDOMO", "VETERINARIO"],
  /** Toros y pajillas. */
  "reproduccion:gestionar": ["ADMIN", "VETERINARIO"],

  // Módulo 3 — Productivo
  "produccion:leer": TODOS,
  /** Ordeños, pesajes, alimentación, rotación de potreros. */
  "produccion:registrar": ["ADMIN", "MAYORDOMO"],
  /** Entregas y consumo interno de leche. */
  "leche:registrar": ["ADMIN", "MAYORDOMO"],
  "sanidad:leer": ["ADMIN", "MAYORDOMO", "VETERINARIO"],
  "sanidad:registrar": ["ADMIN", "VETERINARIO"],

  // Módulo 1 — Costos
  /** Gastos de campo (compras menores). */
  "gasto:registrar": ["ADMIN", "MAYORDOMO"],
  "costos:leer": ["ADMIN", "CONTADOR"],
  /** Costos de sanidad y reproducción (para el veterinario). */
  "costos:leer-sanidad": ["ADMIN", "CONTADOR", "VETERINARIO"],
  "costos:gestionar": ["ADMIN"],

  // Módulo 4 — Reportes
  "reportes:costos": ["ADMIN", "CONTADOR"],
  "reportes:reproductivos": ["ADMIN", "CONTADOR", "VETERINARIO"],
  "reportes:productivos": ["ADMIN", "CONTADOR"],
  "reportes:inventario": ["ADMIN", "CONTADOR"],

  // Administración
  "configuracion:gestionar": ["ADMIN"],
  "usuario:gestionar": ["ADMIN"],
  "auditoria:leer": ["ADMIN"],
} as const satisfies Record<string, readonly Rol[]>;

export type Permiso = keyof typeof MATRIZ_PERMISOS;

export const PERMISOS = Object.keys(MATRIZ_PERMISOS) as Permiso[];

export function puede(rol: Rol | null | undefined, permiso: Permiso): boolean {
  if (!rol) return false;
  return (MATRIZ_PERMISOS[permiso] as readonly Rol[]).includes(rol);
}

/** Verdadero si el rol tiene al menos uno de los permisos. */
export function puedeAlguno(rol: Rol | null | undefined, permisos: readonly Permiso[]): boolean {
  return permisos.some((p) => puede(rol, p));
}

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMIN: "Administrador",
  MAYORDOMO: "Mayordomo",
  VETERINARIO: "Veterinario",
  CONTADOR: "Contador",
};
