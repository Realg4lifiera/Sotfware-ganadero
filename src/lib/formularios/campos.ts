/**
 * Formularios declarativos: a partir de la lista de campos se construye el esquema Zod
 * (el mismo en el navegador y en el servidor) y se pintan los inputs.
 *
 * En el formulario todo viaja como texto (o booleano); el esquema normaliza:
 *   texto/opción → string | null · decimal → "1234.5" | null · entero → number | null
 *   fecha ("AAAA-MM-DD") → Date (medianoche UTC) | null · booleano → boolean
 */
import { z } from "zod";
import { fechaDesdeISO } from "@/lib/fechas";
import { parsearNumeroCO } from "@/lib/formato";

export type TipoCampo =
  "texto" | "textarea" | "email" | "decimal" | "entero" | "booleano" | "opcion" | "fecha";

export interface Opcion {
  valor: string;
  etiqueta: string;
}

export interface DefCampo {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  /** Para números: mínimo y máximo. Para texto: largo máximo (por defecto 200). */
  min?: number;
  max?: number;
  opciones?: Opcion[];
  /** Opciones que carga el servidor (p. ej. razas): clave del cargador. */
  opcionesDe?: string;
  ayuda?: string;
  sufijo?: string;
  /** Mostrar como columna en el listado. */
  enLista?: boolean;
  /** Ocupa el ancho completo del formulario. */
  anchoCompleto?: boolean;
  porDefecto?: string | boolean;
}

export type ValoresFormulario = Record<string, string | boolean>;

const vacio = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

function esquemaCampo(c: DefCampo): z.ZodType {
  const requerido = "Este dato es obligatorio.";
  switch (c.tipo) {
    case "booleano":
      return z.boolean().default(false);
    case "texto":
    case "textarea":
    case "email": {
      const max = c.max ?? (c.tipo === "textarea" ? 2000 : 200);
      return z
        .string()
        .optional()
        .transform((v) => (vacio(v) ? null : v!.trim()))
        .superRefine((v, ctx) => {
          if (v === null) {
            if (c.requerido) ctx.addIssue({ code: "custom", message: requerido });
            return;
          }
          if (v.length > max)
            ctx.addIssue({ code: "custom", message: `Máximo ${max} caracteres.` });
          if (c.tipo === "email" && !z.email().safeParse(v).success)
            ctx.addIssue({ code: "custom", message: "Correo electrónico no válido." });
        });
    }
    case "decimal":
    case "entero":
      return z
        .string()
        .optional()
        .transform((v, ctx) => {
          if (vacio(v)) {
            if (c.requerido) ctx.addIssue({ code: "custom", message: requerido });
            return null;
          }
          const n = parsearNumeroCO(v!);
          if (n === null) {
            ctx.addIssue({ code: "custom", message: "Escribe un número válido." });
            return null;
          }
          if (c.tipo === "entero" && !Number.isInteger(n)) {
            ctx.addIssue({ code: "custom", message: "Debe ser un número entero." });
            return null;
          }
          if (c.min !== undefined && n < c.min)
            ctx.addIssue({ code: "custom", message: `Debe ser mayor o igual a ${c.min}.` });
          if (c.max !== undefined && n > c.max)
            ctx.addIssue({ code: "custom", message: `Debe ser menor o igual a ${c.max}.` });
          return c.tipo === "entero" ? n : String(n);
        });
    case "opcion":
      return z
        .string()
        .optional()
        .transform((v, ctx) => {
          if (vacio(v)) {
            if (c.requerido) ctx.addIssue({ code: "custom", message: requerido });
            return null;
          }
          if (c.opciones && !c.opciones.some((o) => o.valor === v)) {
            ctx.addIssue({ code: "custom", message: "Opción no válida." });
            return null;
          }
          return v!;
        });
    case "fecha":
      return z
        .string()
        .optional()
        .transform((v, ctx) => {
          if (vacio(v)) {
            if (c.requerido) ctx.addIssue({ code: "custom", message: requerido });
            return null;
          }
          try {
            return fechaDesdeISO(v!.trim());
          } catch {
            ctx.addIssue({ code: "custom", message: "Fecha no válida." });
            return null;
          }
        });
  }
}

export function esquemaDesdeCampos(campos: DefCampo[]) {
  return z.object(Object.fromEntries(campos.map((c) => [c.nombre, esquemaCampo(c)])));
}

/** Valores iniciales vacíos del formulario. */
export function valoresVacios(campos: DefCampo[]): ValoresFormulario {
  return Object.fromEntries(
    campos.map((c) => [c.nombre, c.porDefecto ?? (c.tipo === "booleano" ? false : "")]),
  );
}

/** Convierte un registro de la BD en valores de formulario (todo a texto). */
export function valoresDesdeRegistro(
  campos: DefCampo[],
  registro: Record<string, unknown>,
): ValoresFormulario {
  return Object.fromEntries(
    campos.map((c) => {
      const v = registro[c.nombre];
      if (c.tipo === "booleano") return [c.nombre, Boolean(v)];
      if (v === null || v === undefined) return [c.nombre, ""];
      if (v instanceof Date) return [c.nombre, v.toISOString().slice(0, 10)];
      return [c.nombre, String(v)];
    }),
  );
}
