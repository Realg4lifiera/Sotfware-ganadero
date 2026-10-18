import { z } from "zod";

const opcional = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => v || null);

export const fincaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre.").max(100),
  departamento: opcional,
  municipio: opcional,
  vereda: opcional,
});
export type DatosFinca = z.input<typeof fincaSchema>;

export const crearFincaSchema = fincaSchema.extend({
  /** Id de la finca de la que se copian los parámetros ("" = valores por defecto). */
  copiarDe: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v > 0), "Finca no válida."),
});
export type CrearFinca = z.input<typeof crearFincaSchema>;
